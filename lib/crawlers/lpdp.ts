/**
 * Crawler: beasiswalpdp.kemenkeu.go.id
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class LpdpCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "LPDP";
  sourceUrl = CRAWLER_CONFIG.lpdp.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.lpdp.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.lpdp.baseUrl}${href}`;
      if (!nama) return;

      // LPDP punya program dalam dan luar negeri — tentukan dari nama
      const isLuarNegeri =
        /luar negeri|overseas|international/i.test(nama + keterangan);

      results.push({
        namaBeasiswa: nama,
        penyelenggara: "LPDP",
        lokasi: isLuarNegeri ? "LUAR_NEGERI" : "DALAM_NEGERI",
        pilihanLokasi: isLuarNegeri
          ? ["Amerika Serikat", "Inggris", "Australia", "Jerman"]
          : ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["SPP/Tuition Fee", "Tunjangan Hidup", "Tunjangan Buku"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.lpdp.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadlineLpdp(deadlineRaw),
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
    }
    await this.closeBrowser();
    return valid;
  }
}

function parseDeadlineLpdp(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.replace(/tutup|penutupan|deadline/gi, "").trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}
