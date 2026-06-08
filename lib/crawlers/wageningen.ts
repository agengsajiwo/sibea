/**
 * Crawler: Wageningen University & Research (WUR) + NFP Belanda
 * URL WUR: https://www.wur.nl/en/education-programmes/phd-programmes.htm
 * URL NFP: https://www.nuffic.nl/en/subjects/scholarships/netherlands-fellowship-programme-nfp
 *
 * Relevan untuk: Teknologi Hasil Pertanian, Agribisnis, Farmasi (herbal),
 *               Teknik (lingkungan hidup)
 * WUR #1 dunia untuk ilmu pertanian & pangan secara konsisten.
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class WageningenCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Wageningen University";
  sourceUrl = CRAWLER_CONFIG.wageningen.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.wageningen.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.wageningen.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Wageningen University & Research (WUR) — Belanda",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Belanda (Wageningen)"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Riset",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.wageningen.baseUrl,
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
        namaBeasiswa: "WUR PhD Fellowship Programme — Wageningen University",
        penyelenggara: "Wageningen University & Research (WUR) — Belanda",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Belanda (Wageningen)"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Riset Penuh",
        komponenPembiayaan: ["Biaya Kuliah & Riset Penuh (4 tahun)", "Tunjangan Hidup Bulanan (≈€1.700)", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Konferensi Internasional", "Fasilitas Lab Kelas Dunia"],
        keterangan: "Wageningen University & Research (WUR) adalah universitas peringkat #1 dunia untuk ilmu pertanian, pangan, dan lingkungan hidup. Program PhD tersedia di: ilmu pangan & teknologi, agronomi, hortikultura, agribisnis, bioteknologi, gizi, lingkungan, dan kehutanan. Banyak posisi PhD dibiayai penuh oleh proyek riset WUR — pelamar mendaftar ke posisi yang diiklankan. Indonesia adalah salah satu negara pengirim mahasiswa terbesar ke WUR.",
        linkPendaftaran: "https://www.wur.nl/en/education-programmes/phd-programmes.htm",
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
      {
        namaBeasiswa: "NFP — Netherlands Fellowship Programme",
        penyelenggara: "Nuffic / Pemerintah Belanda",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Belanda (Amsterdam, Utrecht, Wageningen, Delft, Groningen)"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan & Kecelakaan", "Visa & Izin Tinggal", "Tunjangan Kedatangan"],
        keterangan: "Netherlands Fellowship Programme (NFP) oleh Nuffic mendukung studi doktor di universitas Belanda: WUR, TU Delft, Universitas Amsterdam, Utrecht, Groningen. Terbuka untuk semua bidang studi termasuk pertanian, teknik, sosial, dan manajemen. Prioritas untuk peserta dari negara berkembang yang bekerja di sektor pembangunan.",
        linkPendaftaran: "https://www.nuffic.nl/en/subjects/scholarships/netherlands-fellowship-programme-nfp",
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
