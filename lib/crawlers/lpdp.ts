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
      const isLuarNegeri = /luar negeri|overseas|international/i.test(nama + keterangan);
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "LPDP",
        lokasi: isLuarNegeri ? "LUAR_NEGERI" : "DALAM_NEGERI",
        pilihanLokasi: isLuarNegeri ? ["Amerika Serikat", "Inggris", "Australia", "Jerman"] : ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["SPP/Tuition Fee", "Tunjangan Hidup", "Tunjangan Buku"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.lpdp.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadline(deadlineRaw),
      });
    });
    return results;
  }

  private getStaticEntries(): Partial<RawScholarship>[] {
    return [
      {
        namaBeasiswa: "LPDP Program Doktor Dalam Negeri",
        penyelenggara: "LPDP",
        lokasi: "DALAM_NEGERI",
        pilihanLokasi: ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["SPP/Tuition Fee", "Tunjangan Hidup Bulanan", "Tunjangan Buku", "Tunjangan Penelitian"],
        keterangan: "LPDP memberikan beasiswa doktor untuk perguruan tinggi terbaik dalam negeri.",
        linkPendaftaran: CRAWLER_CONFIG.lpdp.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
      {
        namaBeasiswa: "LPDP Program Doktor Luar Negeri",
        penyelenggara: "LPDP",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Amerika Serikat", "Inggris", "Australia", "Jerman", "Belanda", "Jepang"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Tuition Fee", "Living Allowance", "Tiket Pesawat PP", "Asuransi Kesehatan"],
        keterangan: "LPDP untuk studi doktor di perguruan tinggi terkemuka di luar negeri.",
        linkPendaftaran: CRAWLER_CONFIG.lpdp.baseUrl,
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

function parseDeadline(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw.replace(/tutup|penutupan|deadline/gi, "").trim());
  return isNaN(d.getTime()) ? null : d;
}
