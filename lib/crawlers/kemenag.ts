/**
 * Crawler: Beasiswa 5000 Doktor — Kementerian Agama RI
 * URL: https://beasiswa.kemenag.go.id
 *
 * Program ini SANGAT relevan untuk dosen UNU Yogyakarta karena:
 * - Khusus dosen/calon dosen PTKI (Perguruan Tinggi Keagamaan Islam)
 * - Dalam & luar negeri
 * - Dikelola langsung Kemenag
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 *     Situs Kemenag sering berganti tampilan, cek secara berkala.
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class KemenagCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Kemenag 5000 Doktor";
  sourceUrl = CRAWLER_CONFIG.kemenag.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.kemenag.selectors;
    const results: Partial<RawScholarship>[] = [];

    // Coba ambil item beasiswa dari listing
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text()) || "Beasiswa 5000 Doktor Kemenag";
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.kemenag.baseUrl}${href}`;
      const lokasiTeks = $(el).find(cfg.lokasi).first().text().toLowerCase();

      const isLuarNegeri = /luar negeri|overseas|international|abroad/i.test(lokasiTeks + keterangan + nama);

      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Kementerian Agama Republik Indonesia",
        lokasi: isLuarNegeri ? "LUAR_NEGERI" : "DALAM_NEGERI",
        pilihanLokasi: isLuarNegeri
          ? ["Timur Tengah", "Eropa", "Amerika Serikat", "Asia"]
          : ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Pendidikan (SPP)",
          "Biaya Hidup Bulanan",
          "Biaya Penelitian/Disertasi",
          "Biaya Buku",
          "Tiket Pesawat PP (Luar Negeri)",
          "Asuransi Kesehatan",
        ],
        keterangan: keterangan ||
          "Program Beasiswa 5000 Doktor Kemenag ditujukan bagi dosen/calon dosen PTKI (Perguruan Tinggi Keagamaan Islam) yang ingin melanjutkan studi S3 baik di dalam maupun luar negeri. Prioritas diberikan kepada dosen yang belum bergelar doktor dan mengajar di PTKI di bawah naungan Kemenag.",
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.kemenag.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadlineId(deadlineRaw),
      });
    });

    // Fallback: jika listing kosong, buat satu entri dari halaman utama
    if (results.length === 0) {
      results.push({
        namaBeasiswa: "Beasiswa 5000 Doktor Kemenag",
        penyelenggara: "Kementerian Agama Republik Indonesia",
        lokasi: "DALAM_NEGERI",
        pilihanLokasi: ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Pendidikan", "Biaya Hidup", "Biaya Penelitian", "Biaya Buku"],
        keterangan: sanitizeText($("body").text().slice(0, 1000)) ||
          "Program Beasiswa 5000 Doktor untuk dosen PTKI (Perguruan Tinggi Keagamaan Islam).",
        linkPendaftaran: CRAWLER_CONFIG.kemenag.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      });
    }

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
      else console.warn(`[${this.name}] Validasi gagal:`, result.error.flatten().fieldErrors);
    }
    await this.closeBrowser();
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
  for (const [id, en] of Object.entries(bulanMap)) {
    normalized = normalized.replace(id, en);
  }
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}
