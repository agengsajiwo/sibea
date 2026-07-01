/**
 * Bersihkan data hasil crawling dari database — untuk fresh start model baru.
 *
 * Mode (arg pertama):
 *   report        (default) → hanya tampilkan jumlah, TIDAK menghapus apa pun
 *   queue         → hapus crawling non-published: PENDING_REVIEW + DRAFT
 *   queue-rejected→ hapus juga REJECTED (reset blocklist penolakan)
 *   all-crawled   → hapus SEMUA hasil crawling (termasuk yang sudah PUBLISHED)
 *
 * SELALU menjaga: entri input manual (isManualEntry=true) — termasuk seed.
 * Untuk mode selain 'report': juga mengosongkan CrawlLog & reset SourceMonitor.
 *
 * Contoh:
 *   npx tsx scripts/cleanup-crawl.ts report
 *   npx tsx scripts/cleanup-crawl.ts queue
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

type Mode = "report" | "queue" | "queue-rejected" | "all-crawled";

async function main() {
  const mode = (process.argv[2] ?? "report") as Mode;
  const crawled = { isManualEntry: false } as const;

  // Laporan kondisi saat ini
  const [
    totalManual, totalCrawled,
    cPending, cDraft, cPublished, cRejected,
    crawlLogs,
  ] = await Promise.all([
    prisma.scholarship.count({ where: { isManualEntry: true } }),
    prisma.scholarship.count({ where: crawled }),
    prisma.scholarship.count({ where: { ...crawled, status: "PENDING_REVIEW" } }),
    prisma.scholarship.count({ where: { ...crawled, status: "DRAFT" } }),
    prisma.scholarship.count({ where: { ...crawled, status: "PUBLISHED" } }),
    prisma.scholarship.count({ where: { ...crawled, status: "REJECTED" } }),
    prisma.crawlLog.count(),
  ]);

  console.log("═══════════════════════════════════════════");
  console.log("  KONDISI DATABASE SAAT INI");
  console.log("═══════════════════════════════════════════");
  console.log(`  Input manual (DIJAGA)      : ${totalManual}`);
  console.log(`  Hasil crawling (total)     : ${totalCrawled}`);
  console.log(`    - PENDING_REVIEW         : ${cPending}`);
  console.log(`    - DRAFT                  : ${cDraft}`);
  console.log(`    - PUBLISHED              : ${cPublished}`);
  console.log(`    - REJECTED               : ${cRejected}`);
  console.log(`  CrawlLog entri             : ${crawlLogs}`);
  console.log("═══════════════════════════════════════════\n");

  if (mode === "report") {
    console.log("Mode: report (tidak menghapus apa pun).");
    console.log("Jalankan ulang dgn mode: queue | queue-rejected | all-crawled");
    return;
  }

  // Tentukan status yang dihapus
  let statuses: string[];
  if (mode === "queue") statuses = ["PENDING_REVIEW", "DRAFT"];
  else if (mode === "queue-rejected") statuses = ["PENDING_REVIEW", "DRAFT", "REJECTED"];
  else if (mode === "all-crawled") statuses = ["PENDING_REVIEW", "DRAFT", "REJECTED", "PUBLISHED"];
  else { console.error(`Mode tidak dikenal: ${mode}`); process.exit(1); }

  const del = await prisma.scholarship.deleteMany({
    where: { isManualEntry: false, status: { in: statuses } },
  });
  const logDel = await prisma.crawlLog.deleteMany({});
  const monReset = await prisma.sourceMonitor.deleteMany({});

  console.log(`✅ Dihapus ${del.count} beasiswa hasil crawling (status: ${statuses.join(", ")})`);
  console.log(`✅ Dikosongkan ${logDel.count} CrawlLog`);
  console.log(`✅ Reset ${monReset.count} SourceMonitor (baseline dibuat ulang saat crawl berikutnya)`);
  console.log(`\n✅ Selesai. Input manual (${totalManual}) tetap utuh. Siap untuk crawl model baru.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
