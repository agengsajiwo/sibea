/**
 * Crawler: Türkiye Bursları (Turkish Government Scholarship)
 * URL: https://www.turkiyeburslari.gov.tr
 *
 * Sangat relevan untuk dosen UNU Yogyakarta — populer di kalangan NU/pesantren,
 * banyak universitas Islam terkemuka di Turki (IIUM, UIN Ankara, dll).
 *
 * ⚠️  Situs berbasis JavaScript — menggunakan Playwright.
 *     Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class TurkiyeBurslariCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Türkiye Bursları";
  sourceUrl = CRAWLER_CONFIG.turkiyeBurslari.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.turkiyeBurslari.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.turkiyeBurslari.baseUrl}${href}`;
      if (!nama) return;

      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Pemerintah Republik Turki (Türkiye Bursları)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Turki"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah Penuh",
          "Tunjangan Hidup Bulanan (TRY 1.300–1.700)",
          "Akomodasi Asrama",
          "Asuransi Kesehatan",
          "Tiket Pesawat PP",
          "Kursus Bahasa Turki 1 Tahun",
        ],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.turkiyeBurslari.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadline(deadlineRaw),
      });
    });

    if (results.length === 0) {
      results.push(...this.getStaticEntries());
    }

    return results;
  }

  private getStaticEntries(): Partial<RawScholarship>[] {
    return [
      {
        namaBeasiswa: "Türkiye Bursları — Doctorate Scholarship",
        penyelenggara: "Pemerintah Republik Turki (Türkiye Bursları / YTB)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Turki"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah Penuh",
          "Tunjangan Hidup Bulanan",
          "Akomodasi Asrama",
          "Asuransi Kesehatan",
          "Tiket Pesawat PP (awal & akhir studi)",
          "Kursus Bahasa Turki (1 tahun pra-studi)",
        ],
        keterangan:
          "Türkiye Bursları adalah program beasiswa resmi pemerintah Turki yang dikelola oleh YTB (Yurtdışı Türkler ve Akraba Topluluklar). Program doktor tersedia di ratusan universitas Turki termasuk universitas-universitas Islam ternama. Sangat populer di kalangan alumni pesantren dan NU. Pendaftaran sepenuhnya online melalui aplikasi Türkiye Bursları. Deadline biasanya Februari setiap tahun.",
        linkPendaftaran: CRAWLER_CONFIG.turkiyeBurslari.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: new Date(`${new Date().getFullYear()}-02-20`),
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
      else console.warn(`[${this.name}] Validasi gagal:`, result.error.flatten().fieldErrors);
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
