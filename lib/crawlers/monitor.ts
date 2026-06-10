/**
 * Crawl-as-Monitor: deteksi perubahan halaman sumber.
 *
 * Untuk sumber server-rendered yang stabil, kita tidak hanya menarik data
 * tapi juga memantau apakah halaman sumber BERUBAH sejak crawl terakhir.
 * Jika berubah → tandai agar admin meninjau kemungkinan info baru.
 *
 * Ini lebih andal daripada scraping penuh: meski selektor data belum sempurna,
 * kita tetap tahu "ada sesuatu yang berubah di situs sumber" dan bisa cek manual.
 */
import * as cheerio from "cheerio";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { CRAWLER_CONFIG } from "./config";

// Sumber yang dipantau perubahannya — hanya situs server-rendered yang stabil.
// Situs JS-heavy (SINGA, Erasmus, dll) tidak dipantau karena HTML-nya kosong
// tanpa rendering JavaScript.
// Catatan: gunakan URL yang stabil & pasti resolve (homepage resmi).
// ⚠️ Sesuaikan ke halaman daftar beasiswa spesifik bila sudah diketahui
//    struktur URL-nya, agar deteksi perubahan lebih relevan.
export const MONITORED_SOURCES: { sumber: string; url: string }[] = [
  { sumber: "Kemdikbud BPI", url: "https://beasiswa.kemdikbud.go.id" },
  { sumber: "LPDP", url: "https://lpdp.kemenkeu.go.id" },
  { sumber: "Kemenag 5000 Doktor", url: "https://beasiswa.kemenag.go.id" },
  { sumber: "BRIN", url: "https://brin.go.id" },
];

/** Ekstrak teks bermakna dari HTML untuk perbandingan (abaikan script/style/whitespace) */
function extractMeaningfulText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, link, meta").remove();
  // Ambil teks body, normalisasi whitespace
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text;
}

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CRAWLER_CONFIG.global.timeoutMs);
  try {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(`${url}${sep}_t=${Date.now()}`, {
      headers: {
        "User-Agent": CRAWLER_CONFIG.global.userAgent,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export interface MonitorResult {
  sumber: string;
  changed: boolean;
  error?: string;
}

/**
 * Pantau semua sumber terdaftar. Deteksi perubahan halaman, simpan ke DB.
 * Error per-sumber tidak menghentikan sumber lain.
 */
export async function monitorSources(): Promise<MonitorResult[]> {
  const results: MonitorResult[] = [];

  for (const { sumber, url } of MONITORED_SOURCES) {
    try {
      const html = await fetchPageText(url);
      const text = extractMeaningfulText(html);

      // Halaman terlalu pendek → kemungkinan butuh JS rendering / diblokir.
      // Jangan anggap sebagai perubahan valid.
      if (text.length < 200) {
        await prisma.sourceMonitor.upsert({
          where: { sumber },
          update: {
            lastChecked: new Date(),
            lastError: "Halaman terlalu pendek (mungkin butuh JavaScript / diblokir)",
          },
          create: {
            sumber,
            sourceUrl: url,
            pageHash: "",
            lastChecked: new Date(),
            lastError: "Halaman terlalu pendek (mungkin butuh JavaScript / diblokir)",
          },
        });
        results.push({ sumber, changed: false, error: "Halaman terlalu pendek" });
        continue;
      }

      const newHash = hashText(text);
      const existing = await prisma.sourceMonitor.findUnique({ where: { sumber } });

      // Pertama kali dipantau → simpan baseline, belum dianggap "berubah"
      if (!existing || existing.pageHash === "") {
        await prisma.sourceMonitor.upsert({
          where: { sumber },
          update: { pageHash: newHash, lastChecked: new Date(), lastError: null },
          create: {
            sumber,
            sourceUrl: url,
            pageHash: newHash,
            lastChecked: new Date(),
          },
        });
        results.push({ sumber, changed: false });
        continue;
      }

      const changed = existing.pageHash !== newHash;
      await prisma.sourceMonitor.update({
        where: { sumber },
        data: {
          pageHash: newHash,
          lastChecked: new Date(),
          lastError: null,
          ...(changed
            ? { lastChanged: new Date(), hasUnreviewedChange: true }
            : {}),
        },
      });
      results.push({ sumber, changed });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.sourceMonitor.upsert({
        where: { sumber },
        update: { lastChecked: new Date(), lastError: msg },
        create: { sumber, sourceUrl: url, pageHash: "", lastChecked: new Date(), lastError: msg },
      });
      results.push({ sumber, changed: false, error: msg });
    }
  }

  return results;
}

/** Tandai perubahan suatu sumber sudah ditinjau admin */
export async function acknowledgeSourceChange(sumber: string): Promise<void> {
  await prisma.sourceMonitor.update({
    where: { sumber },
    data: { hasUnreviewedChange: false },
  });
}
