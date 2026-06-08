/**
 * Crawler: Stipendium Hungaricum — Beasiswa Pemerintah Hongaria
 * URL: https://stipendiumhungaricum.hu
 *
 * Relevan untuk SEMUA prodi UNU Yogyakarta (Manajemen, Akuntansi, Farmasi,
 * Pertanian, Agribisnis, Teknik, Informatika, Pendidikan, Studi Islam, dll).
 * Fully funded, kompetisi relatif lebih terbuka dari Eropa Barat.
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class StipendiumHungaricumCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Stipendium Hungaricum";
  sourceUrl = CRAWLER_CONFIG.stipendiumHungaricum.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.stipendiumHungaricum.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.stipendiumHungaricum.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Pemerintah Hongaria — Tempus Public Foundation",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Hongaria"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (HUF 140.000)", "Akomodasi Asrama", "Asuransi Kesehatan"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.stipendiumHungaricum.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadline(deadlineRaw),
      });
    });

    if (results.length === 0) results.push(...this.getStaticEntries());
    return results;
  }

  private getStaticEntries(): Partial<RawScholarship>[] {
    return [{
      namaBeasiswa: "Stipendium Hungaricum — Doctoral Programme",
      penyelenggara: "Pemerintah Hongaria — Tempus Public Foundation",
      lokasi: "LUAR_NEGERI",
      pilihanLokasi: ["Hongaria"],
      skemaPembiayaan: "Fully Funded",
      jenisPembiayaan: "Beasiswa Penuh",
      komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (HUF 140.000 ≈ Rp 5,5 juta)", "Akomodasi Asrama atau Tunjangan Sewa", "Asuransi Kesehatan"],
      keterangan: "Stipendium Hungaricum tersedia untuk semua bidang studi doktor: Manajemen, Akuntansi, Farmasi, Teknik, Informatika, Pertanian, Agribisnis, Pendidikan, dan Studi Islam. Tersedia di 30+ universitas Hongaria. Kompetisi relatif lebih terbuka dibanding beasiswa Eropa Barat. Pendaftaran melalui SHAP (Stipendium Hungaricum Application System). Deadline biasanya Januari setiap tahun.",
      linkPendaftaran: "https://stipendiumhungaricum.hu/apply/",
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
