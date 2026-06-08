/**
 * Crawler: SINGA — Singapore International Graduate Award
 * URL: https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa
 *
 * Relevan untuk: Informatika, Teknik Elektro, Teknik Komputer, Farmasi,
 *               Teknologi Hasil Pertanian (biotech/food science)
 * Singapura — dekat, bahasa Inggris, standar riset kelas dunia.
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

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
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
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
        komponenPembiayaan: ["Biaya Kuliah Penuh", "Tunjangan Hidup Bulanan (SGD 2.000)", "Tunjangan Perjalanan", "Asuransi Kesehatan", "Settlement Allowance"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.singa.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadline(deadlineRaw),
      });
    });

    if (results.length === 0) results.push(...this.getStaticEntries());
    return results;
  }

  private getStaticEntries(): Partial<RawScholarship>[] {
    return [{
      namaBeasiswa: "Singapore International Graduate Award (SINGA)",
      penyelenggara: "A*STAR, NUS, NTU & SUTD — Singapura",
      lokasi: "LUAR_NEGERI",
      pilihanLokasi: ["Singapura"],
      skemaPembiayaan: "Fully Funded",
      jenisPembiayaan: "Beasiswa Riset Penuh",
      komponenPembiayaan: ["Biaya Kuliah Penuh (4 tahun)", "Tunjangan Hidup Bulanan (SGD 2.000 ≈ Rp 23 juta)", "Tunjangan Perjalanan Awal (SGD 1.000)", "Asuransi Kesehatan", "Dukungan Dana Konferensi"],
      keterangan: "SINGA adalah program beasiswa doktor di Singapura yang dikelola bersama A*STAR, NUS, NTU, dan SUTD. Riset di laboratorium A*STAR kelas dunia dengan supervisor dari universitas terkemuka. Bidang: biomedis, informatika & AI, teknik elektro, ilmu material, kimia, fisika, ilmu pangan & bioteknologi. Dekat dengan Indonesia, bahasa Inggris. Deadline biasanya Juni & Desember.",
      linkPendaftaran: "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa",
      sumberCrawling: this.sourceUrl,
      deadline: null,
    }];
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
