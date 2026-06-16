/**
 * KONFIGURASI DISCOVERY — penemuan beasiswa baru via RSS feed agregator.
 *
 * STRATEGI: utamakan feed KATEGORI-PhD (WordPress /category/.../feed/) agar
 * setiap item dijamin program doktor — jauh lebih relevan daripada feed umum
 * yang mencampur S1/S2/S3.
 *
 * Mengapa RSS: XML terstruktur & stabil, server-rendered, tidak butuh JS.
 *
 * ⚠️  Beberapa agregator memblokir request dari IP cloud (403) atau membatasi
 *     rate (429). Discovery bersifat best-effort: feed yang lolos akan dipakai,
 *     yang terblokir dilewati tanpa menghentikan proses.
 */

export interface DiscoveryFeed {
  name: string;
  feedUrl: string;
  defaultLokasi: "DALAM_NEGERI" | "LUAR_NEGERI";
  /**
   * true = feed ini sudah khusus PhD/doktor (mis. feed kategori PhD),
   * sehingga tidak perlu lagi disaring kata kunci doktor — ambil semua item.
   */
  assumeDoctoral?: boolean;
  catatan?: string;
}

export const DISCOVERY_FEEDS: DiscoveryFeed[] = [
  {
    name: "Scholars4Dev (PhD)",
    feedUrl: "https://www.scholars4dev.com/category/phd-scholarships/feed/",
    defaultLokasi: "LUAR_NEGERI",
    assumeDoctoral: true,
    catatan: "Feed kategori PhD — setiap item adalah beasiswa doktor.",
  },
  {
    name: "ScholarshipRegion (PhD)",
    feedUrl: "https://scholarshipregion.com/category/phd-scholarships/feed/",
    defaultLokasi: "LUAR_NEGERI",
    assumeDoctoral: true,
    catatan: "Feed kategori PhD ScholarshipRegion.",
  },
  {
    name: "ScholarshipRegion (umum)",
    feedUrl: "https://scholarshipregion.com/feed/",
    defaultLokasi: "LUAR_NEGERI",
    assumeDoctoral: false,
    catatan: "Feed umum — disaring kata kunci doktor. Cadangan jika kategori kosong.",
  },
  {
    name: "OpportunitiesForYouth (PhD)",
    feedUrl: "https://www.opportunitiesforyouth.org/category/scholarships/feed/",
    defaultLokasi: "LUAR_NEGERI",
    assumeDoctoral: false,
    catatan: "Agregator alternatif; disaring kata kunci doktor.",
  },
];

/**
 * Kata kunci program DOKTOR. Item harus mengandung salah satunya
 * (kecuali feed dengan assumeDoctoral=true).
 */
export const DOCTORAL_KEYWORDS = [
  "phd",
  "ph.d",
  "ph. d",
  "doctoral",
  "doctorate",
  "d.phil",
  "dphil",
  "doktor",
  "program s3",
  "jenjang s3",
];

/**
 * Kata kunci penanda beasiswa. Dipakai sebagai sinyal pendukung —
 * tidak wajib agar item dengan judul seperti "Clarendon PhD" tetap lolos.
 */
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
