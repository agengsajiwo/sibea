import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback, parseDeadlineId } from "./crawler-helper";

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
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (¥143.000–¥145.000)", "Tiket Pesawat PP"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.mext.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadlineId(deadlineRaw),
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
          namaBeasiswa: "MEXT Research Student Scholarship (Embassy Recommendation)",
          penyelenggara: "Ministry of Education, Culture, Sports, Science and Technology (MEXT) Japan",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Jepang"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (¥143.000–¥145.000)", "Tiket Pesawat PP", "Bebas Biaya Ujian Masuk"],
          keterangan: "Beasiswa MEXT jalur Kedutaan untuk Research Student yang dapat dilanjutkan ke program doktor. Pendaftaran melalui Kedubes Jepang di Jakarta.",
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
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan", "Tiket Pesawat PP"],
          keterangan: "Beasiswa MEXT jalur rekomendasi universitas Jepang. Pendaftar menghubungi langsung professor di universitas tujuan.",
          linkPendaftaran: CRAWLER_CONFIG.mext.baseUrl,
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
