import { ScholarshipForm } from "@/components/ScholarshipForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewScholarshipPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/scholarships" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-3">
          <ChevronLeft className="h-4 w-4" />Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Beasiswa Manual</h1>
        <p className="text-sm text-gray-500 mt-1">
          Data yang disimpan dengan status Published akan langsung tampil di halaman publik.
        </p>
      </div>
      <ScholarshipForm />
    </div>
  );
}
