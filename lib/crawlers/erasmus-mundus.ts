/**
 * Crawler: Erasmus Mundus Joint Doctorate (EMJD) — European Commission
 * URL: https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en
 *
 * Program doktor bersama antar universitas Eropa — sangat bergengsi.
 * Tersedia untuk hampir semua bidang, termasuk humaniora & ilmu sosial.
 *
 * ⚠️  Situs EU menggunakan JavaScript berat — Playwright diperlukan.
 *     Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class ErasmusMundusCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Erasmus Mundus";
  sourceUrl = CRAWLER_CONFIG.erasmusMundus.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.erasmusMundus.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().attr("datetime")
        ?? $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.erasmusMundus.baseUrl}${href}`;
      const bidang = $(el).find(cfg.bidang ?? "").first().text();
      if (!nama) return;

      results.push({
        namaBeasiswa: `Erasmus Mundus Joint Doctorate: ${nama}`,
        penyelenggara: "European Commission (Erasmus+)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Eropa (multi-negara)", "Prancis", "Jerman", "Belanda", "Belgia", "Italia", "Spanyol"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Doktor Bersama (Joint Doctorate)",
        komponenPembiayaan: [
          "Contribution to Living Costs (€1.500/bulan)",
          "Travel & Installation Costs",
          "Research & Training Costs",
          "Tuition Fees",
          "Asuransi Kesehatan",
        ],
        keterangan: keterangan || `Program Erasmus Mundus Joint Doctorate bidang ${bidang || "berbagai ilmu"}. Mahasiswa belajar di minimal 2 universitas Eropa secara bergantian dan mendapatkan gelar doktor bersama (joint/double degree).`,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.erasmusMundus.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: deadlineRaw ? new Date(deadlineRaw) : null,
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
        namaBeasiswa: "Erasmus Mundus Joint Doctorate (EMJD)",
        penyelenggara: "European Commission — Erasmus+ Programme",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Eropa (multi-negara)", "Prancis", "Jerman", "Belanda", "Italia", "Spanyol", "Belgia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Doktor Bersama",
        komponenPembiayaan: [
          "Living Allowance (€1.500/bulan)",
          "Travel & Installation Grant",
          "Research & Training Costs (€7.500/tahun)",
          "Tuition Fees (seluruh universitas konsorsium)",
          "Asuransi Kesehatan",
        ],
        keterangan:
          "Erasmus Mundus Joint Doctorate (EMJD) adalah program beasiswa penuh dari Komisi Eropa untuk studi doktor di konsorsium universitas-universitas Eropa. Mahasiswa menghabiskan waktu di minimal 2 negara Eropa dan mendapatkan gelar doktor bersama (joint atau double degree). Tersedia ratusan program di semua bidang ilmu: humaniora, ilmu sosial, sains, teknik, dll. Deadline bervariasi per program, biasanya November–Januari.",
        linkPendaftaran: CRAWLER_CONFIG.erasmusMundus.baseUrl,
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
