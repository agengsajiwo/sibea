import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import { AdminUserActions } from "@/components/AdminUserActions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Kelola Akun Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} akun admin terdaftar. Setiap akun dapat login dari perangkat berbeda secara bersamaan.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/users/new">
            <Plus className="h-4 w-4 mr-1" /> Tambah Admin
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-500">Nama</th>
              <th className="text-left p-4 font-medium text-gray-500">Email</th>
              <th className="text-left p-4 font-medium text-gray-500 hidden sm:table-cell">Bergabung</th>
              <th className="text-right p-4 font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentUser = user.email === session?.user?.email;
              return (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        {isCurrentUser && (
                          <Badge variant="info" className="text-xs mt-0.5">Akun Anda</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4 text-gray-400 text-xs hidden sm:table-cell">
                    {user.createdAt.toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </td>
                  <td className="p-4">
                    <AdminUserActions
                      userId={user.id}
                      userName={user.name}
                      userEmail={user.email}
                      isCurrentUser={isCurrentUser}
                      totalUsers={users.length}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>ℹ️ Multi-sesi:</strong> Setiap admin dapat login dari perangkat/browser berbeda secara bersamaan.
        Sesi menggunakan JWT (tidak tersimpan di server), sehingga logout di satu perangkat tidak mempengaruhi sesi lain.
      </div>
    </div>
  );
}
