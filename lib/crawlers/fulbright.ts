import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class FulbrightCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Fulbright";
  sourceUrl = CRAWLER_CONFIG.fulbright.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.fulbright.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.fulbright.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "AMINEF / US Government",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Amerika Serikat"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Tuition and Fees", "Monthly Maintenance Allowance", "Round-trip Air Travel", "Health Insurance"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.fulbright.baseUrl,
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
        namaBeasiswa: "Fulbright Presidential Scholarship",
        penyelenggara: "American Indonesian Exchange Foundation (AMINEF) / US Government",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Amerika Serikat"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Tuition and Fees", "Monthly Maintenance Allowance", "Round-trip Air Travel", "Health Insurance", "Book and Research Allowance"],
        keterangan: "Program Fulbright untuk WNI melanjutkan S3 di Amerika Serikat melalui AMINEF.",
        linkPendaftaran: CRAWLER_CONFIG.fulbright.listUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      }],
    });
  }
}
