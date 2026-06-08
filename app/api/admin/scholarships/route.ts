import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { ScholarshipCreateSchema } from "@/lib/schemas/scholarship";
import { computeContentHash } from "@/lib/utils/hash";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status");
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = 20;

  const where = status ? { status: status as "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" } : {};
  const [total, data] = await Promise.all([
    prisma.scholarship.count({ where }),
    prisma.scholarship.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return NextResponse.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = ScholarshipCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const contentHash = computeContentHash({
    namaBeasiswa: d.namaBeasiswa, penyelenggara: d.penyelenggara,
    linkPendaftaran: d.linkPendaftaran, deadline: d.deadline ? new Date(d.deadline) : null,
    skemaPembiayaan: d.skemaPembiayaan,
  });

  const scholarship = await prisma.scholarship.create({
    data: {
      namaBeasiswa: d.namaBeasiswa, penyelenggara: d.penyelenggara, lokasi: d.lokasi,
      pilihanLokasi: JSON.stringify(d.pilihanLokasi), skemaPembiayaan: d.skemaPembiayaan,
      jenisPembiayaan: d.jenisPembiayaan, komponenPembiayaan: JSON.stringify(d.komponenPembiayaan),
      keterangan: d.keterangan, linkPendaftaran: d.linkPendaftaran,
      sumberCrawling: "manual", deadline: d.deadline ? new Date(d.deadline) : null,
      status: d.status ?? "DRAFT", contentHash, isManualEntry: true,
      reviewedBy: session!.user!.email!,
    },
  });
  return NextResponse.json(scholarship, { status: 201 });
}
