import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { ScholarshipCreateSchema } from "@/lib/schemas/scholarship";
import { computeContentHash } from "@/lib/utils/hash";
import { z } from "zod";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const s = await prisma.scholarship.findUnique({ where: { id: params.id } });
  if (!s) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(s);
}

// PATCH: ubah status / aktif cepat (mis. Publikasikan dari Kelola Beasiswa)
const PatchSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { status, isActive } = parsed.data;
  const data: Record<string, unknown> = {};
  if (status) {
    data.status = status;
    data.reviewedBy = session!.user!.email!;
    data.reviewedAt = new Date();
    // Saat dipublikasikan, pastikan aktif agar tampil di halaman publik
    if (status === "PUBLISHED") data.isActive = true;
  }
  if (isActive !== undefined) data.isActive = isActive;

  const updated = await prisma.scholarship.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
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

  const updated = await prisma.scholarship.update({
    where: { id: params.id },
    data: {
      namaBeasiswa: d.namaBeasiswa, penyelenggara: d.penyelenggara, lokasi: d.lokasi,
      pilihanLokasi: JSON.stringify(d.pilihanLokasi), skemaPembiayaan: d.skemaPembiayaan,
      jenisPembiayaan: d.jenisPembiayaan, komponenPembiayaan: JSON.stringify(d.komponenPembiayaan),
      keterangan: d.keterangan, linkPendaftaran: d.linkPendaftaran,
      deadline: d.deadline ? new Date(d.deadline) : null,
      status: d.status ?? "DRAFT", contentHash,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  await prisma.scholarship.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
