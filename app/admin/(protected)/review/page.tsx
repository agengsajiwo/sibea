import { prisma } from "@/lib/prisma";
import { ReviewCard } from "@/components/ReviewCard";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const pending = await prisma.scholarship.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { tanggalCrawling: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-yellow-600" />
          Antrian Review
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {pending.length} beasiswa menunggu persetujuan. Data yang disetujui akan langsung tampil di halaman publik.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Tidak ada beasiswa dalam antrian review</p>
          <p className="text-sm text-gray-400 mt-1">Semua data telah ditinjau.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((s) => (
            <ReviewCard
              key={s.id}
              scholarship={{
                ...s,
                lokasi: s.lokasi as "DALAM_NEGERI" | "LUAR_NEGERI",
                pilihanLokasi: safeParseArray(s.pilihanLokasi),
                komponenPembiayaan: safeParseArray(s.komponenPembiayaan),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function safeParseArray(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return [raw]; }
}
