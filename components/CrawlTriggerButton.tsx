"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

export function CrawlTriggerButton({ source }: { source?: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleCrawl() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source ? { sources: [source] } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        const found = data.results?.reduce((s: number, r: { found: number }) => s + r.found, 0) ?? 0;
        setResult(`Selesai — ${found} item ditemukan`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-sm text-gray-600">{result}</span>}
      <Button onClick={handleCrawl} disabled={loading} variant="outline" size="sm">
        {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
        {source ? `Crawl ${source}` : "Crawl Semua"}
      </Button>
    </div>
  );
}
