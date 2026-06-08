import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback, parseDeadlineId } from "./crawler-helper";

export class BrinCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "BRIN";
  sourceUrl = CRAWLER_CONFIG.brin.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.brin.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.brin.baseUrl}${href}`;
      const isLuarNegeri = /luar negeri|overseas|international/i.test(keterangan + nama);
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Badan Riset dan Inovasi Nasional (BRIN)",
        lokasi: isLuarNegeri ? "LUAR_NEGERI" : "DALAM_NEGERI",
        pilihanLokasi: isLuarNegeri ? ["Berbagai Negara"] : ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Riset",
        komponenPembiayaan: ["Biaya Pendidikan", "Biaya Hidup", "Dana Riset", "Biaya Publikasi"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.brin.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadlineId(deadlineRaw),
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
      staticEntries: [
        {
          namaBeasiswa: "BRIN Beasiswa Program Doktor",
          penyelenggara: "Badan Riset dan Inovasi Nasional (BRIN)",
          lokasi: "DALAM_NEGERI",
          pilihanLokasi: ["Seluruh Indonesia"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset",
          komponenPembiayaan: ["Biaya Pendidikan", "Tunjangan Hidup", "Dana Penelitian", "Biaya Publikasi"],
          keterangan: "BRIN menyediakan beasiswa doktor bagi peneliti dan dosen untuk memperkuat kompetensi riset.",
          linkPendaftaran: CRAWLER_CONFIG.brin.baseUrl,
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "BRIN Co-promotion Doctoral Program",
          penyelenggara: "Badan Riset dan Inovasi Nasional (BRIN)",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Belanda", "Australia", "Jerman", "Jepang", "Amerika Serikat"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset Co-promotion",
          komponenPembiayaan: ["Biaya Pendidikan", "Tunjangan Hidup", "Tiket Pesawat PP", "Asuransi Kesehatan"],
          keterangan: "Program co-promotion BRIN dengan dua promotor: satu dari Indonesia dan satu dari universitas mitra luar negeri.",
          linkPendaftaran: CRAWLER_CONFIG.brin.baseUrl,
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
