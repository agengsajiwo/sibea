import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class TurkiyeBurslariCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Türkiye Bursları";
  sourceUrl = CRAWLER_CONFIG.turkiyeBurslari.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.turkiyeBurslari.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.turkiyeBurslari.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Pemerintah Republik Turki (Türkiye Bursları)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Turki"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi Asrama", "Asuransi Kesehatan", "Tiket Pesawat PP", "Kursus Bahasa Turki"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.turkiyeBurslari.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      });
    });
    return results;
  }

  async crawl(): Promise<RawScholarship[]> {
    return crawlWithFallback({
      name: this.name,
      fetchAndParse: async () => {
        if (!await this.isAllowedByRobots(this.sourceUrl)) return [];
        return this.parse(await this.fetchWithRetry(this.sourceUrl));
      },
      staticEntries: [{
        namaBeasiswa: "Türkiye Bursları — Doctorate Scholarship",
        penyelenggara: "Pemerintah Republik Turki (Türkiye Bursları / YTB)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Turki"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi Asrama", "Asuransi Kesehatan", "Tiket Pesawat PP", "Kursus Bahasa Turki (1 tahun)"],
        keterangan: "Türkiye Bursları program beasiswa resmi pemerintah Turki. Populer di kalangan NU/pesantren. Deadline biasanya Februari.",
        linkPendaftaran: CRAWLER_CONFIG.turkiyeBurslari.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      }],
    });
  }
}
