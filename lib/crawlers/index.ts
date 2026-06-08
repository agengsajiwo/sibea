import { prisma } from "@/lib/prisma";
import { computeContentHash } from "@/lib/utils/hash";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { runAllCrawlers, ScholarshipCrawler } from "./base";

// ── Crawler Indonesia ───────────────────────────────────────
import { KemdikbudCrawler } from "./kemdikbud";
import { LpdpCrawler } from "./lpdp";
import { KemenagCrawler } from "./kemenag";
import { BrinCrawler } from "./brin";

// ── Crawler Asia ────────────────────────────────────────────
import { MextCrawler } from "./mext";
import { CscChinaCrawler } from "./csc-china";
import { TurkiyeBurslariCrawler } from "./turkiye-burslari";
import { IsdbCrawler } from "./isdb";

// ── Crawler Eropa & Lainnya ─────────────────────────────────
import { DaadCrawler } from "./daad";
import { CheveningCrawler } from "./chevening";
import { AustraliaAwardsCrawler } from "./australia-awards";
import { FulbrightCrawler } from "./fulbright";
import { ErasmusMundusCrawler } from "./erasmus-mundus";
import { StipendiumHungaricumCrawler } from "./stipendium-hungaricum";
import { SearcaCrawler } from "./searca";
import { AdbJspCrawler } from "./adb-jsp";
import { AlAzharCrawler } from "./alazhar-sacm";
import { EiffelCrawler } from "./eiffel";
import { SingaCrawler } from "./singa";
import { WageningenCrawler } from "./wageningen";
import { TechFellowshipCrawler } from "./tech-fellowship";

export const ALL_CRAWLERS: ScholarshipCrawler[] = [
  // Indonesia
  new KemdikbudCrawler(),
  new LpdpCrawler(),
  new KemenagCrawler(),
  new BrinCrawler(),
  // Asia
  new MextCrawler(),
  new CscChinaCrawler(),
  new TurkiyeBurslariCrawler(),
  new IsdbCrawler(),
  // Eropa & lainnya
  new DaadCrawler(),
  new CheveningCrawler(),
  new AustraliaAwardsCrawler(),
  new FulbrightCrawler(),
  new ErasmusMundusCrawler(),
  // Prioritas tinggi — cakupan semua prodi UNU Yogyakarta
  new StipendiumHungaricumCrawler(),
  new SearcaCrawler(),
  new AdbJspCrawler(),
  new AlAzharCrawler(),
  new EiffelCrawler(),
  new SingaCrawler(),
  new WageningenCrawler(),
  new TechFellowshipCrawler(),
];

export function getCrawlerByName(name: string): ScholarshipCrawler | undefined {
  return ALL_CRAWLERS.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Simpan hasil crawling ke DB dengan alur semi-otomatis:
 * - Data baru → PENDING_REVIEW
 * - Data berubah (contentHash beda dari PUBLISHED) → PENDING_REVIEW baru
 * - Data tidak berubah → skip
 * Data PUBLISHED tidak pernah ditimpa secara diam-diam.
 */
export async function processAndSaveCrawlResults(
  crawlerName: string,
  scholarships: RawScholarship[]
): Promise<{ jumlahBaru: number; jumlahDiperbarui: number }> {
  let jumlahBaru = 0;
  let jumlahDiperbarui = 0;

  for (const s of scholarships) {
    const contentHash = computeContentHash({
      namaBeasiswa: s.namaBeasiswa,
      penyelenggara: s.penyelenggara,
      linkPendaftaran: s.linkPendaftaran,
      deadline: s.deadline,
      skemaPembiayaan: s.skemaPembiayaan,
    });

    // Cek apakah sudah ada data PUBLISHED dengan nama + penyelenggara sama
    const existing = await prisma.scholarship.findFirst({
      where: {
        namaBeasiswa: s.namaBeasiswa,
        penyelenggara: s.penyelenggara,
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      if (existing.contentHash === contentHash) continue; // tidak ada perubahan

      // Ada perubahan — buat entri PENDING_REVIEW, JANGAN timpa PUBLISHED
      await prisma.scholarship.create({
        data: {
          namaBeasiswa: s.namaBeasiswa,
          penyelenggara: s.penyelenggara,
          lokasi: s.lokasi,
          pilihanLokasi: JSON.stringify(s.pilihanLokasi),
          skemaPembiayaan: s.skemaPembiayaan,
          jenisPembiayaan: s.jenisPembiayaan,
          komponenPembiayaan: JSON.stringify(s.komponenPembiayaan),
          keterangan: s.keterangan,
          linkPendaftaran: s.linkPendaftaran,
          sumberCrawling: s.sumberCrawling,
          deadline: s.deadline ?? null,
          status: "PENDING_REVIEW",
          contentHash,
          tanggalCrawling: new Date(),
          isManualEntry: false,
        },
      });
      jumlahDiperbarui++;
    } else {
      // Cek duplikat antrian PENDING_REVIEW dengan hash yang sama
      const existingPending = await prisma.scholarship.findFirst({
        where: { contentHash, status: "PENDING_REVIEW" },
      });
      if (existingPending) continue;

      await prisma.scholarship.create({
        data: {
          namaBeasiswa: s.namaBeasiswa,
          penyelenggara: s.penyelenggara,
          lokasi: s.lokasi,
          pilihanLokasi: JSON.stringify(s.pilihanLokasi),
          skemaPembiayaan: s.skemaPembiayaan,
          jenisPembiayaan: s.jenisPembiayaan,
          komponenPembiayaan: JSON.stringify(s.komponenPembiayaan),
          keterangan: s.keterangan,
          linkPendaftaran: s.linkPendaftaran,
          sumberCrawling: s.sumberCrawling,
          deadline: s.deadline ?? null,
          status: "PENDING_REVIEW",
          contentHash,
          tanggalCrawling: new Date(),
          isManualEntry: false,
        },
      });
      jumlahBaru++;
    }
  }

  return { jumlahBaru, jumlahDiperbarui };
}

export async function runCrawlJob(crawlerNames?: string[]) {
  const crawlers = crawlerNames
    ? ALL_CRAWLERS.filter((c) =>
        crawlerNames.some((n) => n.toLowerCase() === c.name.toLowerCase())
      )
    : ALL_CRAWLERS;

  const results = await runAllCrawlers(crawlers);

  for (const result of results) {
    const start = Date.now();
    let jumlahBaru = 0;
    let jumlahDiperbarui = 0;
    let errorMessage: string | undefined;
    let status: "SUCCESS" | "FAILED" | "PARTIAL" = "SUCCESS";

    try {
      if (result.error) {
        status = "FAILED";
        errorMessage = result.error;
      } else {
        const saved = await processAndSaveCrawlResults(
          result.crawlerName,
          result.scholarships
        );
        jumlahBaru = saved.jumlahBaru;
        jumlahDiperbarui = saved.jumlahDiperbarui;
      }
    } catch (err) {
      status = "PARTIAL";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    await prisma.crawlLog.create({
      data: {
        sumber: result.crawlerName,
        status,
        jumlahDitemukan: result.scholarships.length,
        jumlahBaru,
        jumlahDiperbarui,
        errorMessage,
        durasiMs: Date.now() - start,
      },
    });
  }

  return results;
}
