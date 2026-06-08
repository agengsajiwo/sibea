import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { runCrawlJob } from "@/lib/crawlers/index";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const sources: string[] | undefined = Array.isArray(body.sources) ? body.sources : undefined;

  // Jalankan crawl asinkron agar tidak timeout di serverless
  // Pada produksi, gunakan background job / queue; ini untuk trigger manual dari dashboard
  try {
    const results = await runCrawlJob(sources);
    return NextResponse.json({
      ok: true,
      results: results.map((r) => ({
        crawler: r.crawlerName,
        found: r.scholarships.length,
        error: r.error,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Crawl gagal" },
      { status: 500 }
    );
  }
}
