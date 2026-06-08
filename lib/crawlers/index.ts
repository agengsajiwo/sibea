import { prisma } from "@/lib/prisma";
import { computeContentHash } from "@/lib/utils/hash";
import { RawScholarship } from "@/lib/schemas/scholarship";
import { runAllCrawlers, ScholarshipCrawler } from "./base";

import { KemdikbudCrawler } from "./kemdikbud";
import { LpdpCrawler } from "./lpdp";
import { KemenagCrawler } from "./kemenag";
import { BrinCrawler } from "./brin";
import { MextCrawler } from "./mext";
import { CscChinaCrawler } from "./csc-china";
import { TurkiyeBurslariCrawler } from "./turkiye-burslari";
import { IsdbCrawler } from "./isdb";
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
  new KemdikbudCrawler(),
  new LpdpCrawler(),
  new KemenagCrawler(),
  new BrinCrawler(),
  new MextCrawler(),
  new CscChinaCrawler(),
  new TurkiyeBurslariCrawler(),
  new IsdbCrawler(),
  new DaadCrawler(),
  new CheveningCrawler(),
  new AustraliaAwardsCrawler(),
  new FulbrightCrawler(),
  new ErasmusMundusCrawler(),
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
  return ALL_CRAWLERS.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/** Normalisasi teks untuk perbandingan duplikat (case-insensitive, hapus spasi ganda) */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Simpan hasil crawling ke DB — alur semi-otomatis dengan deduplikasi robust:
 *
 * Cek duplikat berlapis:
 * 1. contentHash exact match → skip
 * 2. Nama + penyelenggara (normalized) → cek semua status
 * 3. URL pendaftaran sama → cek semua status
 *
 * Data PUBLISHED tidak pernah ditimpa secara diam-diam.
 */
export async function processAndSaveCrawlResults(
  crawlerName: string,
  scholarships: RawScholarship[]
): Promise<{ jumlahBaru: number; jumlahDiperbarui: number }> {
  let jumlahBaru = 0;
  let jumlahDiperbarui = 0;

  // Ambil semua entri yang sudah ada (PUBLISHED + PENDING_REVIEW) sekali saja
  // untuk menghindari N+1 query
  const existingAll = await prisma.scholarship.findMany({
    where: { status: { in: ["PUBLISHED", "PENDING_REVIEW"] }, isActive: true },
    select: {
      id: true,
      namaBeasiswa: true,
      penyelenggara: true,
      linkPendaftaran: true,
      contentHash: true,
      status: true,
    },
  });

  for (const s of scholarships) {
    const contentHash = computeContentHash({
      namaBeasiswa: s.namaBeasiswa,
      penyelenggara: s.penyelenggara,
      linkPendaftaran: s.linkPendaftaran,
      deadline: s.deadline,
      skemaPembiayaan: s.skemaPembiayaan,
    });

    // Cek 1: contentHash exact match → sudah ada persis, skip
    const byHash = existingAll.find((e) => e.contentHash === contentHash);
    if (byHash) continue;

    // Cek 2: nama + penyelenggara (normalized) sudah ada?
    const normNama = normalize(s.namaBeasiswa);
    const normPeny = normalize(s.penyelenggara);
    const byName = existingAll.find(
      (e) =>
        normalize(e.namaBeasiswa) === normNama &&
        normalize(e.penyelenggara) === normPeny
    );

    // Cek 3: URL pendaftaran sama sudah ada?
    const normUrl = s.linkPendaftaran.trim().toLowerCase().replace(/\/$/, "");
    const byUrl = existingAll.find(
      (e) =>
        e.linkPendaftaran.trim().toLowerCase().replace(/\/$/, "") === normUrl
    );

    const existingPublished = byName?.status === "PUBLISHED" || byUrl?.status === "PUBLISHED"
      ? (byName ?? byUrl)
      : null;
    const existingPending = byName?.status === "PENDING_REVIEW" || byUrl?.status === "PENDING_REVIEW"
      ? (byName ?? byUrl)
      : null;

    if (existingPending) {
      // Sudah ada di antrian review dengan nama/URL sama → skip
      continue;
    }

    if (existingPublished) {
      // Sudah PUBLISHED dengan nama/URL sama tapi content berbeda → tandai pembaruan
      const newEntry = await prisma.scholarship.create({
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
      existingAll.push({ ...newEntry, status: "PENDING_REVIEW" });
      jumlahDiperbarui++;
      continue;
    }

    // Benar-benar baru → tambahkan sebagai PENDING_REVIEW
    const newEntry = await prisma.scholarship.create({
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
    existingAll.push({ ...newEntry, status: "PENDING_REVIEW" });
    jumlahBaru++;
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
        const saved = await processAndSaveCrawlResults(result.crawlerName, result.scholarships);
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
