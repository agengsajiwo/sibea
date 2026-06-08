import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Eye, EyeOff, Bot, User } from "lucide-react";
import { DeleteScholarshipButton } from "@/components/DeleteScholarshipButton";

export const dynamic = "force-dynamic";

interface PageProps { searchParams: { status?: string; page?: string } }

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PENDING_REVIEW: "Pending Review", PUBLISHED: "Dipublikasikan", REJECTED: "Ditolak",
};
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  DRAFT: "secondary", PENDING_REVIEW: "warning", PUBLISHED: "success", REJECTED: "destructive",
};

export default async function ScholarshipsPage({ searchParams }: PageProps) {
  const status = searchParams.status as "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | undefined;
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 20;

  const where = status ? { status } : {};
  const [total, scholarships] = await Promise.all([
    prisma.scholarship.count({ where }),
    prisma.scholarship.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const tabs = ["", "PUBLISHED", "PENDING_REVIEW", "DRAFT", "REJECTED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Beasiswa</h1>
        <Button asChild size="sm">
          <Link href="/admin/scholarships/new"><Plus className="h-4 w-4 mr-1" />Tambah Manual</Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((s) => (
          <Link
            key={s || "all"}
            href={`/admin/scholarships${s ? `?status=${s}` : ""}`}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              (status ?? "") === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s ? STATUS_LABELS[s] : "Semua"}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-500">Nama Beasiswa</th>
              <th className="text-left p-3 font-medium text-gray-500 hidden md:table-cell">Penyelenggara</th>
              <th className="text-left p-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
              <th className="text-left p-3 font-medium text-gray-500 hidden lg:table-cell">Sumber</th>
              <th className="text-right p-3 font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {scholarships.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">Tidak ada data</td>
              </tr>
            ) : scholarships.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3">
                  <p className="font-medium text-gray-900 line-clamp-1">{s.namaBeasiswa}</p>
                  <p className="text-xs text-gray-400 sm:hidden">{s.penyelenggara}</p>
                  <div className="sm:hidden mt-1">
                    <Badge variant={STATUS_VARIANTS[s.status] ?? "default"} className="text-xs">
                      {STATUS_LABELS[s.status]}
                    </Badge>
                  </div>
                </td>
                <td className="p-3 text-gray-600 hidden md:table-cell">{s.penyelenggara}</td>
                <td className="p-3 hidden sm:table-cell">
                  <Badge variant={STATUS_VARIANTS[s.status] ?? "default"} className="text-xs">
                    {STATUS_LABELS[s.status]}
                  </Badge>
                </td>
                <td className="p-3 hidden lg:table-cell">
                  {s.isManualEntry
                    ? <span className="flex items-center gap-1 text-xs text-gray-500"><User className="h-3 w-3" />Manual</span>
                    : <span className="flex items-center gap-1 text-xs text-gray-500"><Bot className="h-3 w-3" />Crawler</span>}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/scholarships/${s.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    {s.isActive ? (
                      <DeleteScholarshipButton id={s.id} />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-300" />
                    )}
                    {s.status === "PUBLISHED" && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/beasiswa/${s.id}`} target="_blank">
                          <Eye className="h-4 w-4 text-green-600" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > limit && (
          <div className="p-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Total: {total}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/scholarships?${status ? `status=${status}&` : ""}page=${page - 1}`}
                  className="px-2 py-1 border rounded hover:bg-gray-50">← Prev</Link>
              )}
              {page * limit < total && (
                <Link href={`/admin/scholarships?${status ? `status=${status}&` : ""}page=${page + 1}`}
                  className="px-2 py-1 border rounded hover:bg-gray-50">Next →</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
