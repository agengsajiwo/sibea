/**
 * RssDiscoveryCrawler — menemukan beasiswa DOKTOR baru dari RSS feed agregator.
 *
 * Alur:
 * 1. Fetch RSS/Atom feed (XML)
 * 2. Parse setiap <item>/<entry>
 * 3. Saring: hanya item yang relevan dengan PhD/doktor DAN beasiswa
 * 4. Map ke RawScholarship → masuk antrian PENDING_REVIEW untuk dikurasi admin
 *
 * Karena kualitas data agregator bervariasi, SEMUA hasil discovery wajib
 * ditinjau admin sebelum publish (deadline & detail sering perlu dilengkapi manual).
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";
import { DiscoveryFeed, matchesDoctoral, matchesDoctoralStrong, matchesScholarship } from "./discovery-config";

export class RssDiscoveryCrawler extends BaseCrawler implements ScholarshipCrawler {
  name: string;
  sourceUrl: string;
  private feed: DiscoveryFeed;

  constructor(feed: DiscoveryFeed) {
    super(`Discovery: ${feed.name}`, feed.feedUrl);
    this.name = `Discovery: ${feed.name}`;
    this.sourceUrl = feed.feedUrl;
    this.feed = feed;
  }

  /** Parse RSS/Atom XML → kandidat beasiswa yang relevan dgn doktor */
  parse(xml: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(xml, { xmlMode: true });
    const results: Partial<RawScholarship>[] = [];

    // RSS pakai <item>, Atom pakai <entry>
    const items = $("item").length > 0 ? $("item") : $("entry");

    items.each((_, el) => {
      const $el = $(el);
      const title = sanitizeShortText($el.find("title").first().text());

      // Link: RSS pakai <link>text, Atom pakai <link href="...">
      let link = $el.find("link").first().text().trim();
      if (!link) link = $el.find("link").first().attr("href")?.trim() ?? "";

      // Deskripsi: RSS <description>/<content:encoded>, Atom <summary>/<content>
      const rawDesc =
        $el.find("description").first().text() ||
        $el.find("summary").first().text() ||
        $el.find("content").first().text();
      const deskripsi = sanitizeText(rawDesc);

      if (!title || !link) return;

      const haystack = `${title} ${deskripsi}`.toLowerCase();

      // SARING DOKTOR: dilewati jika feed sudah khusus PhD (assumeDoctoral).
      // Untuk feed umum: relevan doktor bila JUDUL cocok (termasuk pola "S3"),
      // atau BODY mengandung kata kunci kuat (PhD/doktor) — bukan bare "S3"
      // agar tidak terjebak crosslink "Baca juga: Beasiswa S3 ..." di body.
      if (!this.feed.assumeDoctoral) {
        const doctoral = matchesDoctoral(title) || matchesDoctoralStrong(deskripsi);
        if (!doctoral) return;
        if (!matchesScholarship(haystack)) return;
      }

      const safeLink = sanitizeUrl(link);
      if (!safeLink) return;

      // Inferensi lokasi: default dari feed, override jika menyebut Indonesia
      const lokasi: "DALAM_NEGERI" | "LUAR_NEGERI" =
        /\bindonesia\b|dalam negeri/i.test(haystack) ? "DALAM_NEGERI" : this.feed.defaultLokasi;

      results.push({
        namaBeasiswa: title,
        penyelenggara: `Ditemukan via ${this.feed.name}`,
        lokasi,
        pilihanLokasi: [],
        skemaPembiayaan: /fully funded|full scholarship|fully-funded/i.test(haystack)
          ? "Fully Funded"
          : "Perlu dicek",
        jenisPembiayaan: "Perlu dicek",
        komponenPembiayaan: [],
        // Batasi panjang keterangan; admin akan melengkapi
        keterangan:
          (deskripsi.slice(0, 600) || "Detail belum tersedia.") +
          `\n\n[Ditemukan otomatis via feed ${this.feed.name}. Verifikasi & lengkapi detail dari sumber asli sebelum publish.]`,
        linkPendaftaran: safeLink,
        sumberCrawling: this.feed.feedUrl,
        deadline: null, // RSS jarang punya deadline terstruktur — diisi admin
      });
    });

    return results;
  }

  async crawl(): Promise<RawScholarship[]> {
    return crawlWithFallback({
      name: this.name,
      fetchAndParse: async () => {
        // Feed publik umumnya boleh diakses; tetap hormati robots.txt
        if (!(await this.isAllowedByRobots(this.sourceUrl))) return [];
        const xml = await this.fetchWithRetry(this.sourceUrl);
        return this.parse(xml);
      },
      // Discovery TIDAK punya data statis — kalau feed gagal, kembalikan kosong.
      // (tidak ada gunanya fallback hardcoded untuk mekanisme penemuan)
      staticEntries: [],
    });
  }
}
