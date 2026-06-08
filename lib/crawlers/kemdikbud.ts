/**
 * Crawler: beasiswa.kemdikbud.go.id
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class KemdikbudCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Kemdikbud BPI";
  sourceUrl = CRAWLER_CONFIG.kemdikbud.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.kemdikbud.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.kemdikbud.baseUrl}${href}`;
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
        deadline: parseDeadlineId(deadlineRaw),
      });
    });
    return results;
  }

  private getStaticEntries(): Partial<RawScholarship>[] {
    return [{
      namaBeasiswa: "Beasiswa Pendidikan Indonesia (BPI) — Program Doktor",
      penyelenggara: "Kemendikbudristek",
      lokasi: "DALAM_NEGERI",
      pilihanLokasi: ["Seluruh Indonesia"],
      skemaPembiayaan: "Fully Funded",
      jenisPembiayaan: "Beasiswa Penuh",
      komponenPembiayaan: ["Biaya Pendidikan", "Biaya Hidup", "Biaya Buku", "Biaya Penelitian Disertasi"],
      keterangan: "BPI Kemendikbudristek untuk dosen yang ingin melanjutkan studi S3 di dalam negeri. Memprioritaskan dosen yang belum bergelar doktor.",
      linkPendaftaran: CRAWLER_CONFIG.kemdikbud.baseUrl,
      sumberCrawling: this.sourceUrl,
      deadline: null,
    }];
  }

  async crawl(): Promise<RawScholarship[]> {
    let raw: Partial<RawScholarship>[] = [];
    try {
      if (await this.isAllowedByRobots(this.sourceUrl)) {
        const html = await this.fetchWithRetry(this.sourceUrl);
        raw = this.parse(html);
      }
    } catch (err) {
      console.warn(`[${this.name}] Fetch gagal, pakai data statis:`, (err as Error).message);
    }
    if (raw.length === 0) raw = this.getStaticEntries();
    const valid: RawScholarship[] = [];
    for (const item of raw) {
      const result = RawScholarshipSchema.safeParse(item);
      if (result.success) valid.push(result.data);
    }
    return valid;
  }
}

function parseDeadlineId(raw: string): Date | null {
  if (!raw) return null;
  const bulanMap: Record<string, string> = {
    januari: "January", februari: "February", maret: "March", april: "April",
    mei: "May", juni: "June", juli: "July", agustus: "August",
    september: "September", oktober: "October", november: "November", desember: "December",
  };
  let normalized = raw.toLowerCase();
  for (const [id, en] of Object.entries(bulanMap)) normalized = normalized.replace(id, en);
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}
