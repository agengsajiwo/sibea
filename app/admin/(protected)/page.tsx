import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ClipboardList, BookOpen, CheckCircle, XCircle, RefreshCw, Activity } from "lucide-react";
import { CrawlTriggerButton } from "@/components/CrawlTriggerButton";

async function getDashboardData() {
  const [pending, published, rejected, recentLogs] = await Promise.all([
    prisma.scholarship.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.scholarship.count({ where: { status: "PUBLISHED" } }),
    prisma.scholarship.count({ where: { status: "REJECTED" } }),
    prisma.crawlLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Log terbaru per sumber
  const latestBySumber = recentLogs.reduce<Record<string, typeof recentLogs[0]>>((acc, log) => {
    if (!acc[log.sumber]) acc[log.sumber] = log;
    return acc;
  }, {});

  return { pending, published, rejected, latestBySumber: Object.values(latestBySumber), recentLogs };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const { pending, published, rejected, latestBySumber, recentLogs } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">Selamat datang, {session?.user?.name}</p>
        </div>
        <CrawlTriggerButton />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          title="Menunggu Review"
          value={pending}
          icon={<ClipboardList className="h-5 w-5 text-yellow-600" />}
          color="yellow"
          href="/admin/review"
        />
        <StatCard
          title="Dipublikasikan"
          value={published}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          color="green"
          href="/admin/scholarships?status=PUBLISHED"
        />
        <StatCard
          title="Ditolak"
          value={rejected}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          color="red"
          href="/admin/scholarships?status=REJECTED"
        />
      </div>

      {/* Aksi cepat */}
      {pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-yellow-800">{pending} beasiswa menunggu review</p>
            <p className="text-sm text-yellow-600 mt-0.5">
              Tinjau dan setujui data sebelum dipublikasikan ke halaman publik.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/admin/review">Review Sekarang</Link>
          </Button>
        </div>
      )}

      {/* Log crawling per sumber */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Status Crawling Terakhir per Sumber
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestBySumber.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada riwayat crawling</p>
          ) : (
            <div className="space-y-2">
              {latestBySumber.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        log.status === "SUCCESS" ? "success" : log.status === "FAILED" ? "destructive" : "warning"
                      }
                      className="text-xs w-16 justify-center"
                    >
                      {log.status}
                    </Badge>
                    <span className="text-sm font-medium">{log.sumber}</span>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{log.jumlahDitemukan} ditemukan · {log.jumlahBaru} baru · {log.jumlahDiperbarui} diperbarui</p>
                    <p>{log.createdAt.toLocaleString("id-ID")}</p>
                    {log.errorMessage && (
                      <p className="text-red-500 truncate max-w-xs">{log.errorMessage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log aktivitas terbaru */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            Log Aktivitas Crawling (10 terakhir)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada log crawling</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left pb-2 pr-4">Sumber</th>
                    <th className="text-left pb-2 pr-4">Status</th>
                    <th className="text-right pb-2 pr-4">Ditemukan</th>
                    <th className="text-right pb-2 pr-4">Baru</th>
                    <th className="text-right pb-2 pr-4">Durasi</th>
                    <th className="text-right pb-2">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 text-gray-700">
                      <td className="py-1.5 pr-4 font-medium">{log.sumber}</td>
                      <td className="py-1.5 pr-4">
                        <Badge
                          variant={log.status === "SUCCESS" ? "success" : log.status === "FAILED" ? "destructive" : "warning"}
                          className="text-xs"
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-1.5 pr-4 text-right">{log.jumlahDitemukan}</td>
                      <td className="py-1.5 pr-4 text-right">{log.jumlahBaru}</td>
                      <td className="py-1.5 pr-4 text-right">{(log.durasiMs / 1000).toFixed(1)}s</td>
                      <td className="py-1.5 text-right text-gray-400">
                        {log.createdAt.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title, value, icon, color, href,
}: {
  title: string; value: number; icon: React.ReactNode; color: string; href: string;
}) {
  const bg = { yellow: "bg-yellow-50", green: "bg-green-50", red: "bg-red-50" }[color];
  return (
    <Link href={href}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${bg}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">{icon}<BookOpen className="h-3 w-3 text-gray-300" /></div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{title}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
