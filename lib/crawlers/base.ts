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
 * Menggunakan fetch + Cheerio (berjalan di Vercel serverless).
 * Playwright dihapus — tidak kompatibel dengan serverless environment.
 *
 * Untuk situs yang membutuhkan JavaScript rendering, crawler akan
 * mengembalikan data statis via getStaticEntries() sebagai fallback.
 */
export class BaseCrawler {
  protected name: string;
  protected sourceUrl: string;

  constructor(name = "", sourceUrl = "") {
    this.name = name;
    this.sourceUrl = sourceUrl;
  }

  // FETCH: Ambil konten halaman menggunakan fetch biasa (serverless-compatible)
  protected async fetchPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      CRAWLER_CONFIG.global.timeoutMs
    );
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": CRAWLER_CONFIG.global.userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.text();
    } finally {
      clearTimeout(timeout);
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
        console.warn(
          `[${this.name}] Attempt ${attempt} gagal untuk ${url}: ${lastError.message}`
        );
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
      if (!resp.ok) return true;
      const text = await resp.text();
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
      return true;
    }
  }

  // Kompatibilitas mundur — tidak lagi dibutuhkan tapi tetap ada agar tidak error
  async closeBrowser() {}
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
      console.log(
        `[Crawler] Selesai: ${crawler.name} — ${scholarships.length} item ditemukan`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Crawler] Error pada ${crawler.name}: ${msg}`);
      results.push({ crawlerName: crawler.name, scholarships: [], error: msg });
    }
  }
  return results;
}
