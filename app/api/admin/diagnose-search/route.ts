import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { SEARCH_QUERIES, getSearchProvider, runSearch, isRelevantResult } from "@/lib/crawlers/web-search";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Diagnostik penemuan via pencarian web — tes penyedia & 1 query contoh
 * langsung dari server Vercel. Buka /api/admin/diagnose-search saat login admin.
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const provider = getSearchProvider();
  if (!provider) {
    return NextResponse.json({
      konfigurasi: "BELUM DISET",
      pesan:
        "Tidak ada penyedia pencarian aktif. Set SERPER_API_KEY (disarankan) " +
        "ATAU GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX di Vercel, lalu Redeploy.",
      adaSerper: !!process.env.SERPER_API_KEY,
      adaGoogle: !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX),
    });
  }

  const query = SEARCH_QUERIES[0];
  const out: Record<string, unknown> = { konfigurasi: "OK", penyedia: provider, queryUji: query };

  try {
    const results = await runSearch(query);
    out.totalHasilMentah = results.length;
    const lolos = results.filter(isRelevantResult);
    out.lolosSaringan = lolos.length;
    out.contohLolos = lolos.slice(0, 5).map((r) => ({
      judul: r.title,
      domain: r.domain,
      link: r.link,
    }));
    out.pesan =
      lolos.length > 0
        ? "Berhasil! Penemuan sumber baru aktif. Jalankan 'Crawl Semua' lalu cek Antrian Review."
        : "Penyedia OK tapi 0 hasil lolos saringan untuk query ini — coba jalankan Crawl Semua (query lain mungkin memberi hasil).";
  } catch (err) {
    out.error = err instanceof Error ? err.message : String(err);
    out.pesan = "Penyedia terkonfigurasi tapi permintaan gagal — cek pesan error di atas.";
  }

  return NextResponse.json(out);
}
