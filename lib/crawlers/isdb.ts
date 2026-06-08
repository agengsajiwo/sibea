import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

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
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.isdb.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Islamic Development Bank (IsDB)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Negara Anggota OKI"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Penuh",
        komponenPembiayaan: ["Biaya Kuliah", "Tunjangan Hidup", "Tiket Pesawat", "Asuransi Kesehatan"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.isdb.baseUrl,
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
          namaBeasiswa: "IsDB Merit Scholarship for High Technology",
          penyelenggara: "Islamic Development Bank (IsDB)",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Negara Anggota OKI", "Arab Saudi", "Malaysia", "Turki"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian"],
          keterangan: "IsDB untuk warga negara anggota OKI. Fokus STEM dan ilmu keislaman. Dosen PTKI diprioritaskan.",
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
          komponenPembiayaan: ["Biaya Kuliah", "Tunjangan Hidup", "Tiket Pesawat PP", "Asuransi Kesehatan", "Dana Penelitian"],
          keterangan: "IsDB STI khusus bidang Sains, Teknologi, dan Inovasi di universitas terbaik dunia.",
          linkPendaftaran: CRAWLER_CONFIG.isdb.baseUrl,
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
