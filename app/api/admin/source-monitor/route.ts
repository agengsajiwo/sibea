import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { acknowledgeSourceChange } from "@/lib/crawlers/monitor";
import { z } from "zod";

const AckSchema = z.object({ sumber: z.string().min(1) });

// POST: tandai perubahan sumber sudah ditinjau admin
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const parsed = AckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter 'sumber' wajib diisi" }, { status: 400 });
  }

  await acknowledgeSourceChange(parsed.data.sumber);
  return NextResponse.json({ ok: true });
}
