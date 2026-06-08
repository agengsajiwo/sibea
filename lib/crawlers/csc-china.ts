/**
 * Crawler: CSC — Chinese Government Scholarship (Beasiswa Pemerintah China)
 * URL: https://www.campuschina.org
 * Mirror KBRI: https://www.id.chineseembassy.org
 *
 * Relevan karena banyak MoU antara kampus Indonesia dan universitas China,
 * termasuk universitas Islam seperti Beijing Foreign Studies University.
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class CscChinaCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "CSC China";
  sourceUrl = CRAWLER_CONFIG.cscChina.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.cscChina.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.cscChina.baseUrl}${href}`;
      if (!nama) return;

      results.push({
        namaBeasiswa: nama,
        penyelenggara: "China Scholarship Council (CSC) / Pemerintah China",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["China"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah Penuh",
          "Akomodasi Asrama",
          "Tunjangan Hidup Bulanan (CNY 3.000–3.500)",
          "Asuransi Kesehatan",
          "Tiket Pesawat PP",
        ],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.cscChina.baseUrl,
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
        namaBeasiswa: "Chinese Government Scholarship — Type A (Embassy Recommendation)",
        penyelenggara: "China Scholarship Council (CSC) / Pemerintah Tiongkok",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["China"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah Penuh",
          "Akomodasi Asrama",
          "Tunjangan Hidup Bulanan (CNY 3.500 untuk doktor)",
          "Asuransi Kesehatan Komprehensif",
          "Tiket Pesawat PP (awal & akhir studi)",
        ],
        keterangan:
          "Beasiswa Pemerintah China jalur Kedutaan Besar China di Jakarta. Tersedia untuk program doktor (S3) di lebih dari 270 universitas di China. Pendaftar mengajukan melalui KBRI China atau langsung ke kedutaan. Tersedia universitas dengan program berbahasa Inggris. Beberapa universitas memiliki program Islamic Studies.",
        linkPendaftaran: CRAWLER_CONFIG.cscChina.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
      {
        namaBeasiswa: "Chinese Government Scholarship — University-Based Program",
        penyelenggara: "China Scholarship Council (CSC) / Universitas Tujuan",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["China"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah Penuh",
          "Akomodasi Asrama",
          "Tunjangan Hidup Bulanan",
          "Asuransi Kesehatan",
        ],
        keterangan:
          "Jalur beasiswa CSC melalui universitas China yang memiliki kuota beasiswa mandiri. Pendaftar langsung menghubungi universitas tujuan di China dan mengajukan beasiswa melalui sistem universitas. Cocok jika sudah ada calon supervisor atau kerja sama institusi antara UNU Yogyakarta dan universitas di China.",
        linkPendaftaran: CRAWLER_CONFIG.cscChina.baseUrl,
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

function parseDeadline(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d;
}
