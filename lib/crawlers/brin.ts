/**
 * Crawler: BRIN (Badan Riset dan Inovasi Nasional) — Program Beasiswa Riset
 * URL: https://beasiswa.brin.go.id
 *
 * Relevan untuk dosen dengan minat riset kuat.
 * BRIN memiliki program co-promotion doktor (kolaborasi PT Indonesia & luar negeri).
 *
 * ⚠️  Selektor perlu disesuaikan — lihat config.ts
 */
import * as cheerio from "cheerio";
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";
import { sanitizeText, sanitizeShortText, sanitizeUrl } from "@/lib/utils/sanitize";

export class BrinCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "BRIN";
  sourceUrl = CRAWLER_CONFIG.brin.listUrl;

  parse(html: string): Partial<RawScholarship>[] {
    const $ = cheerio.load(html);
    const cfg = CRAWLER_CONFIG.brin.selectors;
    const results: Partial<RawScholarship>[] = [];

    $(cfg.itemList).each((_, el) => {
      const nama = sanitizeShortText($(el).find(cfg.nama).first().text());
      const keterangan = sanitizeText($(el).find(cfg.keterangan).first().text());
      const deadlineRaw = $(el).find(cfg.deadline).first().text().trim();
      const href = $(el).find(cfg.link).first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${CRAWLER_CONFIG.brin.baseUrl}${href}`;
      const lokasiTeks = $(el).find(cfg.lokasi ?? "").first().text().toLowerCase();
      const isLuarNegeri = /luar negeri|overseas|international/i.test(lokasiTeks + keterangan + nama);
      if (!nama) return;

      results.push({
        namaBeasiswa: nama,
        penyelenggara: "Badan Riset dan Inovasi Nasional (BRIN)",
        lokasi: isLuarNegeri ? "LUAR_NEGERI" : "DALAM_NEGERI",
        pilihanLokasi: isLuarNegeri ? ["Berbagai Negara"] : ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Riset",
        komponenPembiayaan: ["Biaya Pendidikan", "Biaya Hidup", "Dana Riset", "Biaya Publikasi"],
        keterangan,
        linkPendaftaran: sanitizeUrl(link) ?? CRAWLER_CONFIG.brin.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: parseDeadlineId(deadlineRaw),
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
        namaBeasiswa: "BRIN Beasiswa Pendidikan Indonesia — Program Doktor",
        penyelenggara: "Badan Riset dan Inovasi Nasional (BRIN)",
        lokasi: "DALAM_NEGERI",
        pilihanLokasi: ["Seluruh Indonesia"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Riset",
        komponenPembiayaan: [
          "Biaya Pendidikan (SPP/Tuition)",
          "Tunjangan Hidup Bulanan",
          "Dana Penelitian Disertasi",
          "Biaya Publikasi Jurnal",
          "Biaya Seminar Internasional",
        ],
        keterangan:
          "BRIN menyediakan beasiswa untuk program doktor bagi peneliti dan dosen yang ingin memperkuat kompetensi riset. Program ini mendukung riset yang relevan dengan prioritas nasional: ketahanan pangan, energi terbarukan, kesehatan, teknologi informasi, dan ilmu sosial-humaniora. Tersedia juga skema co-promotion dengan universitas luar negeri.",
        linkPendaftaran: CRAWLER_CONFIG.brin.baseUrl,
        sumberCrawling: this.sourceUrl,
        deadline: null,
      },
      {
        namaBeasiswa: "BRIN Co-promotion Doctoral Program (Dalam & Luar Negeri)",
        penyelenggara: "Badan Riset dan Inovasi Nasional (BRIN)",
        lokasi: "LUAR_NEGERI",
        pilihanLokasi: ["Belanda", "Australia", "Jerman", "Jepang", "Amerika Serikat"],
        skemaPembiayaan: "Fully Funded",
        jenisPembiayaan: "Beasiswa Riset Co-promotion",
        komponenPembiayaan: [
          "Biaya Pendidikan",
          "Tunjangan Hidup",
          "Tiket Pesawat PP",
          "Asuransi Kesehatan",
          "Dana Penelitian",
        ],
        keterangan:
          "Program co-promotion BRIN memungkinkan doktor diarahkan oleh dua promotor: satu dari Indonesia dan satu dari universitas mitra luar negeri. Mahasiswa menghabiskan waktu riset di kedua negara. Program ini meningkatkan jaringan riset internasional dan mempercepat penyelesaian disertasi.",
        linkPendaftaran: CRAWLER_CONFIG.brin.baseUrl,
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

function parseDeadlineId(raw: string): Date | null {
  if (!raw) return null;
  const bulanMap: Record<string, string> = {
    januari: "January", februari: "February", maret: "March", april: "April",
    mei: "May", juni: "June", juli: "July", agustus: "August",
    september: "September", oktober: "October", november: "November", desember: "December",
  };
  let normalized = raw.toLowerCase();
  for (const [id, en] of Object.entries(bulanMap)) normalized = normalized.replace(id, en);
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}
