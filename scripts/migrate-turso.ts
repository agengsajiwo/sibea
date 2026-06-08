/**
 * Apply Prisma migrations ke Turso database.
 * Jalankan sekali setelah membuat Turso database baru.
 *
 * Usage:
 *   npx tsx scripts/migrate-turso.ts
 *
 * Membutuhkan env vars:
 *   TURSO_DATABASE_URL=libsql://xxx.turso.io
 *   TURSO_AUTH_TOKEN=eyJhbGci...
 */
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !url.startsWith("libsql://")) {
    console.error("❌ TURSO_DATABASE_URL harus diset ke libsql://... (bukan file://)");
    console.error("   Export dulu: set TURSO_DATABASE_URL=libsql://xxx.turso.io");
    process.exit(1);
  }

  console.log(`🔌 Menghubungkan ke Turso: ${url}`);
  const db = createClient({ url, authToken });

  // Baca semua file migration SQL secara berurutan
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const folders = fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort(); // urutan abjad = urutan kronologis

  for (const folder of folders) {
    const sqlFile = path.join(migrationsDir, folder, "migration.sql");
    if (!fs.existsSync(sqlFile)) continue;

    console.log(`📄 Menjalankan migration: ${folder}`);
    const sql = fs.readFileSync(sqlFile, "utf-8");

    // Pisah per statement (semicolon) dan jalankan satu per satu
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await db.execute(stmt);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Skip "already exists" — migration idempotent
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          console.log(`   ⚠️  Skip (sudah ada): ${stmt.slice(0, 60)}...`);
        } else {
          console.error(`   ❌ Error: ${msg}`);
          console.error(`   Statement: ${stmt.slice(0, 120)}`);
          throw err;
        }
      }
    }
    console.log(`   ✅ ${folder} selesai`);
  }

  console.log("\n✅ Semua migration selesai dijalankan di Turso.");
  console.log("   Jalankan seed berikutnya: npx tsx prisma/seed.ts");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
