/**
 * Crawler: MEXT (Monbukagakusho) — Beasiswa Pemerintah Jepang
 * URL: https://www.id.emb-japan.go.jp/sch.html
 *
 * Salah satu beasiswa paling bergengsi & populer di Indonesia.
 * Program Research Student → Doctor sangat relevan untuk dosen.
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class MextCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "MEXT Jepang";
  sourceUrl = CRAWLER_CONFIG.mext.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.mext.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.mext.baseUrl}${href}`;
      if (!nama) return;

      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Ministry of Education, Culture, Sports, Science and Technology (MEXT) Japan",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Jepang"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah Penuh",
          "Tunjangan Hidup Bulanan (¥143.000–¥145.000)",
          "Tiket Pesawat PP",
          "Bebas Biaya Ujian Masuk",
        ],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.mext.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadlineId(deadlineRaw),
      });
    });

    if (results.length === 0) {
      results.push(...this.getStaticEntries());
    }

    return results;
  }

  // Data statis sebagai fallback jika selektor belum akurat
  private getStaticEntries(): Partial<RawScholarship>[] {
    return [
      {
        namaBeasiswa: "MEXT Research Student Scholarship (Embassy Recommendation)",
        penyelenggara: "Ministry of Education, Culture, Sports, Science and Technology (MEXT) Japan",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Jepang"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah Penuh",
          "Tunjangan Hidup Bulanan (¥143.000–¥145.000)",
          "Tiket Pesawat PP",
          "Bebas Biaya Ujian Masuk & Pendaftaran",
        ],
        keterangan:
          "Beasiswa MEXT jalur Kedutaan (Embassy Recommendation) untuk program Research Student yang dapat dilanjutkan ke program doktor. Pendaftar mengajukan melalui Kedutaan Besar Jepang di Jakarta. Tersedia untuk semua bidang studi. Durasi: 3,5 tahun (6 bulan research student + 3 tahun doktor).",
        linkPendaftaran: CRAWLER_CONFIG.mext.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
      {
        namaBeasiswa: "MEXT University Recommendation Scholarship (Doctoral)",
        penyelenggara: "Ministry of Education, Culture, Sports, Science and Technology (MEXT) Japan",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Jepang"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah Penuh",
          "Tunjangan Hidup Bulanan",
          "Tiket Pesawat PP",
        ],
        keterangan:
          "Beasiswa MEXT jalur rekomendasi universitas Jepang. Pendaftar langsung menghubungi profesor di universitas tujuan di Jepang dan mendapatkan rekomendasi dari universitas tersebut. Proses seleksi lebih kompetitif namun peluang lebih besar jika sudah ada calon supervisor.",
        linkPendaftaran: CRAWLER_CONFIG.mext.baseUrl,
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
  for (const [id, en] of Object.entries(bulanMap)) normalized = normalized.replace(id, en);
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}
