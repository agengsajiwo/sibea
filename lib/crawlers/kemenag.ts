import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback, parseDeadlineId } from "./crawler-helper";

export class KemenagCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Kemenag 5000 Doktor";
  sourceUrl = CRAWLER_CONFIG.kemenag.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.kemenag.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text()) || "Beasiswa 5000 Doktor Kemenag";
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.kemenag.baseUrl}${href}`;
      const isLuarNegeri = /luar negeri|overseas|international|abroad/i.test(keterangan + nama);
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Kementerian Agama Republik Indonesia",
        lokasi: isLuarNegeri ? "LUAR_NEGERI" : "DALAM_NEGERI",
        pilihanLokasi: isLuarNegeri ? ["Timur Tengah", "Eropa", "Asia"] : ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Pendidikan", "Biaya Hidup Bulanan", "Biaya Penelitian", "Biaya Buku"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.kemenag.baseUrl,
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
          namaBeasiswa: "Beasiswa 5000 Doktor Kemenag — Dalam Negeri",
          penyelenggara: "Kementerian Agama Republik Indonesia",
          lokasi: "DALAM_NEGERI",
          pilihanLokasi: ["Seluruh Indonesia"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Pendidikan", "Biaya Hidup Bulanan", "Biaya Penelitian", "Biaya Buku"],
          keterangan: "Program Beasiswa 5000 Doktor Kemenag untuk dosen PTKI yang belum bergelar doktor.",
          linkPendaftaran: CRAWLER_CONFIG.kemenag.baseUrl,
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Beasiswa 5000 Doktor Kemenag — Luar Negeri",
          penyelenggara: "Kementerian Agama Republik Indonesia",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Mesir", "Arab Saudi", "Maroko", "Yordania", "Malaysia"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Pendidikan", "Biaya Hidup", "Tiket Pesawat PP", "Asuransi Kesehatan"],
          keterangan: "Program Beasiswa 5000 Doktor Kemenag jalur luar negeri untuk dosen PTKI.",
          linkPendaftaran: CRAWLER_CONFIG.kemenag.baseUrl,
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
