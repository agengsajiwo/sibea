/**
 * Crawler: SINGA + NUS/NTU Research Scholarship
 * Relevan: Informatika, Teknik Elektro, Teknik Komputer, Farmasi
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";
import { crawlWithFallback } from "./crawler-helper";

export class SingaCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "SINGA Singapore";
  sourceUrl = CRAWLER_CONFIG.singa.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.singa.selectors;
    const results: Partial<RawScholarship>[] = [];
    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.singa.baseUrl}${href}`;
      if (!nama) return;
      results.push({
        namaBeasiswa: nama,
        penyelenggara: "A*STAR / NUS / NTU / SUTD — Singapura",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Singapura"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Riset",
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup (SGD 2.000/bulan)", "Tiket Pesawat", "Asuransi Kesehatan"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.singa.baseUrl,
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
          namaBeasiswa: "Singapore International Graduate Award (SINGA)",
          penyelenggara: "A*STAR, NUS, NTU & SUTD — Singapura",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Singapura"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh (4 tahun)", "Tunjangan Hidup (SGD 2.000/bulan ≈ Rp 23 juta)", "Tunjangan Perjalanan Awal (SGD 1.000)", "Asuransi Kesehatan", "Dana Konferensi"],
          keterangan: "SINGA program beasiswa doktor di Singapura bersama A*STAR, NUS, NTU, dan SUTD. Bidang: biomedis, informatika & AI, teknik elektro, material, ilmu pangan. Dekat Indonesia, bahasa Inggris, lingkungan riset kompetitif. Deadline biasanya Juni & Desember.",
          linkPendaftaran: "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "NUS Research Scholarship — PhD Programme",
          penyelenggara: "National University of Singapore (NUS)",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Singapura"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (SGD 2.000)", "Asuransi Kesehatan", "Dana Penelitian"],
          keterangan: "NUS Research Scholarship untuk program PhD di seluruh fakultas NUS. NUS secara konsisten masuk top 15 universitas dunia. Relevan untuk prodi Informatika, Teknik Komputer, Farmasi, dan Manajemen UNU Yogyakarta.",
          linkPendaftaran: "https://nus.edu.sg/admissions/graduate/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
        {
          namaBeasiswa: "NTU Research Scholarship — PhD Programme",
          penyelenggara: "Nanyang Technological University (NTU) — Singapura",
          lokasi: "LUAR_NEGERI",
          pilihanLokasi: ["Singapura"],
          skemaPembiayaan: "Fully Funded",
          jenisPembiayaan: "Beasiswa Riset Penuh",
          komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (SGD 2.000)", "Asuransi Kesehatan", "Dana Penelitian"],
          keterangan: "NTU Research Scholarship untuk PhD di bidang teknik, sains, bisnis, dan seni. NTU masuk top 20 universitas dunia, khususnya kuat untuk teknik elektro, informatika, dan material.",
          linkPendaftaran: "https://www.ntu.edu.sg/admissions/graduate/scholarships",
          sumberCrawling: this.sourceUrl,
          deadline: null,
        },
      ],
    });
  }
}
