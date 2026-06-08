/**
 * Crawler: Tech Industry Fellowships + Foundation Scholarships
 * Google, Microsoft, Ford Foundation, British Council, SEAMEO
 * Relevan: Informatika, Teknik Komputer, PGSD, PBI, Sosial
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class TechFellowshipCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Tech & Foundation Fellowships";
  sourceUrl = CRAWLER_CONFIG.techFellowship.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.techFellowship.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.techFellowship.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Google / Microsoft / Ford Foundation",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Amerika Serikat", "Global"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Fellowship",
        komponenPembiayaan: ["Stipend Tahunan", "Dana Riset", "Biaya Konferensi", "Mentoring"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.techFellowship.baseUrl,
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
          namaBeasiswa: "Google PhD Fellowship Program",
          penyelenggara: "Google LLC",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Amerika Serikat", "Eropa", "Asia Pasifik"],
          skemaPembiayaan: "Partial",
          jenisPembiayaan: "Industry Fellowship",
          komponenPembiayaan: ["Stipend (USD 10.000/tahun)", "Dana Riset (USD 5.000/tahun)", "Biaya Konferensi", "Mentoring dari Peneliti Google"],
          keterangan: "Google PhD Fellowship mendukung mahasiswa doktor di: AI & ML, Algoritma, HCI, Komputasi Kuantum, Keamanan Siber, NLP, Data Mining. Kandidat dinominasikan oleh universitas. Relevan untuk prodi Informatika, Teknik Komputer, Teknik Elektro UNU Yogyakarta.",
          linkPendaftaran: "https://research.google/programs-and-events/phd-fellowship/",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Microsoft Research PhD Fellowship",
          penyelenggara: "Microsoft Research",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Amerika Serikat", "Eropa", "Asia"],
          skemaPembiayaan: "Partial",
          jenisPembiayaan: "Industry Fellowship",
          komponenPembiayaan: ["Stipend Tahunan", "Dana Riset", "Biaya Konferensi & Travel", "Internship di Microsoft Research", "Mentoring Peneliti Senior"],
          keterangan: "Microsoft Research PhD Fellowship untuk computing research: AI, ML, Systems, Theory, HCI, Security. Relevan untuk prodi Informatika dan Teknik Komputer UNU Yogyakarta.",
          linkPendaftaran: "https://www.microsoft.com/en-us/research/academic-program/phd-fellowship/",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Ford Foundation International Fellowships Program",
          penyelenggara: "Ford Foundation",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Amerika Serikat", "Eropa", "Asia", "Afrika"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Foundation Fellowship",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Buku & Penelitian"],
          keterangan: "Ford Foundation Fellowship untuk pemimpin masa depan dari komunitas kurang terwakili. Fokus: pendidikan, ilmu sosial, humaniora, studi Islam, pembangunan komunitas. Relevan untuk prodi PGSD, PBI, Studi Islam, Manajemen UNU Yogyakarta.",
          linkPendaftaran: "https://www.fordfoundation.org/work/our-grants/fellows-program/",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "British Council — GREAT Scholarships untuk Indonesia",
          penyelenggara: "British Council Indonesia",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Inggris"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup", "Tiket Pesawat PP", "Asuransi Kesehatan"],
          keterangan: "British Council mengelola GREAT Scholarships untuk Indonesia. Sangat relevan untuk prodi PBI (Pendidikan Bahasa Inggris) dan PGSD. Hubungi British Council Jakarta untuk program terkini.",
          linkPendaftaran: "https://www.britishcouncil.or.id/en/study-uk/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "SEAMEO Scholarships — Pendidikan Asia Tenggara",
          penyelenggara: "Southeast Asian Ministers of Education Organization (SEAMEO)",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Thailand", "Malaysia", "Singapura", "Filipina", "Vietnam"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset Pendidikan",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup", "Tiket Pesawat PP", "Dana Penelitian"],
          keterangan: "SEAMEO untuk pendidik dan peneliti pendidikan Asia Tenggara. Pusat SEAMEO (QITEP in Language, QITEP in Math, RECSAM) relevan untuk prodi PGSD dan PBI. Indonesia punya pusat SEAMEO aktif di Yogyakarta dan Jakarta.",
          linkPendaftaran: "https://www.seameo.org",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Aga Khan Foundation International Scholarship",
          penyelenggara: "Aga Khan Foundation",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Amerika Serikat", "Inggris", "Kanada", "Eropa"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan"],
          keterangan: "Aga Khan Foundation untuk pemimpin masa depan dari komunitas Muslim dan negara berkembang. Fokus pembangunan sosial, kesehatan, pendidikan, dan lingkungan. Hibah setengah hibah dan setengah pinjaman.",
          linkPendaftaran: "https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Rotary Foundation Global Grant — Doctoral Research",
          penyelenggara: "Rotary International Foundation",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Berbagai Negara (sesuai proyek)"],
          skemaPembiayaan: "Partial",
          jenisPembiayaan: "Hibah Penelitian",
          komponenPembiayaan: ["Biaya Kuliah & Penelitian", "Biaya Hidup", "Tiket Perjalanan", "Dana Proyek"],
          keterangan: "Rotary Global Grant untuk penelitian doktoral yang mendukung tujuan kemanusiaan. Pelamar butuh sponsor dari klub Rotary setempat. Tersedia untuk semua bidang yang terkait dengan area fokus Rotary.",
          linkPendaftaran: "https://www.rotary.org/en/our-programs/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Taiwan Government Scholarship (MOFA) — Doctoral",
          penyelenggara: "Ministry of Foreign Affairs Taiwan (MOFA)",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Taiwan"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (TWD 25.000)", "Tiket Pesawat PP", "Asuransi Kesehatan"],
          keterangan: "Taiwan MOFA Scholarship untuk studi doktor di universitas-universitas Taiwan. Kompetisi lebih rendah dibanding MEXT. Taiwan punya universitas teknik, informatika, dan sains yang sangat baik. Bahasa pengantar: Mandarin atau Inggris.",
          linkPendaftaran: "https://www.taiwan.net.tw/m1.aspx?sNo=0002019",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
