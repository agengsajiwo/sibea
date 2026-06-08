import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-gray-900">
              Sistem Informasi Beasiswa Doktor
            </p>
            <p className="text-xs text-gray-500">Universitas Nahdlatul Ulama Yogyakarta</p>
          </div>
          <div className="block sm:hidden">
            <p className="text-sm font-bold text-gray-900">SIBEA S3 — UNU Yogyakarta</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
            Beranda
          </Link>
          <Link
            href="/admin"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
