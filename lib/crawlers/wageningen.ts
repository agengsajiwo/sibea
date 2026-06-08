/**
 * Crawler: Wageningen University & Research + NFP Belanda
 * WUR #1 dunia untuk ilmu pertanian & pangan.
 * Relevan: Teknologi Hasil Pertanian, Agribisnis, Farmasi
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

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
        komponenPembiayaan: ["Biaya Kuliah & Riset Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.wageningen.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      });
    });
    return results;
  }

  async crawl(): Promise<RawScholarship[]> {
    return crawlWithFallback({
      name: this.name,
      fetchAndParse: async () => {
        if (!await this.isAllowedByRobots(this.sourceUrl)) return [];
        return this.parse(await this.fetchWithRetry(this.sourceUrl));
      },
      staticEntries: [
        {
          namaBeasiswa: "WUR PhD Fellowship Programme — Food Technology & Nutrition",
          penyelenggara: "Wageningen University & Research (WUR) — Belanda",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Belanda (Wageningen)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset Penuh",
          komponenPembiayaan: ["Biaya Kuliah & Riset Penuh (4 tahun)", "Tunjangan Hidup (≈€2.200/bulan)", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Konferensi Internasional"],
          keterangan: "WUR #1 dunia untuk ilmu pertanian. Program PhD bidang teknologi pangan, gizi, bioteknologi, dan ilmu pangan. Posisi PhD diiklankan di jobs.wur.nl. Sangat relevan untuk prodi Teknologi Hasil Pertanian dan Farmasi UNU Yogyakarta.",
          linkPendaftaran: "https://www.wur.nl/en/education-programmes/phd-programmes.htm",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "WUR PhD Fellowship Programme — Agronomy & Plant Sciences",
          penyelenggara: "Wageningen University & Research (WUR) — Belanda",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Belanda (Wageningen)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset Penuh",
          komponenPembiayaan: ["Biaya Kuliah & Riset Penuh (4 tahun)", "Tunjangan Hidup (≈€2.200/bulan)", "Tiket Pesawat PP", "Asuransi Kesehatan"],
          keterangan: "WUR untuk bidang agronomi, hortikultura, pemuliaan tanaman, dan ilmu pertanian. Banyak posisi PhD dibiayai penuh oleh proyek riset WUR. Cocok untuk prodi Agribisnis UNU Yogyakarta.",
          linkPendaftaran: "https://www.wur.nl/en/education-programmes/phd-programmes.htm",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "NFP — Netherlands Fellowship Programme (Belanda)",
          penyelenggara: "Nuffic / Pemerintah Belanda",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Belanda (Amsterdam, Utrecht, Wageningen, Delft, Groningen, Rotterdam)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan & Kecelakaan", "Visa & Izin Tinggal", "Tunjangan Kedatangan"],
          keterangan: "NFP oleh Nuffic untuk studi doktor di universitas Belanda termasuk WUR, TU Delft, Universitas Amsterdam, Utrecht. Terbuka untuk semua bidang: pertanian, teknik, sosial, manajemen. Prioritas untuk peserta dari sektor pembangunan.",
          linkPendaftaran: "https://www.nuffic.nl/en/subjects/scholarships/netherlands-fellowship-programme-nfp",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
