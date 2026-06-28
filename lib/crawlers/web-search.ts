/**
 * WebSearchDiscoveryCrawler — penemuan sumber beasiswa S3 BARU via pencarian web.
 *
 * Setiap crawl, modul ini menjalankan beberapa query pencarian (Google
 * Programmable Search / Custom Search JSON API), menyaring hasil yang relevan
 * dengan program doktor (S3/PhD), MEMBUANG situs agregator/blog, lalu
 * menyisakan tautan dari SITUS RESMI penyelenggara untuk ditinjau admin.
 *
 * Inilah mekanisme "menemukan sumber yang belum pernah ada": query web terbuka
 * memunculkan halaman beasiswa resmi yang belum kita punya crawler-nya.
 *
 * Konfigurasi (set di Vercel → Environment Variables):
 *   GOOGLE_SEARCH_API_KEY = API key Google Custom Search
 *   GOOGLE_SEARCH_CX      = Search Engine ID (cx) dari Programmable Search Engine
 * Jika belum diset, modul ini dilewati dengan aman (tidak error).
 */
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeShortText, sanitizeText, sanitizeUrl } from "@/lib/utils/sanitize";
import { matchesDoctoral, matchesScholarship } from "./discovery-config";

/** Query pencarian — campuran S3 internasional & Indonesia, fokus fully funded. */
export const SEARCH_QUERIES = [
  "fully funded PhD scholarship 2026 international students apply",
  "PhD scholarship 2026 for Indonesian students fully funded",
  "doctoral scholarship 2026 fully funded university apply",
  "government PhD scholarship 2026 developing countries",
  "beasiswa S3 luar negeri 2026 fully funded",
  "beasiswa doktor 2026 dosen dalam negeri",
];

/**
 * Domain yang DIBUANG dari hasil — agregator/blog beasiswa & situs generik.
 * Tujuan: hanya menyisakan situs RESMI penyelenggara (pemerintah, universitas,
 * yayasan, kedutaan), sesuai permintaan "tanpa agregator".
 */
export const EXCLUDED_DOMAINS = [
  // Agregator / blog beasiswa
  "scholars4dev.com", "opportunitydesk.org", "scholarshipregion.com",
  "scholarship-positions.com", "scholarshippositions.com", "opportunitiesforyouth.org",
  "indbeasiswa.com", "beasiswapascasarjana.com", "scholarshipdb.net",
  "armacad.info", "opportunitiesforafricans.com", "youthop.com",
  "scholarshipair.com", "findaphd.com", "afterschoolafrica.com",
  "scholarshipscorner.website", "scholarshippositions.com", "scholarshiproar.com",
  "opportunitiesforafrican.com", "fastweb.com", "scholarship.com",
  // Situs generik / non-penyelenggara
  "facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com",
  "youtube.com", "wikipedia.org", "reddit.com", "quora.com", "medium.com",
  "pinterest.com", "tiktok.com", "blogspot.com", "wordpress.com",
];

interface GoogleSearchItem {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
}

export class WebSearchDiscoveryCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Pencarian Web (Sumber Baru)";
  sourceUrl = "https://www.googleapis.com/customsearch/v1";

  async crawl(): Promise<RawScholarship[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      console.warn(
        "[Web Search] GOOGLE_SEARCH_API_KEY / GOOGLE_SEARCH_CX belum diset — " +
        "penemuan sumber baru via web dilewati. Set di Vercel Environment Variables."
      );
      return [];
    }

    const seenLinks = new Set<string>();
    const candidates: Partial<RawScholarship>[] = [];

    for (const query of SEARCH_QUERIES) {
      try {
        const url =
          `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}` +
          `&num=10&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          console.warn(`[Web Search] Query gagal (HTTP ${res.status}): "${query}"`);
          continue;
        }
        const data = await res.json();
        const items: GoogleSearchItem[] = Array.isArray(data.items) ? data.items : [];

        for (const it of items) {
          const title = sanitizeShortText(it.title ?? "");
          const rawLink = it.link ?? "";
          const snippet = sanitizeText(it.snippet ?? "");
          const domain = (it.displayLink ?? "").toLowerCase().replace(/^www\./, "");

          if (!title || !rawLink) continue;
          const safeLink = sanitizeUrl(rawLink);
          if (!safeLink) continue;

          // Buang agregator/blog/situs generik → hanya situs resmi yang lolos
          if (EXCLUDED_DOMAINS.some((d) => domain.includes(d))) continue;
          if (seenLinks.has(safeLink)) continue;

          // Harus relevan doktor (S3/PhD) DAN terkait beasiswa
          const haystack = `${title} ${snippet}`;
          if (!matchesDoctoral(haystack)) continue;
          if (!matchesScholarship(haystack)) continue;

          seenLinks.add(safeLink);
          const lokasi: "DALAM_NEGERI" | "LUAR_NEGERI" =
            /\bindonesia\b|dalam negeri/i.test(haystack) ? "DALAM_NEGERI" : "LUAR_NEGERI";

          candidates.push({
            namaBeasiswa: title.slice(0, 200),
            penyelenggara: `Sumber web: ${domain}`,
            lokasi,
            pilihanLokasi: [],
            skemaPembiayaan: /fully funded|full scholarship|fully-funded/i.test(haystack)
              ? "Fully Funded"
              : "Perlu dicek",
            jenisPembiayaan: "Perlu dicek",
            komponenPembiayaan: [],
            keterangan:
              (snippet.slice(0, 500) || "Detail belum tersedia.") +
              `\n\n[Ditemukan via pencarian web dari situs ${domain}. ` +
              `Verifikasi & lengkapi detail dari situs resmi sebelum publish.]`,
            linkPendaftaran: safeLink,
            sumberCrawling: safeLink, // sumber = halaman resmi, bukan agregator
            deadline: null,
          });
        }
      } catch (err) {
        console.warn(`[Web Search] Error query "${query}": ${(err as Error).message}`);
      }
    }

    // Validasi Zod
    const valid: RawScholarship[] = [];
    for (const item of candidates) {
      const result = RawScholarshipSchema.safeParse(item);
      if (result.success) valid.push(result.data);
    }
    console.log(`[Web Search] ${valid.length} kandidat sumber baru ditemukan dari ${SEARCH_QUERIES.length} query.`);
    return valid;
  }
}
