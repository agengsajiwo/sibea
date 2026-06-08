/**
 * Crawler: SEARCA — Southeast Asian Regional Center for Graduate Study
 *          and Research in Agriculture
 * URL: https://www.searca.org/scholarships
 *
 * Relevan untuk: Teknologi Hasil Pertanian, Agribisnis, Farmasi (herbal/pangan)
 * Khusus Asia Tenggara — peluang lebih besar untuk WNI.
 * Ada skema In-Country (studi di Indonesia) dan luar negeri.
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

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
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
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
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian", "Biaya Disertasi"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.searca.baseUrl,
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
        namaBeasiswa: "SEARCA Graduate Scholarship — Doctoral Programme (Luar Negeri)",
        penyelenggara: "SEARCA (Southeast Asian Regional Center for Graduate Study and Research in Agriculture)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Filipina", "Thailand", "Malaysia", "Vietnam"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Riset Pertanian",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian/Disertasi", "Biaya Konferensi"],
        keterangan: "SEARCA menyediakan beasiswa doktor untuk warga negara Asia Tenggara di bidang pertanian, teknologi pangan, agribisnis, kehutanan, dan lingkungan hidup. Studi dilakukan di universitas mitra SEARCA di Asia Tenggara. Sangat relevan untuk dosen prodi Teknologi Hasil Pertanian dan Agribisnis UNU Yogyakarta. Pendaftaran dibuka dua kali setahun.",
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
        keterangan: "SEARCA juga menyediakan skema In-Country yang memungkinkan studi doktor di universitas dalam Indonesia seperti UGM, IPB, UNHAS, UNAND. Cocok untuk dosen yang tidak ingin meninggalkan keluarga dalam jangka panjang. Bidang: pertanian, pangan, agribisnis, lingkungan.",
        linkPendaftaran: "https://www.searca.org/scholarships",
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
