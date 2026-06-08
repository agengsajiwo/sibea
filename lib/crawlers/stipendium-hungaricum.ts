/**
 * Crawler: Stipendium Hungaricum — Beasiswa Pemerintah Hongaria
 * Tersedia untuk SEMUA prodi UNU Yogyakarta.
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

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
          namaBeasiswa: "Stipendium Hungaricum — Doctoral Programme (Semua Bidang)",
          penyelenggara: "Pemerintah Hongaria — Tempus Public Foundation",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Hongaria"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup (HUF 140.000/bulan ≈ Rp 5,5 juta)", "Akomodasi Asrama atau Tunjangan Sewa", "Asuransi Kesehatan"],
          keterangan: "Stipendium Hungaricum tersedia untuk semua bidang studi doktor di 30+ universitas Hongaria: Manajemen, Akuntansi, Farmasi, Teknik Elektro, Informatika, Teknik Komputer, Pertanian, Agribisnis, Pendidikan (PGSD/PBI), dan Studi Islam. Kompetisi relatif lebih terbuka dibanding beasiswa Eropa Barat. Pendaftaran online via SHAP. Deadline biasanya Januari setiap tahun.",
          linkPendaftaran: "https://stipendiumhungaricum.hu/apply/",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Stipendium Hungaricum — Doctoral in Natural Sciences & Engineering",
          penyelenggara: "Pemerintah Hongaria — Tempus Public Foundation",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Hongaria (Budapest, Debrecen, Miskolc, Pécs)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi", "Asuransi Kesehatan", "Dana Penelitian"],
          keterangan: "Program doktor Stipendium Hungaricum untuk bidang sains, teknik, informatika, dan farmasi. Universitas Budapest University of Technology (BME) terkenal untuk teknik elektro dan informatika.",
          linkPendaftaran: "https://stipendiumhungaricum.hu/apply/",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "Stipendium Hungaricum — Doctoral in Social Sciences & Humanities",
          penyelenggara: "Pemerintah Hongaria — Tempus Public Foundation",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Hongaria (Budapest, Pécs, Szeged)"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Akomodasi", "Asuransi Kesehatan"],
          keterangan: "Program doktor Stipendium Hungaricum untuk ilmu sosial, manajemen, akuntansi, pendidikan, dan humaniora. Cocok untuk prodi Manajemen, Akuntansi, PGSD, dan PBI UNU Yogyakarta.",
          linkPendaftaran: "https://stipendiumhungaricum.hu/apply/",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
