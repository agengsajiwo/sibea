import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlarmClock, CalendarX, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import type { FreshnessReport, FreshnessScholarship } from "@/lib/utils/freshness";

function ItemRow({
  s,
  badge,
}: {
  s: FreshnessScholarship;
  badge: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-gray-900 truncate">{s.namaBeasiswa}</p>
        <p className="text-xs text-gray-500 truncate">{s.penyelenggara}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge}
        <Button variant="ghost" size="sm" asChild className="h-7 px-2">
          <Link href={`/admin/scholarships/${s.id}/edit`}>
            Verifikasi <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function FreshnessPanel({ report }: { report: FreshnessReport }) {
  const { deadlineLewat, deadlineMendekat, perluVerifikasi } = report;
  const adaMasalah =
    deadlineLewat.length > 0 || deadlineMendekat.length > 0 || perluVerifikasi.length > 0;

  if (!adaMasalah) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-800 text-sm">Semua data masih segar</p>
            <p className="text-xs text-green-600 mt-0.5">
              Tidak ada beasiswa yang kedaluwarsa, mendekati deadline, atau perlu verifikasi ulang.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Deadline sudah lewat */}
      <Card className={deadlineLewat.length > 0 ? "border-red-200" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarX className="h-4 w-4 text-red-500" />
            Deadline Terlewat
            {deadlineLewat.length > 0 && (
              <Badge variant="destructive" className="text-xs ml-auto">{deadlineLewat.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deadlineLewat.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Tidak ada</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">
                Masih PUBLISHED tapi deadline lewat. Perbarui deadline atau nonaktifkan.
              </p>
              <div className="max-h-64 overflow-y-auto">
                {deadlineLewat.slice(0, 10).map((s) => (
                  <ItemRow
                    key={s.id}
                    s={s}
                    badge={
                      <Badge variant="destructive" className="text-xs">
                        {Math.abs(s.hariKeDeadline ?? 0)} hari lalu
                      </Badge>
                    }
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Deadline mendekat */}
      <Card className={deadlineMendekat.length > 0 ? "border-yellow-200" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlarmClock className="h-4 w-4 text-yellow-500" />
            Deadline Mendekat
            {deadlineMendekat.length > 0 && (
              <Badge variant="warning" className="text-xs ml-auto">{deadlineMendekat.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deadlineMendekat.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Tidak ada</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">≤ 30 hari lagi. Pastikan info masih akurat.</p>
              <div className="max-h-64 overflow-y-auto">
                {deadlineMendekat.slice(0, 10).map((s) => (
                  <ItemRow
                    key={s.id}
                    s={s}
                    badge={
                      <Badge variant="warning" className="text-xs">
                        {s.hariKeDeadline} hari lagi
                      </Badge>
                    }
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Perlu verifikasi */}
      <Card className={perluVerifikasi.length > 0 ? "border-blue-200" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Perlu Verifikasi
            {perluVerifikasi.length > 0 && (
              <Badge variant="info" className="text-xs ml-auto">{perluVerifikasi.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {perluVerifikasi.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Tidak ada</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">{">"} 90 hari tidak dicek. Konfirmasi masih relevan.</p>
              <div className="max-h-64 overflow-y-auto">
                {perluVerifikasi.slice(0, 10).map((s) => (
                  <ItemRow
                    key={s.id}
                    s={s}
                    badge={
                      <Badge variant="info" className="text-xs">
                        {s.hariSejakVerifikasi} hari
                      </Badge>
                    }
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
