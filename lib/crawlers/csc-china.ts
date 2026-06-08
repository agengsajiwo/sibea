import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class CscChinaCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "CSC China";
  sourceUrl = CRAWLER_CONFIG.cscChina.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.cscChina.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.cscChina.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "China Scholarship Council (CSC) / Pemerintah China",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["China"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Akomodasi Asrama", "Tunjangan Hidup Bulanan (CNY 3.500)", "Asuransi Kesehatan", "Tiket Pesawat PP"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.cscChina.baseUrl,
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
        namaBeasiswa: "Chinese Government Scholarship (CSC) — Embassy Recommendation",
        penyelenggara: "China Scholarship Council (CSC) / Pemerintah Tiongkok",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["China"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Akomodasi Asrama", "Tunjangan Hidup (CNY 3.500/bulan)", "Asuransi Kesehatan Komprehensif", "Tiket Pesawat PP"],
        keterangan: "Beasiswa Pemerintah China jalur Kedutaan untuk program doktor di 270+ universitas di China.",
        linkPendaftaran: CRAWLER_CONFIG.cscChina.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      }],
    });
  }
}
