/**
 * Scheduler crawling otomatis — dijalankan sebagai long-running process.
 *
 * Deploy ke Railway (bukan Vercel) karena membutuhkan:
 * - Playwright + Chromium (terlalu besar untuk serverless)
 * - Proses yang berjalan terus-menerus (bukan request handler)
 *
 * Environment variables yang dibutuhkan:
 * - TURSO_DATABASE_URL
 * - TURSO_AUTH_TOKEN
 * - CRON_SCHEDULE (opsional, default: "0 2 * * *" = jam 02:00 WIB)
 */
import "dotenv/config";
import cron from "node-cron";
import { runCrawlJob } from "@/lib/crawlers/index";

const CRON_SCHEDULE = process.env.CRON_SCHEDULE ?? "0 2 * * *";
const TIMEZONE = "Asia/Jakarta";

console.log("═══════════════════════════════════════════════");
console.log("  SIBEA Scheduler — UNU Yogyakarta");
console.log("═══════════════════════════════════════════════");
console.log(`  Jadwal  : ${CRON_SCHEDULE} (${TIMEZONE})`);
console.log(`  Turso   : ${process.env.TURSO_DATABASE_URL ?? "⚠️  TIDAK DISET"}`);
console.log(`  Dimulai : ${new Date().toLocaleString("id-ID", { timeZone: TIMEZONE })}`);
console.log("═══════════════════════════════════════════════\n");

if (!process.env.TURSO_DATABASE_URL) {
  console.error("❌ TURSO_DATABASE_URL belum diset! Set di Railway environment variables.");
  process.exit(1);
}

// Jalankan crawl sekali saat startup untuk verifikasi koneksi
(async () => {
  console.log("[Startup] Verifikasi koneksi database...");
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.scholarship.count();
    console.log(`[Startup] ✅ Database OK — ${count} beasiswa tersimpan`);
  } catch (err) {
    console.error("[Startup] ❌ Koneksi database gagal:", err);
    process.exit(1);
  }
})();

// Jadwalkan crawling otomatis
cron.schedule(
  CRON_SCHEDULE,
  async () => {
    const waktu = new Date().toLocaleString("id-ID", { timeZone: TIMEZONE });
    console.log(`\n[Crawl] Memulai: ${waktu}`);
    try {
      const results = await runCrawlJob();
      const total = results.reduce((s, r) => s + r.scholarships.length, 0);
      const errors = results.filter((r) => r.error).length;
      console.log(`[Crawl] Selesai — ${total} item ditemukan, ${errors} sumber error`);
      results.forEach((r) => {
        const status = r.error ? `❌ ${r.error}` : `✅ ${r.scholarships.length} item`;
        console.log(`        ${r.crawlerName}: ${status}`);
      });
    } catch (err) {
      console.error("[Crawl] Error fatal:", err);
    }
  },
  { timezone: TIMEZONE }
);

console.log(`[Scheduler] Berjalan. Crawling berikutnya sesuai jadwal: ${CRON_SCHEDULE}\n`);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Scheduler] SIGTERM diterima — shutdown gracefully...");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("[Scheduler] SIGINT diterima — dihentikan.");
  process.exit(0);
});
