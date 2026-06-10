import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/admin-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const updateData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (email) {
    const existing = await prisma.adminUser.findFirst({
      where: { email, NOT: { id: params.id } },
    });
    if (existing) {
      return NextResponse.json({ error: { email: ["Email sudah digunakan"] } }, { status: 400 });
    }
    updateData.email = email;
  }
  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
  }

  const user = await prisma.adminUser.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, email: true, updatedAt: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  // Tidak boleh hapus diri sendiri
  const currentUser = await prisma.adminUser.findUnique({
    where: { email: session!.user!.email! },
  });
  if (currentUser?.id === params.id) {
    return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri yang sedang aktif" }, { status: 400 });
  }

  // Pastikan minimal ada 1 admin tersisa
  const total = await prisma.adminUser.count();
  if (total <= 1) {
    return NextResponse.json({ error: "Harus ada minimal 1 admin aktif" }, { status: 400 });
  }

  await prisma.adminUser.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
