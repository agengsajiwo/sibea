import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, MapPin, ExternalLink, Building, Globe,
  ChevronLeft, Clock, CheckCircle, Tag, Banknote, List,
} from "lucide-react";

function safeParseArray(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return [raw]; }
}

function DeadlineBadge({ deadline }: { deadline: Date | null }) {
  if (!deadline) return <span className="text-gray-500 text-sm">Tidak diketahui</span>;
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const formatted = deadline.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  if (days < 0) return <Badge variant="destructive">Ditutup — {formatted}</Badge>;
  if (days <= 14) return <Badge variant="warning">Tutup {days} hari lagi ({formatted})</Badge>;
  return <Badge variant="info">{formatted}</Badge>;
}

export default async function BeasiswaDetailPage({ params }: { params: { id: string } }) {
  const scholarship = await prisma.scholarship.findUnique({
    where: { id: params.id, status: "PUBLISHED", isActive: true },
  });
  if (!scholarship) notFound();

  const pilihanLokasi = safeParseArray(scholarship.pilihanLokasi);
  const komponenPembiayaan = safeParseArray(scholarship.komponenPembiayaan);
  const isClosed = scholarship.deadline && scholarship.deadline < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-6">
          <ChevronLeft className="h-4 w-4" />Kembali ke Daftar Beasiswa
        </Link>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Header card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-white/20 text-white border-white/30">
                {scholarship.lokasi === "DALAM_NEGERI" ? (
                  <><Building className="h-3 w-3 mr-1" />Dalam Negeri</>
                ) : (
                  <><Globe className="h-3 w-3 mr-1" />Luar Negeri</>
                )}
              </Badge>
              {scholarship.skemaPembiayaan.toLowerCase().includes("fully") && (
                <Badge className="bg-green-500/80 text-white border-0">Fully Funded</Badge>
              )}
              {isClosed && (
                <Badge className="bg-red-500/80 text-white border-0">Pendaftaran Ditutup</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-snug mb-1">{scholarship.namaBeasiswa}</h1>
            <p className="text-blue-100 flex items-center gap-1">
              <Building className="h-4 w-4" />{scholarship.penyelenggara}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={<Calendar />} label="Deadline Pendaftaran">
                <DeadlineBadge deadline={scholarship.deadline} />
              </InfoRow>
              <InfoRow icon={<MapPin />} label="Lokasi Tujuan">
                <span className="text-sm">{pilihanLokasi.join(", ")}</span>
              </InfoRow>
              <InfoRow icon={<Banknote />} label="Skema Pembiayaan">
                <span className="text-sm">{scholarship.skemaPembiayaan}</span>
              </InfoRow>
              <InfoRow icon={<Tag />} label="Jenis Pembiayaan">
                <span className="text-sm">{scholarship.jenisPembiayaan}</span>
              </InfoRow>
            </div>

            {/* Komponen Pembiayaan */}
            {komponenPembiayaan.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <List className="h-4 w-4 text-blue-600" />Komponen Pembiayaan
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {komponenPembiayaan.map((k, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Keterangan */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Keterangan</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {scholarship.keterangan}
              </p>
            </div>

            {/* CTA */}
            <div className="border-t pt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Terakhir diperbarui:{" "}
                {scholarship.updatedAt.toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                })}
                {!scholarship.isManualEntry && " (via crawler)"}
              </div>
              <Button size="lg" disabled={!!isClosed} asChild>
                <a href={scholarship.linkPendaftaran} target="_blank" rel="noopener noreferrer">
                  Daftar Sekarang <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-blue-500 mt-0.5 h-4 w-4 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
