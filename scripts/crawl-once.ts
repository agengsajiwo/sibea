/**
 * Jalankan crawling satu kali (untuk debugging / cron eksternal):
 *   npm run crawl
 *   npm run crawl -- --source="LPDP"
 */
import { runCrawlJob } from "@/lib/crawlers/index";

const args = process.argv.slice(2);
const sourceArg = args.find((a) => a.startsWith("--source="))?.split("=")[1];
const sources = sourceArg ? [sourceArg] : undefined;

(async () => {
  console.log(`Crawling${sources ? ` sumber: ${sources.join(", ")}` : " semua sumber"}...`);
  const results = await runCrawlJob(sources);
  for (const r of results) {
    console.log(
      `  [${r.crawlerName}] ${r.scholarships.length} item${r.error ? ` — ERROR: ${r.error}` : ""}`
    );
  }
  process.exit(0);
})();
