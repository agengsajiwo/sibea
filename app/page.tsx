import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { ScholarshipCard } from "@/components/ScholarshipCard";
import { ScholarshipFilter } from "@/components/ScholarshipFilter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: { lokasi?: string; skema?: string; search?: string; page?: string };
}

async function getScholarships(searchParams: PageProps["searchParams"]) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const where = {
    status: "PUBLISHED" as const,
    isActive: true,
    ...(searchParams.lokasi === "DALAM_NEGERI" || searchParams.lokasi === "LUAR_NEGERI"
      ? { lokasi: searchParams.lokasi }
      : {}),
    ...(searchParams.skema ? { skemaPembiayaan: { contains: searchParams.skema } } : {}),
    ...(searchParams.search
      ? {
          OR: [
            { namaBeasiswa: { contains: searchParams.search, mode: "insensitive" as const } },
            { penyelenggara: { contains: searchParams.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, scholarships] = await Promise.all([
    prisma.scholarship.count({ where }),
    prisma.scholarship.findMany({
      where,
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return { scholarships, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export default async function HomePage({ searchParams }: PageProps) {
  const { scholarships, total, page, totalPages } = await getScholarships(searchParams);

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (searchParams.lokasi) params.set("lokasi", searchParams.lokasi);
    if (searchParams.skema) params.set("skema", searchParams.skema);
    if (searchParams.search) params.set("search", searchParams.search);
    params.set("page", String(p));
    return `/?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 rounded-full p-3">
              <BookOpen className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Sistem Informasi Beasiswa Doktor (S3)
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto">
            Portal beasiswa program doktor untuk dosen Universitas Nahdlatul Ulama Yogyakarta.
            Data diverifikasi oleh tim admin sebelum dipublikasikan.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm text-blue-200">
            <span><strong className="text-white">{total}</strong> beasiswa tersedia</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filter */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div className="bg-white rounded-lg border p-4 animate-pulse h-48" />}>
              <ScholarshipFilter />
            </Suspense>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {scholarships.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">Tidak ada beasiswa ditemukan</p>
                <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Menampilkan <strong>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}</strong> dari <strong>{total}</strong> beasiswa
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {scholarships.map((s) => (
                    <ScholarshipCard
                      key={s.id}
                      id={s.id}
                      namaBeasiswa={s.namaBeasiswa}
                      penyelenggara={s.penyelenggara}
                      lokasi={s.lokasi}
                      skemaPembiayaan={s.skemaPembiayaan}
                      pilihanLokasi={safeParseArray(s.pilihanLokasi)}
                      deadline={s.deadline}
                      keterangan={s.keterangan}
                      linkPendaftaran={s.linkPendaftaran}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                      <Link href={buildUrl(page - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Link>
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          asChild
                        >
                          <Link href={buildUrl(p)}>{p}</Link>
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
                      <Link href={buildUrl(page + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <footer className="border-t bg-white mt-8 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Universitas Nahdlatul Ulama Yogyakarta — Sistem Informasi Beasiswa Doktor
      </footer>
    </div>
  );
}

function safeParseArray(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return [raw]; }
}
