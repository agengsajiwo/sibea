import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { DISCOVERY_FEEDS } from "@/lib/crawlers/discovery-config";
import { CRAWLER_CONFIG } from "@/lib/crawlers/config";
import { RssDiscoveryCrawler } from "@/lib/crawlers/rss-discovery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Diagnostik: tes setiap RSS feed discovery LANGSUNG dari server Vercel.
 * Menampilkan status HTTP, panjang konten, jumlah item, dan error per feed.
 * Berguna untuk tahu apakah feed terblokir/tidak terjangkau dari Vercel.
 *
 * Akses: buka /api/admin/diagnose-feeds saat sudah login admin.
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const hasil = [];

  for (const feed of DISCOVERY_FEEDS) {
    const start = Date.now();
    const entry: Record<string, unknown> = { nama: feed.name, feedUrl: feed.feedUrl };
    try {
      const sep = feed.feedUrl.includes("?") ? "&" : "?";
      const res = await fetch(`${feed.feedUrl}${sep}_t=${Date.now()}`, {
        headers: {
          "User-Agent": CRAWLER_CONFIG.global.userAgent,
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      entry.httpStatus = res.status;
      entry.ok = res.ok;
      const xml = await res.text();
      entry.panjangKonten = xml.length;

      // Coba parse untuk lihat berapa item S3 yang lolos saringan
      const crawler = new RssDiscoveryCrawler(feed);
      const items = crawler.parse(xml);
      entry.itemDoktorLolos = items.length;
      entry.contohJudul = items.slice(0, 3).map((i) => i.namaBeasiswa);
    } catch (err) {
      entry.error = err instanceof Error ? err.message : String(err);
    }
    entry.durasiMs = Date.now() - start;
    hasil.push(entry);
  }

  return NextResponse.json(
    {
      keterangan:
        "Diagnostik RSS feed dari server Vercel. httpStatus 200 + itemDoktorLolos > 0 = feed berfungsi. " +
        "httpStatus 403/blocked atau error = feed terblokir dari Vercel.",
      userAgent: CRAWLER_CONFIG.global.userAgent,
      feeds: hasil,
    },
    { status: 200 }
  );
}
