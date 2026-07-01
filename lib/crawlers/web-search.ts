/**
 * WebSearchDiscoveryCrawler — penemuan sumber beasiswa S3 BARU via pencarian web.
 *
 * Mendukung 2 penyedia pencarian (pilih salah satu, Serper.dev diprioritaskan):
 *   1. Serper.dev  → set SERPER_API_KEY   (paling mudah, 1 key, hasil Google)
 *   2. Google CSE  → set GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX (cadangan)
 * Jika keduanya kosong, modul dilewati dengan aman.
 *
 * Tiap crawl: jalankan beberapa query → saring relevansi S3/PhD + beasiswa →
 * BUANG domain agregator/blog/generik → sisakan situs RESMI → PENDING_REVIEW.
 */
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeShortText, sanitizeText, sanitizeUrl } from "@/lib/utils/sanitize";
import { matchesDoctoral, matchesScholarship } from "./discovery-config";

/**
 * Query pencarian — memakai operator `site:` Google agar hasilnya LANGSUNG
 * dari domain resmi (universitas .edu/.ac.xx, pemerintah .go.xx), bukan
 * listicle/agregator yang biasa merajai query umum "fully funded scholarship".
 *
 * Campuran: TLD akademik besar (edu, ac.uk, edu.au, ac.id, ac.jp) + per prodi.
 * Ditambah beberapa query penyelenggara resmi non-akademik.
 */
export const SEARCH_QUERIES = [
  // ── Luar negeri, diarahkan ke domain resmi ────────────────────────
  "fully funded PhD scholarship 2026 site:edu",
  "PhD studentship 2026 fully funded site:ac.uk",
  "PhD scholarship international students 2026 site:edu.au",
  "PhD scholarship 2026 funded site:ac.jp",
  // ── DALAM NEGERI — universitas & pemerintah Indonesia ──────────────
  "beasiswa S3 doktor 2026 site:ac.id",             // universitas Indonesia
  "program doktor beasiswa 2026 site:ac.id",         // universitas Indonesia
  "beasiswa doktor dalam negeri 2026 site:go.id",    // pemerintah Indonesia
  "beasiswa S3 dosen 2026 site:go.id",               // pemerintah (dosen)
  // ── Per prodi UNU (di domain resmi) ────────────────────────────────
  "PhD scholarship Islamic studies 2026 funded site:edu",             // Studi Islam
  "PhD scholarship management accounting 2026 funded site:ac.uk",      // Manajemen, Akuntansi
  "PhD scholarship computer science 2026 funded site:edu",            // Informatika, Tek. Komputer
  "PhD studentship electrical engineering 2026 site:ac.uk",           // Teknik Elektro
  "PhD scholarship agriculture food science 2026 funded site:edu",    // THP, Agribisnis
  "PhD scholarship pharmacy 2026 funded site:edu",                    // Farmasi
  "PhD scholarship education teaching 2026 funded site:edu",          // PGSD, PBI
  // ── Penyelenggara resmi non-akademik (lolos via OFFICIAL_DOMAINS) ──
  "PhD scholarship 2026 fully funded government official",
];

/** Domain agregator/blog/generik yang dibuang secara eksplisit. */
export const EXCLUDED_DOMAINS = [
  "scholars4dev.com", "opportunitydesk.org", "scholarshipregion.com",
  "scholarship-positions.com", "scholarshippositions.com", "opportunitiesforyouth.org",
  "indbeasiswa.com", "beasiswapascasarjana.com", "scholarshipdb.net",
  "armacad.info", "opportunitiesforafricans.com", "youthop.com",
  "scholarshipair.com", "findaphd.com", "afterschoolafrica.com",
  "scholarshipscorner.website", "scholarshiproar.com", "fastweb.com", "scholarship.com",
  "pforphd.com", "wemakescholars.com", "applykite.com", "williamlebeau.com",
  "facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com",
  "youtube.com", "wikipedia.org", "reddit.com", "quora.com", "medium.com",
  "pinterest.com", "tiktok.com", "blogspot.com", "wordpress.com",
];

/**
 * Allowlist domain penyelenggara beasiswa RESMI yang memakai TLD non-akademik
 * (.org/.de/.nl/.se/dll). Domain akademik/pemerintah (.edu/.gov/.ac.xx/.go.id)
 * ditangani otomatis oleh pola TLD, jadi tak perlu didaftar di sini.
 * ⚠️ Admin bisa menambah domain resmi baru ke sini bila perlu.
 */
