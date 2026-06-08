import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback, parseDeadlineEn } from "./crawler-helper";

export class DaadCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "DAAD";
  sourceUrl = CRAWLER_CONFIG.daad.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.daad.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.daad.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "DAAD (German Academic Exchange Service)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Jerman"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penelitian",
        komponenPembiayaan: ["Monthly Stipend", "Travel Allowance", "Health Insurance"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.daad.baseUrl,
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
        namaBeasiswa: "DAAD Research Grants – Doctoral Programmes in Germany",
        penyelenggara: "DAAD (German Academic Exchange Service)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Jerman"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penelitian",
        komponenPembiayaan: ["Monthly Stipend", "Travel Allowance", "Health Insurance", "Research Grant"],
        keterangan: "DAAD menawarkan beasiswa penelitian doktoral di universitas-universitas Jerman untuk semua bidang keilmuan.",
        linkPendaftaran: CRAWLER_CONFIG.daad.listUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      }],
    });
  }
}
