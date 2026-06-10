"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { GraduationCap, LayoutDashboard, ClipboardList, BookOpen, LogOut, User, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/review", label: "Antrian Review", icon: ClipboardList },
  { href: "/admin/scholarships", label: "Kelola Beasiswa", icon: BookOpen },
  { href: "/admin/users", label: "Kelola Admin", icon: Users },
];

export function AdminNav({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm text-gray-900 hidden sm:block">
                Admin — SIBEA S3
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <User className="h-4 w-4" />
              <span>{user?.name ?? user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
            <Link href="/" className="text-xs text-gray-400 hover:text-blue-600">
              ← Situs Publik
            </Link>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap",
                  active ? "bg-blue-50 text-blue-700" : "text-gray-600"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