export const OFFICIAL_DOMAINS = [
  "chevening.org", "daad.de", "daadindonesia.org", "aminef.or.id",
  "campusfrance.org", "stipendiumhungaricum.hu", "isdb.org", "wur.nl",
  "searca.org", "adb.org", "sacm.org.sa", "nuffic.nl",
  "australiaawardsindonesia.org", "research.google", "microsoft.com",
  "fordfoundation.org", "britishcouncil.org", "britishcouncil.or.id",
  "seameo.org", "boell.de", "fes.de", "si.se", "amci.ma", "qf.org.qa",
  "akdn.org", "rotary.org", "campuschina.org", "gatescambridge.org",
  "wellcome.org", "commonwealth.org", "orangetulipscholarship.org",
  "daad-indonesia.org", "eiffel.campusfrance.org", "vlir.be",
];

/**
 * ALLOWLIST — hanya loloskan hasil yang JELAS dari situs resmi penyelenggara:
 *   (a) domain akademik/pemerintah (.edu, .gov, .ac.xx, .gov.xx, .go.id, .europa.eu), ATAU
 *   (b) domain penyelenggara resmi yang terdaftar (OFFICIAL_DOMAINS).
 * Selain itu DITOLAK — mencegah agregator/blog/komersial bocor (whack-a-mole).
 */
export function isLikelyOfficial(r: SearchResult): boolean {
  const d = r.domain;
  let path = "";
  try { path = new URL(r.link).pathname.toLowerCase(); } catch { /* ignore */ }

  // Hard-block: agregator dikenal, URL blog, judul listicle
  if (EXCLUDED_DOMAINS.some((x) => d.includes(x))) return false;
  if (/\/blogs?(\/|$)/.test(path) || path.startsWith("/blog")) return false;
  if (/^\s*(top\s+\d+|best\s+|how\s+to\s+|ultimate\s+guide|\d+\s+(best|top|fully|scholarship))/i.test(r.title)) return false;
  if (/best countries|list of|ultimate guide|cara mendapat/i.test(r.title)) return false;

  // (a) Domain akademik/pemerintah → resmi
  if (/\.(edu|gov)$/.test(d)) return true;
  if (/\.(ac|edu|gov|go|gouv|gc)\.[a-z]{2,3}$/.test(d)) return true;
  if (d === "europa.eu" || d.endsWith(".europa.eu")) return true;

  // (b) Penyelenggara resmi terdaftar
  if (OFFICIAL_DOMAINS.some((x) => d === x || d.endsWith("." + x))) return true;

  // Selain itu → tolak (kemungkinan agregator/blog/komersial)
  return false;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  domain: string;
}

export type SearchProvider = "serper" | "google" | null;

export function getSearchProvider(): SearchProvider {
  if (process.env.SERPER_API_KEY) return "serper";
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) return "google";
  return null;
}

