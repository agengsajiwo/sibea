import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class ErasmusMundusCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Erasmus Mundus";
  sourceUrl = CRAWLER_CONFIG.erasmusMundus.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.erasmusMundus.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().attr("datetime") ?? $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.erasmusMundus.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: `Erasmus Mundus Joint Doctorate: ${nama}`,
        penyelenggara: "European Commission (Erasmus+)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Eropa (multi-negara)"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Doktor Bersama (Joint Doctorate)",
        komponenPembiayaan: ["Living Allowance (€1.500/bulan)", "Travel & Installation Costs", "Research Costs", "Tuition Fees"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.erasmusMundus.baseUrl,
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
        namaBeasiswa: "Erasmus Mundus Joint Doctorate (EMJD)",
        penyelenggara: "European Commission — Erasmus+ Programme",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Eropa (multi-negara)", "Prancis", "Jerman", "Belanda", "Italia", "Spanyol"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Doktor Bersama",
        komponenPembiayaan: ["Living Allowance (€1.500/bulan)", "Travel & Installation Grant", "Research & Training Costs", "Tuition Fees", "Asuransi Kesehatan"],
        keterangan: "Erasmus Mundus Joint Doctorate dari Komisi Eropa. Mahasiswa belajar di ≥2 universitas Eropa dan mendapat gelar doktor bersama.",
        linkPendaftaran: CRAWLER_CONFIG.erasmusMundus.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      }],
    });
  }
}
