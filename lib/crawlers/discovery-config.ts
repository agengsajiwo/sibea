/**
 * KONFIGURASI DISCOVERY — penemuan beasiswa S3 baru via RSS feed agregator.
 *
 * STRATEGI:
 * - Luar negeri: utamakan feed KATEGORI-PhD (assumeDoctoral) → semua item doktor.
 * - Dalam negeri: feed umum agregator Indonesia, disaring kata kunci S3/doktor.
 *
 * Mengapa RSS: XML terstruktur & stabil, server-rendered, tidak butuh JS.
 *
 * ⚠️  Sebagian agregator memblokir IP cloud (403) atau membatasi rate (429).
 *     Discovery best-effort: feed yang lolos dipakai, yang gagal dilewati.
 *     Gunakan /api/admin/diagnose-feeds untuk cek feed mana yang aktif dari Vercel.
 */

export interface DiscoveryFeed {
  name: string;
  feedUrl: string;
  defaultLokasi: "DALAM_NEGERI" | "LUAR_NEGERI";
  /** true = feed sudah khusus PhD → ambil semua item tanpa saring kata kunci doktor */
  assumeDoctoral?: boolean;
  catatan?: string;
}

export const DISCOVERY_FEEDS: DiscoveryFeed[] = [
  // ── LUAR NEGERI — feed kategori PhD (terverifikasi aktif) ──────────
  {
    name: "ScholarshipRegion (PhD)",
    feedUrl: "https://scholarshipregion.com/category/phd-scholarships/feed/",
    defaultLokasi: "LUAR_NEGERI",
    assumeDoctoral: true,
    catatan: "Terverifikasi: 10 item PhD. Sumber discovery utama.",
  },
  {
    name: "OpportunitiesForYouth (PhD)",
    feedUrl: "https://www.opportunitiesforyouth.org/category/scholarships/feed/",
    defaultLokasi: "LUAR_NEGERI",
    catatan: "Terverifikasi aktif. Feed umum beasiswa, disaring S3.",
  },
  {
    name: "Scholars4Dev (PhD)",
    feedUrl: "https://www.scholars4dev.com/category/phd-scholarships/feed/",
    defaultLokasi: "LUAR_NEGERI",
    assumeDoctoral: true,
    catatan: "Terverifikasi aktif (item terbatas).",
  },

  // ── LUAR NEGERI — kandidat tambahan (cek via diagnose-feeds) ───────
  {
    name: "OpportunitiesForAfricans (PhD)",
    feedUrl: "https://www.opportunitiesforafricans.com/category/phd-scholarships/feed/",
    defaultLokasi: "LUAR_NEGERI",
    assumeDoctoral: true,
    catatan: "Banyak memuat PhD global (tidak hanya Afrika).",
  },
  {
    name: "ScholarshipDb (PhD)",
    feedUrl: "https://scholarshipdb.net/scholarships/Program-PhD/feed",
    defaultLokasi: "LUAR_NEGERI",
    assumeDoctoral: true,
    catatan: "Database global posisi PhD berbayar/beasiswa.",
  },
  {
    name: "ARMACAD",
    feedUrl: "https://armacad.info/feed",
    defaultLokasi: "LUAR_NEGERI",
    catatan: "Peluang akademik global; disaring kata kunci S3.",
  },

  // ── DALAM NEGERI — agregator beasiswa Indonesia ───────────────────
  {
    name: "IndBeasiswa",
    feedUrl: "https://indbeasiswa.com/feed/",
    defaultLokasi: "LUAR_NEGERI", // banyak memuat luar negeri; auto-deteksi "Indonesia"
    catatan: "Agregator beasiswa Indonesia (dalam & luar negeri), disaring S3.",
  },
  {
    name: "Beasiswa Pascasarjana",
    feedUrl: "https://www.beasiswapascasarjana.com/feeds/posts/default?alt=rss",
    defaultLokasi: "LUAR_NEGERI",
    catatan: "Khusus pascasarjana (S2/S3) — disaring S3/doktor.",
  },
];

/** Kata kunci program DOKTOR (untuk feed non-assumeDoctoral) */
export const DOCTORAL_KEYWORDS = [
  "phd",
  "ph.d",
  "ph. d",
  "doctoral",
  "doctorate",
  "d.phil",
  "dphil",
  "doktor",
];

/** Kata kunci penanda beasiswa (sinyal pendukung pada feed umum) */
export const SCHOLARSHIP_KEYWORDS = [
  "scholarship",
  "fellowship",
  "beasiswa",
  "funded",
  "grant",
  "studentship",
  "bursary",
  "phd position",
  "phd vacancy",
];

/**
 * Deteksi apakah teks relevan dengan program doktor (S3).
 * Mencakup kata kunci internasional + pola "S3"/"S-3" gaya Indonesia.
 */
export function matchesDoctoral(text: string): boolean {
  const lower = text.toLowerCase();
  if (DOCTORAL_KEYWORDS.some((k) => lower.includes(k))) return true;
  // Pola S3 ala Indonesia: "beasiswa s3", "program s-3", "jenjang s.3"
  if (/\bs[-.\s]?3\b/.test(lower)) return true;
  return false;
}

/** Deteksi apakah teks terkait beasiswa/pendanaan */
export function matchesScholarship(text: string): boolean {
  const lower = text.toLowerCase();
  return SCHOLARSHIP_KEYWORDS.some((k) => lower.includes(k));
}
