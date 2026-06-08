import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ScholarshipFilterSchema } from "@/lib/schemas/scholarship";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = ScholarshipFilterSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
  }
  const { lokasi, skema, search, page, limit } = parsed.data;

  const where = {
    status: "PUBLISHED" as const,
    isActive: true,
    ...(lokasi ? { lokasi } : {}),
    ...(skema ? { skemaPembiayaan: { contains: skema } } : {}),
    ...(search ? { OR: [{ namaBeasiswa: { contains: search } }, { penyelenggara: { contains: search } }] } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.scholarship.count({ where }),
    prisma.scholarship.findMany({
      where,
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, namaBeasiswa: true, penyelenggara: true, lokasi: true,
        pilihanLokasi: true, skemaPembiayaan: true, jenisPembiayaan: true,
        deadline: true, keterangan: true, linkPendaftaran: true, updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    data: data.map((s) => ({ ...s, pilihanLokasi: safeParseArray(s.pilihanLokasi) })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

function safeParseArray(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return [raw]; }
}
