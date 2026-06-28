/**
 * Helper kata kunci untuk menyaring relevansi program DOKTOR (S3) & beasiswa.
 * Dipakai oleh WebSearchDiscoveryCrawler untuk memfilter hasil pencarian web.
 */

/** Kata kunci program DOKTOR (internasional). */
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

/** Kata kunci penanda beasiswa/pendanaan. */
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
 * Deteksi relevansi DOKTOR — kata kunci internasional + pola "S3" Indonesia.
 */
export function matchesDoctoral(text: string): boolean {
  const lower = text.toLowerCase();
  if (DOCTORAL_KEYWORDS.some((k) => lower.includes(k))) return true;
  if (/\bs[-.\s]?3\b/.test(lower)) return true;
  return false;
}

/** Deteksi doktor "kuat" (tanpa pola bare "S3") untuk teks body/snippet. */
export function matchesDoctoralStrong(text: string): boolean {
  const lower = text.toLowerCase();
  return DOCTORAL_KEYWORDS.some((k) => lower.includes(k));
}

/** Deteksi relevansi beasiswa/pendanaan. */
export function matchesScholarship(text: string): boolean {
  const lower = text.toLowerCase();
  return SCHOLARSHIP_KEYWORDS.some((k) => lower.includes(k));
}
