import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const scholarship = await prisma.scholarship.findUnique({
    where: { id: params.id, status: "PUBLISHED", isActive: true },
  });
  if (!scholarship) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json({
    ...scholarship,
    pilihanLokasi: safeParseArray(scholarship.pilihanLokasi),
    komponenPembiayaan: safeParseArray(scholarship.komponenPembiayaan),
  });
}

function safeParseArray(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return [raw]; }
}
