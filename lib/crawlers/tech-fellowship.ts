/**
 * Crawler: Tech & Foundation Fellowships
 * - Google PhD Fellowship   → Informatika, Teknik Komputer, Teknik Elektro
 * - Microsoft Research      → Informatika, Teknik Komputer
 * - Ford Foundation         → PGSD, PBI, Studi Islam, Sosial, Manajemen
 * - British Council         → PBI, Pendidikan
 * - SEAMEO                  → PGSD, PBI, Pendidikan Asia Tenggara
 *
 * Sumber-sumber ini sulit di-crawl (listing tidak terstruktur).
 * Data statis digunakan sebagai sumber utama + crawl sebagai verifikasi.
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class TechFellowshipCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Tech & Foundation Fellowships";
  sourceUrl = CRAWLER_CONFIG.techFellowship.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.techFellowship.selectors;
    const crawled: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.techFellowship.baseUrl}${href}`;
      if (!nama) return;
      crawled.push({
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
        deadline: parseDeadline(deadlineRaw),
      });
    });

    // Gabung crawled + statis (statis selalu disertakan karena sumber tidak mudah di-listing)
    return [...crawled, ...this.getStaticEntries()];
  }

  private getStaticEntries(): Partial<RawScholarship>[] {
    return [
      {
        namaBeasiswa: "Google PhD Fellowship Program",
        penyelenggara: "Google LLC",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Amerika Serikat", "Eropa", "Asia Pasifik", "India"],
        skemaPembiayaan: "Partial",
        jenisPembiayaan: "Industry Fellowship",
        komponenPembiayaan: ["Stipend (USD 10.000/tahun)", "Dana Riset (USD 5.000/tahun)", "Biaya Konferensi", "Mentoring dari Peneliti Google", "Akses Google Research Resources"],
        keterangan: "Google PhD Fellowship mendukung mahasiswa doktor di bidang: AI & Machine Learning, Algoritma, HCI, Komputasi Kuantum, Keamanan Siber, NLP, dan Data Mining. Kandidat dinominasikan oleh universitas. Sangat relevan untuk dosen prodi Informatika, Teknik Komputer, dan Teknik Elektro UNU Yogyakarta.",
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
        komponenPembiayaan: ["Stipend Tahunan", "Dana Riset", "Biaya Konferensi & Travel", "Internship di Microsoft Research", "Mentoring Peneliti Senior Microsoft"],
        keterangan: "Microsoft Research PhD Fellowship mendukung mahasiswa doktor berbakat di computing research. Bidang: AI, ML, Systems, Theory, HCI, Programming Languages, Security. Mencakup bantuan finansial dan kesempatan magang di lab Microsoft Research. Sangat relevan untuk prodi Informatika dan Teknik Komputer UNU Yogyakarta.",
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
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Buku & Penelitian", "Dana Darurat"],
        keterangan: "Ford Foundation Fellowship mendukung pemimpin masa depan dari komunitas yang kurang terwakili. Fokus: pendidikan, ilmu sosial, humaniora, kebijakan publik, studi Islam, pembangunan komunitas. Sangat relevan untuk prodi PGSD, PBI, Studi Islam, Manajemen, dan Akuntansi UNU Yogyakarta. Pendaftaran melalui IIE (Institute of International Education).",
        linkPendaftaran: "https://www.fordfoundation.org/work/our-grants/fellows-program/",
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
      {
        namaBeasiswa: "British Council — GREAT Scholarships & Partnerships Indonesia",
        penyelenggara: "British Council Indonesia",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Inggris"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup", "Tiket Pesawat PP", "Asuransi Kesehatan"],
        keterangan: "British Council mengelola berbagai program beasiswa untuk Indonesia termasuk GREAT Scholarships dan program kemitraan kampus UK. Sangat relevan untuk dosen prodi PBI (Pendidikan Bahasa Inggris) dan PGSD. Hubungi British Council Jakarta untuk program terkini. Sering ada program khusus bidang pendidikan dan pengajaran bahasa.",
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
        keterangan: "SEAMEO menyediakan beasiswa dan fellowship untuk pendidik dan peneliti pendidikan Asia Tenggara. Pusat riset SEAMEO (QITEP in Language, QITEP in Math, RECSAM, dll) sangat relevan untuk prodi PGSD dan PBI. Indonesia memiliki beberapa pusat SEAMEO aktif di Yogyakarta dan Jakarta.",
        linkPendaftaran: "https://www.seameo.org",
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
    ];
  }

  async crawl(): Promise<RawScholarship[]> {
    let raw: Partial<RawScholarship>[] = [];
    try {
      if (await this.isAllowedByRobots(this.sourceUrl)) {
        const html = await this.fetchWithRetry(this.sourceUrl);
        raw = this.parse(html);
      } else {
        raw = this.getStaticEntries();
      }
    } catch {
      // Fallback ke data statis jika crawl gagal
      raw = this.getStaticEntries();
    }
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
