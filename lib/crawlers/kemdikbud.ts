/**
 * Crawler: beasiswa.kemdikbud.go.id
 *
 * ⚠️  Selektor diambil dari config.ts — PERLU DISESUAIKAN dengan struktur
 *     HTML aktual situs. Periksa secara berkala, situs pemerintah sering
 *     berganti tampilan tanpa pemberitahuan.
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class KemdikbudCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Kemdikbud BPI";
  sourceUrl = CRAWLER_CONFIG.kemdikbud.listUrl;

  // PARSE: Ekstrak data dari HTML — terpisah dari fetch agar mudah diuji
  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.kemdikbud.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http")
        ? href
        : `${CRAWLER_CONFIG.kemdikbud.baseUrl}${href}`;

      if (!nama) return;

      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Kemendikbudristek",
        lokasi: "DALAM_NEGERI",
        pilihanLokasi: ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Pendidikan", "Biaya Hidup"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.kemdikbud.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadline(deadlineRaw),
      });
    });
    return results;
  }

  async crawl(): Promise<RawScholarship[]> {
    if (!(await this.isAllowedByRobots(this.sourceUrl))) return [];
    const html = await this.fetchWithRetry(this.sourceUrl);
    const raw = this.parse(html);
    const valid: RawScholarship[] = [];
    for (const item of raw) {
      const result = RawScholarshipSchema.safeParse(item);
      if (result.success) valid.push(result.data);
      else console.warn(`[${this.name}] Validasi gagal:`, result.error.flatten());
    }
    await this.closeBrowser();
    return valid;
  }
}

function parseDeadline(raw: string): Date | null {
  if (!raw) return null;
  // Coba berbagai format tanggal Indonesia
  const cleaned = raw.replace(/[^\d\w\s\-\/]/g, " ").trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}
