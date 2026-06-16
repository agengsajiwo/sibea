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

  // ── DALAM NEGERI — agregator beasiswa Indonesia (terverifikasi) ────
  {
    name: "Beasiswa Pascasarjana",
    feedUrl: "https://www.beasiswapascasarjana.com/feeds/posts/default?alt=rss",
    defaultLokasi: "LUAR_NEGERI",
    catatan: "Terverifikasi: 9 item S3. Sumber dalam-negeri utama.",
  },
  {
    name: "IndBeasiswa",
    feedUrl: "https://indbeasiswa.com/feed/",
    defaultLokasi: "LUAR_NEGERI", // auto-deteksi "Indonesia" → DALAM_NEGERI
    catatan: "Terverifikasi aktif. Agregator beasiswa Indonesia, disaring S3.",
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
 * Deteksi doktor PADA JUDUL — sensitif penuh, termasuk pola "S3" Indonesia.
 * Judul andal: "Beasiswa S3 Unpad", "MEXT untuk S2 dan S3", "PhD Studentship".
 */
export function matchesDoctoral(text: string): boolean {
  const lower = text.toLowerCase();
  if (DOCTORAL_KEYWORDS.some((k) => lower.includes(k))) return true;
  // Pola S3 ala Indonesia: "beasiswa s3", "program s-3", "jenjang s.3"
  if (/\bs[-.\s]?3\b/.test(lower)) return true;
  return false;
}

/**
 * Deteksi doktor "kuat" untuk BODY/deskripsi — hanya kata kunci eksplisit
 * PhD/doctoral/doktor, TANPA pola bare "S3". Mencegah false positive dari
 * tautan terkait/crosslink di body (mis. "Baca juga: Beasiswa S3 ...") yang
 * sering muncul di feed Blogger/WordPress Indonesia.
 */
export function matchesDoctoralStrong(text: string): boolean {
  const lower = text.toLowerCase();
  return DOCTORAL_KEYWORDS.some((k) => lower.includes(k));
}

/** Deteksi apakah teks terkait beasiswa/pendanaan */
export function matchesScholarship(text: string): boolean {
  const lower = text.toLowerCase();
  return SCHOLARSHIP_KEYWORDS.some((k) => lower.includes(k));
}
