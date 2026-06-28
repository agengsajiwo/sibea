import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { SEARCH_QUERIES, EXCLUDED_DOMAINS } from "@/lib/crawlers/web-search";
import { matchesDoctoral, matchesScholarship } from "@/lib/crawlers/discovery-config";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Diagnostik penemuan via pencarian web — tes konfigurasi & 1 query contoh
 * langsung dari server Vercel. Buka /api/admin/diagnose-search saat login admin.
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    return NextResponse.json({
      konfigurasi: "BELUM DISET",
      pesan:
        "GOOGLE_SEARCH_API_KEY dan/atau GOOGLE_SEARCH_CX belum diset di Vercel. " +
        "Penemuan sumber baru via web tidak aktif. Lihat README untuk cara setup.",
      adaApiKey: !!apiKey,
      adaCx: !!cx,
    });
  }

  // Tes 1 query contoh
  const query = SEARCH_QUERIES[0];
  const out: Record<string, unknown> = { konfigurasi: "OK", queryUji: query };
  try {
    const url =
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&num=10&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    out.httpStatus = res.status;
    const data = await res.json();

    if (!res.ok) {
      out.error = data?.error?.message ?? "Permintaan gagal";
      return NextResponse.json(out);
    }

    const items: { title?: string; link?: string; snippet?: string; displayLink?: string }[] =
      Array.isArray(data.items) ? data.items : [];
    out.totalHasilMentah = items.length;

    const lolos = items.filter((it) => {
      const domain = (it.displayLink ?? "").toLowerCase().replace(/^www\./, "");
      if (EXCLUDED_DOMAINS.some((d) => domain.includes(d))) return false;
      const hay = `${it.title ?? ""} ${it.snippet ?? ""}`;
      return matchesDoctoral(hay) && matchesScholarship(hay);
    });

    out.lolosSaringan = lolos.length;
    out.contohLolos = lolos.slice(0, 5).map((it) => ({
      judul: it.title,
      domain: it.displayLink,
      link: it.link,
    }));
    out.kuotaInfo = "Google Custom Search gratis ~100 query/hari. Tiap crawl pakai " +
      `${SEARCH_QUERIES.length} query.`;
  } catch (err) {
    out.error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(out);
}