function domainOf(link: string): string {
  try {
    return new URL(link).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Public suffix 2-level (mis. ac.uk, go.id, edu.au) agar domain terdaftar
// diambil benar: "brighton.ac.uk", "kemenag.go.id" — bukan "ac.uk"/"go.id".
const MULTI_SUFFIX = /\.(ac|co|go|gov|edu|or|net|sch|mil)\.[a-z]{2}$/;

/** Domain terdaftar (eTLD+1) — menangani TLD berlapis negara. */
export function registrableDomain(domain: string): string {
  const parts = domain.split(".");
  if (parts.length >= 3 && MULTI_SUFFIX.test(domain)) return parts.slice(-3).join(".");
  return parts.slice(-2).join(".");
}

/** Jalankan satu query di penyedia yang aktif → hasil ternormalisasi. */
export async function runSearch(query: string): Promise<SearchResult[]> {
  const provider = getSearchProvider();
  if (!provider) return [];

  if (provider === "serper") {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 10 }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);
    const data = await res.json();
    const organic: { title?: string; link?: string; snippet?: string }[] = data.organic ?? [];
    return organic
      .filter((o) => o.title && o.link)
      .map((o) => ({
        title: o.title!,
        link: o.link!,
        snippet: o.snippet ?? "",
        domain: domainOf(o.link!),
      }));
  }

  // provider === "google"
  const url =
    `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}` +
    `&cx=${process.env.GOOGLE_SEARCH_CX}&num=10&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? `Google HTTP ${res.status}`);
  }
  const data = await res.json();
  const items: { title?: string; link?: string; snippet?: string; displayLink?: string }[] =
    data.items ?? [];
  return items
    .filter((it) => it.title && it.link)
    .map((it) => ({
      title: it.title!,
      link: it.link!,
      snippet: it.snippet ?? "",
      domain: (it.displayLink ?? domainOf(it.link!)).toLowerCase().replace(/^www\./, ""),
    }));
}

/**
 * Pilih subset query untuk crawl ini — rotasi per jam + batasi jumlah
 * (GOOGLE_SEARCH_MAX_QUERIES, default 8) agar hemat kuota.
 */
export function selectQueries(now: number): string[] {
  const max = Math.max(1, parseInt(process.env.GOOGLE_SEARCH_MAX_QUERIES ?? "8"));
  if (max >= SEARCH_QUERIES.length) return SEARCH_QUERIES;
  const offset = Math.floor(now / 3_600_000) % SEARCH_QUERIES.length;
  const rotated = [...SEARCH_QUERIES.slice(offset), ...SEARCH_QUERIES.slice(0, offset)];
  return rotated.slice(0, max);
}

/** Apakah hasil layak jadi kandidat: relevan S3+beasiswa DAN dari situs resmi. */
export function isRelevantResult(r: SearchResult): boolean {
  const haystack = `${r.title} ${r.snippet}`;
  if (!matchesDoctoral(haystack) || !matchesScholarship(haystack)) return false;
  return isLikelyOfficial(r);
}

export class WebSearchDiscoveryCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Pencarian Web (Sumber Baru)";
  sourceUrl = "web-search";

  async crawl(): Promise<RawScholarship[]> {
    const provider = getSearchProvider();
    if (!provider) {
      console.warn(
        "[Web Search] Tidak ada penyedia pencarian aktif. Set SERPER_API_KEY " +
        "(disarankan) atau GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX di Vercel."
      );
      return [];
    }

    const seenLinks = new Set<string>();
    const domainCount = new Map<string, number>(); // batasi jumlah per domain
    const MAX_PER_DOMAIN = Math.max(1, parseInt(process.env.WEBSEARCH_MAX_PER_DOMAIN ?? "3"));
    const candidates: Partial<RawScholarship>[] = [];
    const queries = selectQueries(Date.now());

    for (const query of queries) {
      try {
        const results = await runSearch(query);
        for (const r of results) {
          const safeLink = sanitizeUrl(r.link);
          if (!safeLink || seenLinks.has(safeLink)) continue;
          if (!isRelevantResult(r)) continue;

          // Anti-redundansi domain: batasi maksimal N entri per website per crawl,
          // agar antrian tidak didominasi satu situs (mis. 10 halaman 1 universitas).
          const baseDomain = registrableDomain(r.domain);
          const count = domainCount.get(baseDomain) ?? 0;
          if (count >= MAX_PER_DOMAIN) continue;
          domainCount.set(baseDomain, count + 1);

          seenLinks.add(safeLink);
          const title = sanitizeShortText(r.title).slice(0, 200);
          const snippet = sanitizeText(r.snippet);
          const haystack = `${title} ${snippet}`;
          const lokasi: "DALAM_NEGERI" | "LUAR_NEGERI" =
            /\bindonesia\b|dalam negeri/i.test(haystack) ? "DALAM_NEGERI" : "LUAR_NEGERI";

          candidates.push({
            namaBeasiswa: title,
            penyelenggara: `Sumber web: ${r.domain}`,
            lokasi,
            pilihanLokasi: [],
            skemaPembiayaan: /fully funded|full scholarship|fully-funded/i.test(haystack)
              ? "Fully Funded"
              : "Perlu dicek",
            jenisPembiayaan: "Perlu dicek",
            komponenPembiayaan: [],
            keterangan:
              (snippet.slice(0, 500) || "Detail belum tersedia.") +
              `\n\n[Ditemukan via pencarian web dari situs ${r.domain}. ` +
              `Verifikasi & lengkapi detail dari situs resmi sebelum publish.]`,
            linkPendaftaran: safeLink,
            sumberCrawling: safeLink,
            deadline: null,
          });
        }
      } catch (err) {
        console.warn(`[Web Search] Error query "${query}": ${(err as Error).message}`);
      }
    }

    const valid: RawScholarship[] = [];
    for (const item of candidates) {
      const result = RawScholarshipSchema.safeParse(item);
      if (result.success) valid.push(result.data);
    }
    console.log(`[Web Search] ${valid.length} kandidat sumber baru (provider: ${provider}, ${queries.length} query).`);
    return valid;
  }
}
