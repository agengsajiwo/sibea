/**
 * Crawler: SEARCA — Southeast Asian Regional Center for Graduate Study
 * Relevan: Teknologi Hasil Pertanian, Agribisnis, Farmasi
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class SearcaCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "SEARCA";
  sourceUrl = CRAWLER_CONFIG.searca.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.searca.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.searca.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "SEARCA (Southeast Asian Regional Center for Graduate Study and Research in Agriculture)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Filipina", "Thailand", "Malaysia", "Vietnam", "Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Riset",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.searca.baseUrl,
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
          namaBeasiswa: "SEARCA Graduate Scholarship — Doctoral Programme (Luar Negeri)",
          penyelenggara: "SEARCA (Southeast Asian Regional Center for Graduate Study and Research in Agriculture)",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Filipina", "Thailand", "Malaysia", "Vietnam"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset Pertanian",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian/Disertasi", "Biaya Konferensi"],
          keterangan: "SEARCA menyediakan beasiswa doktor untuk warga Asia Tenggara di bidang pertanian, teknologi pangan, agribisnis, kehutanan, dan lingkungan hidup. Studi di universitas mitra SEARCA. Sangat relevan untuk prodi Teknologi Hasil Pertanian dan Agribisnis UNU Yogyakarta.",
          linkPendaftaran: "https://www.searca.org/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "SEARCA In-Country Scholarship — Doctoral (Dalam Negeri)",
          penyelenggara: "SEARCA (Southeast Asian Regional Center for Graduate Study and Research in Agriculture)",
          lokasi: "DALAM_NEGERI",
          pilihanLokasi: ["Yogyakarta", "Bogor", "Malang", "Makassar", "Padang"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset Pertanian",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Dana Penelitian/Disertasi", "Biaya Publikasi Jurnal"],
          keterangan: "Skema SEARCA In-Country untuk studi doktor di universitas Indonesia: UGM, IPB, UNHAS, UNAND. Cocok untuk dosen yang tidak ingin meninggalkan keluarga jangka panjang.",
          linkPendaftaran: "https://www.searca.org/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "SEARCA-DA-BAR Graduate Scholarship — Agricultural Research",
          penyelenggara: "SEARCA & Department of Agriculture Philippines",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Filipina"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset",
          komponenPembiayaan: ["Biaya Kuliah", "Tunjangan Hidup", "Tiket Pesawat", "Dana Penelitian"],
          keterangan: "Kerjasama SEARCA dengan Departemen Pertanian Filipina. Fokus pada riset pertanian berkelanjutan, ketahanan pangan, dan inovasi agribisnis.",
          linkPendaftaran: "https://www.searca.org/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
