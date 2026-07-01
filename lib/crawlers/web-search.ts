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

/** Query pencarian — mencakup semua prodi UNU + umum. */
export const SEARCH_QUERIES = [
  "fully funded PhD scholarship 2026 international students apply",
  "PhD scholarship 2026 for Indonesian students fully funded",
  "government PhD scholarship 2026 developing countries fully funded",
  "beasiswa S3 luar negeri 2026 fully funded dosen",
  "beasiswa doktor dalam negeri 2026",
  "PhD scholarship Islamic studies 2026 fully funded",                 // Studi Islam
  "PhD scholarship management accounting business 2026 fully funded",  // Manajemen, Akuntansi
  "PhD scholarship computer science informatics 2026 fully funded",    // Informatika, Tek. Komputer
  "PhD scholarship electrical engineering 2026 fully funded",          // Teknik Elektro
  "PhD scholarship agriculture food technology 2026 fully funded",     // THP, Agribisnis
  "PhD scholarship pharmacy pharmaceutical sciences 2026 fully funded",// Farmasi
  "PhD scholarship education primary teaching 2026 fully funded",       // PGSD
  "PhD scholarship English language teaching TESOL 2026 fully funded", // PBI
];

/** Domain agregator/blog/generik yang dibuang — hanya situs resmi yang lolos. */
export const EXCLUDED_DOMAINS = [
  "scholars4dev.com", "opportunitydesk.org", "scholarshipregion.com",
  "scholarship-positions.com", "scholarshippositions.com", "opportunitiesforyouth.org",
  "indbeasiswa.com", "beasiswapascasarjana.com", "scholarshipdb.net",
  "armacad.info", "opportunitiesforafricans.com", "youthop.com",
  "scholarshipair.com", "findaphd.com", "afterschoolafrica.com",
  "scholarshipscorner.website", "scholarshiproar.com", "fastweb.com", "scholarship.com",
  "facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com",
  "youtube.com", "wikipedia.org", "reddit.com", "quora.com", "medium.com",
  "pinterest.com", "tiktok.com", "blogspot.com", "wordpress.com",
];

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

/** Apakah hasil pencarian layak jadi kandidat beasiswa S3 dari situs resmi. */
export function isRelevantResult(r: SearchResult): boolean {
  if (EXCLUDED_DOMAINS.some((d) => r.domain.includes(d))) return false;
  const haystack = `${r.title} ${r.snippet}`;
  return matchesDoctoral(haystack) && matchesScholarship(haystack);
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
    const candidates: Partial<RawScholarship>[] = [];
    const queries = selectQueries(Date.now());

    for (const query of queries) {
      try {
        const results = await runSearch(query);
        for (const r of results) {
          const safeLink = sanitizeUrl(r.link);
          if (!safeLink || seenLinks.has(safeLink)) continue;
          if (!isRelevantResult(r)) continue;

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
