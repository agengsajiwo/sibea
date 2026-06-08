import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { SessionProvider } from "@/components/SessionProvider";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-50">
        <AdminNav user={session.user} />
        <main className="container mx-auto max-w-7xl px-4 py-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
