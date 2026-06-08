/**
 * Crawler: Al-Azhar University & Saudi Cultural Mission (SACM)
 * URL Al-Azhar : https://www.azhar.edu.eg/en/international-students
 * URL SACM     : https://www.sacm.org.sa
 *
 * PALING relevan untuk prodi Studi Islam Interdisipliner UNU Yogyakarta.
 * Koneksi NU dengan Al-Azhar sangat kuat secara historis.
 * SACM membuka akses ke universitas-universitas Islam di Arab Saudi.
 *
 * ⚠️  Kedua situs sering berubah dan berbahasa Arab.
 *     Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class AlAzharCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Al-Azhar & SACM";
  sourceUrl = CRAWLER_CONFIG.alAzharSacm.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.alAzharSacm.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.alAzharSacm.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Universitas Al-Azhar Mesir",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Mesir"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi", "Tiket Pesawat PP"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.alAzharSacm.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadline(deadlineRaw),
      });
    });

    if (results.length === 0) results.push(...this.getStaticEntries());
    return results;
  }

  private getStaticEntries(): Partial<RawScholarship>[] {
    return [
      {
        namaBeasiswa: "Al-Azhar University Scholarship — Program Doktor (S3)",
        penyelenggara: "Universitas Al-Azhar — Mesir",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Mesir (Kairo)"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi Mahasiswa", "Tiket Pesawat PP", "Akses Perpustakaan & Riset"],
        keterangan: "Al-Azhar adalah universitas Islam tertua dan paling bergengsi di dunia, berlokasi di Kairo. Program doktor tersedia di: Ushuluddin, Syariah, Bahasa Arab, Dirasat Islamiyah, Tarbiyah Islam, dan Ekonomi Islam. Koneksi historis NU dengan Al-Azhar sangat kuat — banyak ulama NU alumni Al-Azhar. Pendaftaran melalui Kemenag RI atau langsung ke Al-Azhar. Bahasa pengantar: Arab.",
        linkPendaftaran: "https://www.azhar.edu.eg/en/international-students",
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
      {
        namaBeasiswa: "Saudi Cultural Mission (SACM) — Doctoral Scholarship",
        penyelenggara: "Saudi Cultural Mission (SACM) / Pemerintah Arab Saudi",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Arab Saudi (Riyadh, Jeddah, Madinah, Makkah)"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (SAR 1.900)", "Akomodasi/Tunjangan Perumahan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Tunjangan Buku"],
        keterangan: "SACM menyediakan beasiswa doktor di universitas Arab Saudi: Universitas Islam Madinah, King Abdulaziz, King Faisal, King Saud. Bidang: Studi Islam, Syariah, Bahasa Arab, Ekonomi Islam, Pendidikan Islam. Sangat relevan untuk prodi Studi Islam Interdisipliner UNU Yogyakarta.",
        linkPendaftaran: "https://www.sacm.org.sa",
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
      {
        namaBeasiswa: "Moroccan Government Scholarship — Doctoral (Maroko)",
        penyelenggara: "Pemerintah Kerajaan Maroko / AMCI",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Maroko (Rabat, Casablanca, Fes)"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi", "Asuransi Kesehatan"],
        keterangan: "Maroko menawarkan beasiswa doktor melalui AMCI untuk studi di universitas Maroko. Bidang: Studi Islam, Bahasa Arab, Hukum Islam, Filsafat, Sosial. Pendaftaran melalui Kedutaan Maroko di Jakarta. Bahasa: Arab dan Prancis.",
        linkPendaftaran: "https://www.amci.ma",
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
    ];
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
