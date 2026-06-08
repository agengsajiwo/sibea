import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ScholarshipForm } from "@/components/ScholarshipForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

function safeParseArray(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return [raw]; }
}

export default async function EditScholarshipPage({ params }: { params: { id: string } }) {
  const s = await prisma.scholarship.findUnique({ where: { id: params.id } });
  if (!s) notFound();

  const initialData = {
    namaBeasiswa: s.namaBeasiswa,
    penyelenggara: s.penyelenggara,
    lokasi: s.lokasi as "DALAM_NEGERI" | "LUAR_NEGERI",
    pilihanLokasi: safeParseArray(s.pilihanLokasi),
    skemaPembiayaan: s.skemaPembiayaan,
    jenisPembiayaan: s.jenisPembiayaan,
    komponenPembiayaan: safeParseArray(s.komponenPembiayaan),
    keterangan: s.keterangan,
    linkPendaftaran: s.linkPendaftaran,
    deadline: s.deadline ? s.deadline.toISOString().slice(0, 10) : "",
    status: s.status as "DRAFT" | "PENDING_REVIEW" | "PUBLISHED",
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/scholarships" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-3">
          <ChevronLeft className="h-4 w-4" />Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Beasiswa</h1>
        <p className="text-sm text-gray-500 mt-1">{s.namaBeasiswa}</p>
      </div>
      <ScholarshipForm initialData={initialData} id={s.id} />
    </div>
  );
}
