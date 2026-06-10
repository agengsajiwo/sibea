import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { AdminUserForm } from "@/components/AdminUserForm";

export default function NewAdminUserPage() {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-3">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar Admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Admin Baru</h1>
        <p className="text-sm text-gray-500 mt-1">
          Admin baru dapat langsung login dan menggunakan semua fitur dashboard.
        </p>
      </div>
      <AdminUserForm />
    </div>
  );
}
