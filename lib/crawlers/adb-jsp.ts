/**
 * Crawler: ADB–JSP (Asian Development Bank — Japan Scholarship Program)
 * URL: https://www.adb.org/site/careers/japan-scholarship-program
 *
 * Relevan untuk: Manajemen, Akuntansi, Agribisnis, Ekonomi Pembangunan,
 *               Kebijakan Publik, Studi Islam (ekonomi Islam & pembangunan)
 * Studi di universitas mitra ADB terbaik di Asia.
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

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
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.adbJsp.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Asian Development Bank (ADB) & Japan Scholarship Program",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Jepang", "Filipina", "Thailand", "India", "Singapura", "Pakistan"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Buku & Penelitian", "Tunjangan Tesis"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.adbJsp.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadline(deadlineRaw),
      });
    });

    if (results.length === 0) results.push(...this.getStaticEntries());
    return results;
  }

  private getStaticEntries(): Partial<RawScholarship>[] {
    return [{
      namaBeasiswa: "ADB–Japan Scholarship Program (JSP) — Doctoral",
      penyelenggara: "Asian Development Bank (ADB) & Pemerintah Jepang",
      lokasi: "LUAR_NEGERI",
      pilihanLokasi: ["Jepang", "Filipina", "Thailand", "India", "Singapura", "Pakistan", "Sri Lanka"],
      skemaPembiayaan: "Fully Funded",
      jenisPembiayaan: "Beasiswa Penuh",
      komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP (Ekonomi)", "Asuransi Kesehatan", "Dana Buku & Penelitian", "Tunjangan Tesis/Disertasi", "Biaya Visa"],
      keterangan: "ADB-JSP adalah program beasiswa bergengsi didanai pemerintah Jepang dan dikelola Asian Development Bank. Program doktor tersedia untuk: ekonomi pembangunan, manajemen, kebijakan publik, agribisnis, lingkungan hidup, dan ilmu sosial terapan. Peserta harus bekerja di sektor pembangunan dan bersedia kembali ke negara asal. Tersedia di 10 universitas mitra ADB terbaik di Asia. Pendaftaran melalui universitas mitra. Sangat relevan untuk prodi Manajemen, Akuntansi, Agribisnis UNU Yogyakarta.",
      linkPendaftaran: "https://www.adb.org/site/careers/japan-scholarship-program",
      sumberCrawling: this.sourceUrl,
      deadline: null,
    }];
  }

  async crawl(): Promise<RawScholarship[]> {
    if (!(await this.isAllowedByRobots(this.sourceUrl))) return [];
    const html = await this.fetchWithRetry(this.sourceUrl);
    const raw = this.parse(html);
    const valid: RawScholarship[] = [];
    for (const item of raw) {
      const result = RawScholarshipSchema.safeParse(item);
      if (result.success) valid.push(result.data);
    }
    await this.closeBrowser();
    return valid;
  }
}

function parseDeadline(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d;
}
