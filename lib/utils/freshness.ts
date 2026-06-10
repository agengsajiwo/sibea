import { prisma } from "@/lib/prisma";

export interface FreshnessScholarship {
  id: string;
  namaBeasiswa: string;
  penyelenggara: string;
  deadline: Date | null;
  tanggalCrawling: Date;
  updatedAt: Date;
  isManualEntry: boolean;
  hariKeDeadline: number | null; // negatif = sudah lewat
  hariSejakVerifikasi: number;
}

export interface FreshnessReport {
  deadlineLewat: FreshnessScholarship[];   // PUBLISHED tapi deadline sudah lewat
  deadlineMendekat: FreshnessScholarship[]; // deadline ≤ 30 hari lagi
  perluVerifikasi: FreshnessScholarship[];  // >90 hari tidak diverifikasi
  totalPublished: number;
}

const HARI_MS = 1000 * 60 * 60 * 24;
const AMBANG_MENDEKAT = 30; // hari
const AMBANG_BASI = 90;     // hari sejak verifikasi terakhir

function hitungHari(dari: Date, ke: Date): number {
  return Math.ceil((ke.getTime() - dari.getTime()) / HARI_MS);
}

export async function getFreshnessReport(): Promise<FreshnessReport> {
  const now = new Date();

  const published = await prisma.scholarship.findMany({
    where: { status: "PUBLISHED", isActive: true },
    select: {
      id: true,
      namaBeasiswa: true,
      penyelenggara: true,
      deadline: true,
      tanggalCrawling: true,
      updatedAt: true,
      isManualEntry: true,
    },
  });

  const enriched: FreshnessScholarship[] = published.map((s) => ({
    ...s,
    hariKeDeadline: s.deadline ? hitungHari(now, s.deadline) : null,
    hariSejakVerifikasi: hitungHari(s.tanggalCrawling, now),
  }));

  const deadlineLewat = enriched
    .filter((s) => s.hariKeDeadline !== null && s.hariKeDeadline < 0)
    .sort((a, b) => (b.hariKeDeadline ?? 0) - (a.hariKeDeadline ?? 0));

  const deadlineMendekat = enriched
    .filter((s) => s.hariKeDeadline !== null && s.hariKeDeadline >= 0 && s.hariKeDeadline <= AMBANG_MENDEKAT)
    .sort((a, b) => (a.hariKeDeadline ?? 0) - (b.hariKeDeadline ?? 0));

  const perluVerifikasi = enriched
    .filter((s) => s.hariSejakVerifikasi >= AMBANG_BASI)
    .sort((a, b) => b.hariSejakVerifikasi - a.hariSejakVerifikasi);

  return {
    deadlineLewat,
    deadlineMendekat,
    perluVerifikasi,
    totalPublished: published.length,
  };
}
