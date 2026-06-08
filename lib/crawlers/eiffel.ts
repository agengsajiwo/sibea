/**
 * Crawler: Eiffel Excellence Scholarship — Pemerintah Prancis
 * URL: https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence
 *
 * Relevan untuk: Manajemen, Hukum, Teknik, Informatika, Ilmu Politik,
 *               Ekonomi, Ilmu Sosial — di universitas terbaik Prancis.
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

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
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
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
        komponenPembiayaan: ["Tunjangan Hidup Bulanan (€1.400)", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Kebudayaan", "Biaya Transportasi Lokal"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.eiffel.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadline(deadlineRaw),
      });
    });

    if (results.length === 0) results.push(...this.getStaticEntries());
    return results;
  }

  private getStaticEntries(): Partial<RawScholarship>[] {
    return [{
      namaBeasiswa: "Eiffel Excellence Scholarship — Doctoral Level",
      penyelenggara: "Campus France / Kementerian Luar Negeri Prancis",
      lokasi: "LUAR_NEGERI",
      pilihanLokasi: ["Prancis (Paris, Lyon, Toulouse, Bordeaux, Strasbourg)"],
      skemaPembiayaan: "Fully Funded",
      jenisPembiayaan: "Beasiswa Penuh",
      komponenPembiayaan: ["Tunjangan Hidup Bulanan (€1.400/bulan)", "Tiket Pesawat PP", "Asuransi Kesehatan Komprehensif", "Dana Kebudayaan & Sosial", "Biaya Transportasi dalam Kota"],
      keterangan: "Eiffel Excellence Scholarship dari Kementerian Luar Negeri Prancis tersedia untuk: teknik & ilmu alam, ekonomi & manajemen, ilmu politik & hukum, dan humaniora. Pendaftaran dilakukan melalui institusi Prancis yang menominasikan kandidat — kandidat tidak mendaftar langsung. Deadline biasanya Januari setiap tahun. Relevan untuk prodi Manajemen, Akuntansi, Informatika, Teknik Elektro UNU Yogyakarta.",
      linkPendaftaran: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
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
