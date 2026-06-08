import { Browser, chromium, Page } from "playwright";
import { CRAWLER_CONFIG } from "./config";
import { RawScholarship } from "@/lib/schemas/scholarship";

export interface ScholarshipCrawler {
  name: string;
  sourceUrl: string;
  crawl(): Promise<RawScholarship[]>;
}

export interface CrawlResult {
  crawlerName: string;
  scholarships: RawScholarship[];
  error?: string;
}

/**
 * Base utility untuk semua crawler.
 * Memisahkan FETCH (ambil halaman) dari PARSE (ekstrak data)
 * agar setiap bagian bisa diuji dan diperbaiki secara independen.
 */
export class BaseCrawler {
  protected name: string;
  protected sourceUrl: string;
  private browser: Browser | null = null;

  constructor(name: string, sourceUrl: string) {
    this.name = name;
    this.sourceUrl = sourceUrl;
  }

  // FETCH: Ambil konten halaman — dapat digunakan ulang oleh semua crawler
  protected async fetchPage(url: string): Promise<string> {
    let page: Page | null = null;
    try {
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });
      }
      page = await this.browser.newPage();
      await page.setExtraHTTPHeaders({ "User-Agent": CRAWLER_CONFIG.global.userAgent });
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: CRAWLER_CONFIG.global.timeoutMs,
      });
      // Scroll untuk memuat lazy-loaded content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      return await page.content();
    } finally {
      await page?.close();
    }
  }

  // FETCH dengan retry dan exponential backoff
  protected async fetchWithRetry(url: string): Promise<string> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= CRAWLER_CONFIG.global.retryAttempts; attempt++) {
      try {
        return await this.fetchPage(url);
      } catch (err) {
        lastError = err as Error;
        console.warn(`[${this.name}] Attempt ${attempt} gagal untuk ${url}: ${lastError.message}`);
        if (attempt < CRAWLER_CONFIG.global.retryAttempts) {
          await new Promise((r) =>
            setTimeout(r, CRAWLER_CONFIG.global.retryDelayMs * attempt)
          );
        }
      }
    }
    throw lastError ?? new Error("Fetch gagal setelah semua retry");
  }

  // Cek robots.txt — hormati aturan situs
  protected async isAllowedByRobots(url: string): Promise<boolean> {
    try {
      const parsed = new URL(url);
      const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
      const resp = await fetch(robotsUrl, {
        headers: { "User-Agent": CRAWLER_CONFIG.global.userAgent },
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) return true; // Tidak ada robots.txt = boleh crawl
      const text = await resp.text();
      // Parsing sederhana: cek apakah bot kita atau * dilarang mengakses path
      const lines = text.split("\n").map((l) => l.trim());
      let relevant = false;
      for (const line of lines) {
        if (line.toLowerCase().startsWith("user-agent:")) {
          const agent = line.split(":")[1].trim();
          relevant = agent === "*" || CRAWLER_CONFIG.global.userAgent.includes(agent);
        }
        if (relevant && line.toLowerCase().startsWith("disallow:")) {
          const disallowed = line.split(":")[1].trim();
          if (disallowed && parsed.pathname.startsWith(disallowed)) {
            console.warn(`[${this.name}] robots.txt melarang akses ke ${url}`);
            return false;
          }
        }
      }
      return true;
    } catch {
      return true; // Asumsikan boleh jika cek gagal
    }
  }

  async closeBrowser() {
    await this.browser?.close();
    this.browser = null;
  }
}

// Jalankan semua crawler dengan error isolation per-sumber
export async function runAllCrawlers(
  crawlers: ScholarshipCrawler[]
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  for (const crawler of crawlers) {
    try {
      console.log(`[Crawler] Memulai: ${crawler.name}`);
      const scholarships = await crawler.crawl();
      results.push({ crawlerName: crawler.name, scholarships });
      console.log(`[Crawler] Selesai: ${crawler.name} — ${scholarships.length} item ditemukan`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Crawler] Error pada ${crawler.name}: ${msg}`);
      results.push({ crawlerName: crawler.name, scholarships: [], error: msg });
    }
  }
  return results;
}
