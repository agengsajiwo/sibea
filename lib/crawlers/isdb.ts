/**
 * Crawler: Islamic Development Bank (IsDB) Scholarship
 * URL: https://www.isdb.org/scholarship
 *
 * SANGAT relevan untuk UNU Yogyakarta:
 * - Khusus negara anggota OKI (Indonesia termasuk)
 * - Ada program Merit Scholarship & Science, Technology & Innovation
 * - Mendukung riset bidang ekonomi Islam, studi Islam, dll
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class IsdbCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Islamic Development Bank";
  sourceUrl = CRAWLER_CONFIG.isdb.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.isdb.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.isdb.baseUrl}${href}`;
      if (!nama) return;

      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Islamic Development Bank (IsDB)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Arab Saudi", "Negara Anggota OKI"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah",
          "Tunjangan Hidup",
          "Tiket Pesawat",
          "Asuransi Kesehatan",
          "Dana Penelitian",
          "Tunjangan Keluarga (kondisi tertentu)",
        ],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.isdb.baseUrl,
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
        namaBeasiswa: "IsDB Merit Scholarship for High Technology",
        penyelenggara: "Islamic Development Bank (IsDB)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Negara Anggota OKI", "Arab Saudi", "Malaysia", "Turki"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah Penuh",
          "Tunjangan Hidup Bulanan",
          "Tiket Pesawat PP",
          "Asuransi Kesehatan",
          "Dana Penelitian",
          "Tunjangan Kedatangan",
        ],
        keterangan:
          "Program beasiswa IsDB untuk warga negara anggota OKI termasuk Indonesia. Fokus pada bidang sains, teknologi, teknik, matematika (STEM), serta ilmu-ilmu sosial dan keagamaan Islam. Program doktor tersedia di universitas-universitas terkemuka di negara anggota OKI. Dosen dan akademisi dari perguruan tinggi Islam diprioritaskan.",
        linkPendaftaran: CRAWLER_CONFIG.isdb.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
      {
        namaBeasiswa: "IsDB Scholarship for Science, Technology & Innovation (STI)",
        penyelenggara: "Islamic Development Bank (IsDB)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Negara Anggota OKI", "Eropa", "Amerika Serikat", "Jepang"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: [
          "Biaya Kuliah",
          "Tunjangan Hidup",
          "Tiket Pesawat PP",
          "Asuransi Kesehatan",
          "Dana Penelitian",
        ],
        keterangan:
          "Program beasiswa IsDB khusus bidang Sains, Teknologi, dan Inovasi. Mendukung studi doktor di universitas-universitas terbaik dunia termasuk di negara non-OKI. Kandidat harus memiliki rencana penelitian yang berkontribusi pada pengembangan negara Muslim.",
        linkPendaftaran: CRAWLER_CONFIG.isdb.baseUrl,
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
