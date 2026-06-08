import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class CheveningCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Chevening";
  sourceUrl = CRAWLER_CONFIG.chevening.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.chevening.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().attr("datetime") ?? $(el).find(cfg.deadline).first().text();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.chevening.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama || "Chevening Scholarship",
        penyelenggara: "UK Government / FCDO",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Inggris"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Tuition Fees", "Living Expenses", "Return Flights", "Visa Costs"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.chevening.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: deadlineRaw ? new Date(deadlineRaw.trim()) : null,
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
        namaBeasiswa: "Chevening Scholarships",
        penyelenggara: "UK Government / Foreign, Commonwealth & Development Office",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Inggris"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Tuition Fees", "Living Expenses", "Return Flights", "Visa Costs", "Arrival Allowance"],
        keterangan: "Chevening adalah program beasiswa internasional pemerintah Inggris untuk individu berbakat dari seluruh dunia.",
        linkPendaftaran: CRAWLER_CONFIG.chevening.listUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      }],
    });
  }
}
