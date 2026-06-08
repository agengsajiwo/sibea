/**
 * Crawler: Eiffel Excellence + beasiswa Eropa lainnya
 * Relevan: Manajemen, Teknik, Informatika, Ilmu Sosial, PBI
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class EiffelCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Eiffel Excellence";
  sourceUrl = CRAWLER_CONFIG.eiffel.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.eiffel.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.eiffel.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Campus France / Pemerintah Prancis",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Prancis"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Tunjangan Hidup (€1.400/bulan)", "Tiket Pesawat PP", "Asuransi Kesehatan"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.eiffel.baseUrl,
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
          namaBeasiswa: "Eiffel Excellence Scholarship — Doctoral Level (Prancis)",
          penyelenggara: "Campus France / Kementerian Luar Negeri Prancis",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Prancis (Paris, Lyon, Toulouse, Bordeaux, Strasbourg, Grenoble)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Tunjangan Hidup (€1.400/bulan)", "Tiket Pesawat PP", "Asuransi Kesehatan Komprehensif", "Dana Kebudayaan & Sosial", "Transportasi dalam Kota"],
          keterangan: "Eiffel Excellence Scholarship dari Kemenlu Prancis untuk bidang: teknik & ilmu alam, ekonomi & manajemen, ilmu politik & hukum, dan humaniora. Pendaftaran via institusi Prancis yang menominasikan kandidat. Deadline biasanya Januari.",
          linkPendaftaran: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Stipendium Hungaricum — Doctoral (Hongaria)",
          penyelenggara: "Pemerintah Hongaria — Tempus Public Foundation",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Hongaria"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup (HUF 140.000/bulan)", "Akomodasi", "Asuransi Kesehatan"],
          keterangan: "Stipendium Hungaricum tersedia untuk semua bidang ilmu di 30+ universitas Hongaria. Kompetisi lebih terbuka dibanding Eropa Barat. Deadline Januari.",
          linkPendaftaran: "https://stipendiumhungaricum.hu/apply/",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Heinrich Böll Foundation Scholarship — PhD (Jerman)",
          penyelenggara: "Heinrich-Böll-Stiftung / Jerman",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Jerman"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Yayasan",
          komponenPembiayaan: ["Tunjangan Hidup Bulanan (€1.200)", "Tunjangan Riset", "Dana Konferensi", "Mentoring & Jaringan"],
          keterangan: "Heinrich Böll Foundation mendukung doktorat di bidang ilmu sosial, hukum, lingkungan hidup, gender, dan humaniora di universitas Jerman. Pendaftar internasional sambil tinggal di Jerman. Relevan untuk prodi Manajemen, Studi Islam, dan PGSD.",
          linkPendaftaran: "https://www.boell.de/en/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Friedrich Ebert Stiftung Scholarship — PhD (Jerman)",
          penyelenggara: "Friedrich-Ebert-Stiftung (FES) / Jerman",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Jerman"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Yayasan",
          komponenPembiayaan: ["Tunjangan Hidup Bulanan", "Tunjangan Buku", "Dana Konferensi", "Program Pemberdayaan & Jaringan"],
          keterangan: "FES mendukung doktorat di bidang ilmu sosial, ekonomi, hukum, dan ilmu politik di universitas Jerman. Ada kantor perwakilan FES di Jakarta. Sangat relevan untuk prodi Manajemen dan Akuntansi.",
          linkPendaftaran: "https://www.fes.de/en/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Swedish Institute Scholarship for Global Professionals (SISGP)",
          penyelenggara: "Swedish Institute / Pemerintah Swedia",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Swedia"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (SEK 11.000)", "Tiket Pesawat PP", "Asuransi Perjalanan"],
          keterangan: "Swedish Institute Scholarship untuk pemimpin masa depan dari negara berkembang. Program master dan PhD tersedia di universitas Swedia. Fokus pada kepemimpinan, pembangunan, dan inovasi sosial.",
          linkPendaftaran: "https://si.se/en/apply/scholarships/",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
