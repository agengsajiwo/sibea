/**
 * Helper bersama untuk semua crawler.
 * Pola standar: fetch → parse → validasi Zod → fallback ke static jika gagal.
 */
import { RawScholarship, RawScholarshipSchema } from "@/lib/schemas/scholarship";

export function validateItems(raw: Partial<RawScholarship>[], crawlerName: string): RawScholarship[] {
  const valid: RawScholarship[] = [];
  for (const item of raw) {
    const result = RawScholarshipSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      console.warn(`[${crawlerName}] Item tidak valid:`, result.error.flatten().fieldErrors);
    }
  }
  return valid;
}

/**
 * Jalankan crawl dengan fallback otomatis ke staticEntries jika fetch/parse gagal.
 * Semua crawler menggunakan pola ini agar konsisten.
 */
export async function crawlWithFallback(opts: {
  name: string;
  fetchAndParse: () => Promise<Partial<RawScholarship>[]>;
  staticEntries: Partial<RawScholarship>[];
}): Promise<RawScholarship[]> {
  let raw: Partial<RawScholarship>[] = [];
  try {
    raw = await opts.fetchAndParse();
    if (raw.length === 0) {
      console.info(`[${opts.name}] Fetch berhasil tapi 0 item — mungkin selektor kadaluarsa, pakai data statis`);
      raw = opts.staticEntries;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[${opts.name}] Fetch gagal (${msg}), pakai data statis`);
    raw = opts.staticEntries;
  }
  return validateItems(raw, opts.name);
}

export function parseDeadlineId(raw: string): Date | null {
  if (!raw) return null;
  const bulanMap: Record<string, string> = {
    januari: "January", februari: "February", maret: "March", april: "April",
    mei: "May", juni: "June", juli: "July", agustus: "August",
    september: "September", oktober: "October", november: "November", desember: "December",
  };
  let normalized = raw.toLowerCase();
  for (const [id, en] of Object.entries(bulanMap)) normalized = normalized.replace(id, en);
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

export function parseDeadlineEn(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d;
}
