import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { z } from "zod";

const ActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  // Untuk approve dengan edit: field opsional override
  namaBeasiswa: z.string().optional(),
  penyelenggara: z.string().optional(),
  keterangan: z.string().optional(),
  linkPendaftaran: z.string().url().optional(),
  deadline: z.string().datetime().nullable().optional(),
  skemaPembiayaan: z.string().optional(),
  jenisPembiayaan: z.string().optional(),
  komponenPembiayaan: z.array(z.string()).optional(),
  pilihanLokasi: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const { action, ...overrides } = parsed.data;

  const existing = await prisma.scholarship.findUnique({ where: { id: params.id } });
  if (!existing || existing.status !== "PENDING_REVIEW") {
    return NextResponse.json({ error: "Beasiswa tidak ditemukan atau bukan PENDING_REVIEW" }, { status: 404 });
  }

  if (action === "reject") {
    await prisma.scholarship.update({
      where: { id: params.id },
      data: { status: "REJECTED", reviewedBy: session!.user!.email!, reviewedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  // approve — terapkan override jika ada, lalu publish
  const updateData: Record<string, unknown> = {
    status: "PUBLISHED",
    reviewedBy: session!.user!.email!,
    reviewedAt: new Date(),
  };
  if (overrides.namaBeasiswa) updateData.namaBeasiswa = overrides.namaBeasiswa;
  if (overrides.penyelenggara) updateData.penyelenggara = overrides.penyelenggara;
  if (overrides.keterangan) updateData.keterangan = overrides.keterangan;
  if (overrides.linkPendaftaran) updateData.linkPendaftaran = overrides.linkPendaftaran;
  if (overrides.deadline !== undefined) updateData.deadline = overrides.deadline ? new Date(overrides.deadline) : null;
  if (overrides.skemaPembiayaan) updateData.skemaPembiayaan = overrides.skemaPembiayaan;
  if (overrides.jenisPembiayaan) updateData.jenisPembiayaan = overrides.jenisPembiayaan;
  if (overrides.komponenPembiayaan) updateData.komponenPembiayaan = JSON.stringify(overrides.komponenPembiayaan);
  if (overrides.pilihanLokasi) updateData.pilihanLokasi = JSON.stringify(overrides.pilihanLokasi);

  await prisma.scholarship.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ ok: true, status: "PUBLISHED" });
}
