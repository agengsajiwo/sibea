/**
 * Scheduler crawling otomatis — jalankan sebagai proses Node terpisah:
 *   npm run scheduler
 *
 * JANGAN dijalankan di dalam request handler serverless Next.js.
 * node-cron berjalan di proses yang sama terus-menerus (long-running process).
 */
import cron from "node-cron";
import { runCrawlJob } from "@/lib/crawlers/index";

// Jalankan crawling setiap 24 jam (jam 02:00 dini hari)
const CRON_SCHEDULE = process.env.CRON_SCHEDULE ?? "0 2 * * *";

console.log(`[Scheduler] Dimulai. Jadwal: "${CRON_SCHEDULE}"`);
console.log(`[Scheduler] Crawling berikutnya: ${getNextRunTime(CRON_SCHEDULE)}`);

cron.schedule(CRON_SCHEDULE, async () => {
  console.log(`[Scheduler] Memulai crawling otomatis: ${new Date().toISOString()}`);
  try {
    const results = await runCrawlJob();
    const total = results.reduce((sum, r) => sum + r.scholarships.length, 0);
    console.log(`[Scheduler] Selesai. Total item ditemukan: ${total}`);
  } catch (err) {
    console.error("[Scheduler] Error:", err);
  }
}, { timezone: "Asia/Jakarta" });

function getNextRunTime(schedule: string): string {
  // Estimasi sederhana tanpa library
  return `sesuai jadwal cron: ${schedule}`;
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("[Scheduler] Dihentikan.");
  process.exit(0);
});
