import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class AustraliaAwardsCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Australia Awards";
  sourceUrl = CRAWLER_CONFIG.australiaAwards.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.australiaAwards.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.australiaAwards.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Australian Government – DFAT",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Australia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Tuition Fees", "Return Air Travel", "Establishment Allowance", "Contribution to Living Expenses", "Overseas Student Health Cover"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.australiaAwards.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: deadlineRaw ? new Date(deadlineRaw) : null,
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
        namaBeasiswa: "Australia Awards Scholarships",
        penyelenggara: "Australian Government – Department of Foreign Affairs and Trade",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Australia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Tuition Fees", "Return Air Travel", "Establishment Allowance", "Contribution to Living Expenses", "Overseas Student Health Cover"],
        keterangan: "Australia Awards adalah beasiswa bergengsi pemerintah Australia untuk warga negara berkembang termasuk Indonesia.",
        linkPendaftaran: CRAWLER_CONFIG.australiaAwards.listUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      }],
    });
  }
}
