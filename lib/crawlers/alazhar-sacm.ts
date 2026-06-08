/**
 * Crawler: Al-Azhar University & Saudi Cultural Mission (SACM)
 * PALING relevan untuk prodi Studi Islam Interdisipliner UNU Yogyakarta.
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

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
          namaBeasiswa: "Al-Azhar University Scholarship — Program Doktor (S3)",
          penyelenggara: "Universitas Al-Azhar — Mesir",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Mesir (Kairo)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi Mahasiswa", "Tiket Pesawat PP", "Akses Perpustakaan & Riset"],
          keterangan: "Al-Azhar adalah universitas Islam tertua dan paling bergengsi di dunia. Program doktor: Ushuluddin, Syariah, Bahasa Arab, Dirasat Islamiyah, Tarbiyah Islam, Ekonomi Islam. Koneksi historis NU–Al-Azhar sangat kuat. Pendaftaran melalui Kemenag RI. Bahasa pengantar: Arab.",
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
          keterangan: "SACM untuk studi doktor di universitas Arab Saudi: Universitas Islam Madinah, King Abdulaziz, King Faisal, King Saud. Bidang: Studi Islam, Syariah, Bahasa Arab, Ekonomi Islam, Pendidikan Islam.",
          linkPendaftaran: "https://www.sacm.org.sa",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Moroccan Government Scholarship — Doctoral Programme",
          penyelenggara: "Pemerintah Kerajaan Maroko / AMCI",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Maroko (Rabat, Casablanca, Fes, Marrakech)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi", "Asuransi Kesehatan"],
          keterangan: "Maroko menawarkan beasiswa doktor melalui AMCI untuk studi di universitas Maroko. Bidang: Studi Islam, Bahasa Arab, Hukum Islam, Filsafat. Pendaftaran via Kedubes Maroko Jakarta.",
          linkPendaftaran: "https://www.amci.ma",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Jordanian Government Scholarship — Doctoral in Islamic Studies",
          penyelenggara: "Pemerintah Yordania / Kementerian Pendidikan Tinggi Yordania",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Yordania (Amman, Zarqa, Irbid)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi", "Asuransi Kesehatan"],
          keterangan: "Beasiswa pemerintah Yordania untuk studi doktor bidang keislaman di universitas-universitas Yordania. Tersedia di Universitas Yordania, Universitas Yarmouk, dan JUST. Bahasa pengantar: Arab.",
          linkPendaftaran: "https://mohe.gov.jo",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Qatar Foundation Graduate Scholarship — Islamic & Social Studies",
          penyelenggara: "Qatar Foundation / Hamad Bin Khalifa University",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Qatar (Doha)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi", "Asuransi Kesehatan", "Tiket Pesawat PP"],
          keterangan: "Qatar Foundation menyediakan beasiswa doktor di Hamad Bin Khalifa University untuk studi Islam, hukum Islam, ilmu sosial, dan humaniora. Qatar memiliki fasilitas riset yang sangat baik.",
          linkPendaftaran: "https://www.qf.org.qa/education/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
