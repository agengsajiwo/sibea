import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const isProd = process.env.NODE_ENV === "production";

  // Di production Vercel, TURSO_DATABASE_URL wajib diset
  if (isProd && !url) {
    throw new Error(
      "[SIBEA] TURSO_DATABASE_URL tidak ditemukan. " +
      "Set environment variable ini di Vercel Dashboard → Settings → Environment Variables. " +
      "Dapatkan URL dari: turso db show <nama-db> --url"
    );
  }

  const resolvedUrl = url ?? "file:./dev.db";

  const libsql = createClient({
    url: resolvedUrl,
    // authToken hanya dibutuhkan untuk remote Turso, bukan file:// lokal
    authToken: resolvedUrl.startsWith("libsql://") ? authToken : undefined,
  });

  const adapter = new PrismaLibSQL(libsql);

  return new PrismaClient({
    adapter,
    log: isProd ? ["error"] : ["error", "warn"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
