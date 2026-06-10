"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radar, ExternalLink, Check, Loader2, AlertTriangle } from "lucide-react";

export interface SourceMonitorRow {
  sumber: string;
  sourceUrl: string;
  lastChecked: Date;
  lastChanged: Date | null;
  hasUnreviewedChange: boolean;
  lastError: string | null;
}

export function SourceChangePanel({ sources }: { sources: SourceMonitorRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function acknowledge(sumber: string) {
    setLoading(sumber);
    await fetch("/api/admin/source-monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sumber }),
    });
    setLoading(null);
    router.refresh();
  }

  const changed = sources.filter((s) => s.hasUnreviewedChange);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Radar className="h-4 w-4 text-blue-600" />
          Pemantau Perubahan Sumber
          {changed.length > 0 && (
            <Badge variant="warning" className="text-xs ml-auto">{changed.length} berubah</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Belum ada data pemantauan. Jalankan crawl untuk memulai.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">
              Sistem memantau perubahan halaman pada sumber resmi yang stabil. Jika halaman berubah,
              kemungkinan ada info/deadline baru — periksa langsung dan perbarui data jika perlu.
            </p>
            {sources.map((s) => (
              <div
                key={s.sumber}
                className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border ${
                  s.hasUnreviewedChange ? "border-yellow-300 bg-yellow-50" : "border-gray-100"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900">{s.sumber}</p>
                    {s.hasUnreviewedChange && (
                      <Badge variant="warning" className="text-xs">Berubah</Badge>
                    )}
                    {s.lastError && (
                      <span title={s.lastError}>
                        <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Dicek: {new Date(s.lastChecked).toLocaleString("id-ID", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                    {s.lastChanged && s.hasUnreviewedChange && (
                      <> · Berubah: {new Date(s.lastChanged).toLocaleString("id-ID", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                    <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">
                      Buka <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                  {s.hasUnreviewedChange && (
                    <Button
                      size="sm"
                      onClick={() => acknowledge(s.sumber)}
                      disabled={loading === s.sumber}
                      className="h-7 px-2 bg-green-600 hover:bg-green-700"
                    >
                      {loading === s.sumber ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <><Check className="h-3 w-3 mr-1" /> Sudah ditinjau</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
