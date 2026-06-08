/**
 * Crawler: ADB-JSP — Asian Development Bank Japan Scholarship Program
 * Relevan: Manajemen, Akuntansi, Agribisnis, Ekonomi Pembangunan
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class AdbJspCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "ADB-JSP";
  sourceUrl = CRAWLER_CONFIG.adbJsp.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.adbJsp.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.adbJsp.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Asian Development Bank (ADB) & Japan Scholarship Program",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Jepang", "Filipina", "Thailand", "India", "Singapura"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.adbJsp.baseUrl,
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
      staticEntries: [
        {
          namaBeasiswa: "ADB–Japan Scholarship Program (JSP) — Doctoral in Economics & Management",
          penyelenggara: "Asian Development Bank (ADB) & Pemerintah Jepang",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Jepang", "Filipina", "Thailand", "India", "Singapura", "Pakistan", "Sri Lanka"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian", "Tunjangan Disertasi"],
          keterangan: "ADB-JSP untuk bidang ekonomi pembangunan, manajemen, kebijakan publik, dan ilmu sosial terapan. Studi di universitas mitra ADB seperti Hitotsubashi University, Asian Institute of Management, IIM Ahmedabad. Peserta wajib kembali ke negara asal.",
          linkPendaftaran: "https://www.adb.org/site/careers/japan-scholarship-program",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "ADB–Japan Scholarship Program (JSP) — Doctoral in Agriculture & Environment",
          penyelenggara: "Asian Development Bank (ADB) & Pemerintah Jepang",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Jepang", "Filipina", "Thailand"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian"],
          keterangan: "ADB-JSP untuk bidang pertanian, lingkungan hidup, energi, dan pembangunan pedesaan. Cocok untuk prodi Agribisnis dan Teknologi Hasil Pertanian UNU Yogyakarta.",
          linkPendaftaran: "https://www.adb.org/site/careers/japan-scholarship-program",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
