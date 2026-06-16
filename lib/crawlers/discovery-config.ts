/**
 * KONFIGURASI DISCOVERY — penemuan beasiswa baru via RSS feed agregator.
 *
 * Berbeda dari crawler bersumber-tunggal, discovery crawler memantau situs
 * AGREGATOR yang terus-menerus memposting beasiswa baru dari seluruh dunia.
 * Setiap posting baru yang relevan dengan program DOKTOR (S3) otomatis masuk
 * antrian PENDING_REVIEW untuk dikurasi admin.
 *
 * Mengapa RSS, bukan scraping HTML?
 * - RSS/Atom = XML terstruktur & stabil (tidak berubah-ubah seperti layout HTML)
 * - Server-rendered, tidak butuh JavaScript → andal di serverless Vercel
 * - Posting baru muncul otomatis di feed → discovery berkelanjutan
 *
 * ⚠️  URL feed dapat berubah. Jika sebuah feed menghasilkan 0 item berkali-kali,
 *     buka situsnya dan cari URL feed terbaru (biasanya /feed/ untuk WordPress).
 */

export interface DiscoveryFeed {
  name: string;        // nama tampilan
  feedUrl: string;     // URL RSS/Atom
  defaultLokasi: "DALAM_NEGERI" | "LUAR_NEGERI";
  catatan?: string;
}

export const DISCOVERY_FEEDS: DiscoveryFeed[] = [
  {
    name: "Scholars4Dev",
    feedUrl: "https://www.scholars4dev.com/feed/",
    defaultLokasi: "LUAR_NEGERI",
    catatan: "Agregator beasiswa untuk negara berkembang — fokus internasional.",
  },
  {
    name: "OpportunityDesk",
    feedUrl: "https://opportunitydesk.org/feed/",
    defaultLokasi: "LUAR_NEGERI",
    catatan: "Beasiswa, fellowship, dan peluang akademik global.",
  },
  {
    name: "ScholarshipPositions",
    feedUrl: "https://scholarship-positions.com/feed/",
    defaultLokasi: "LUAR_NEGERI",
    catatan: "Database beasiswa internasional, banyak program PhD.",
  },
  {
    name: "Scholarship Region",
    feedUrl: "https://scholarshipregion.com/feed/",
    defaultLokasi: "LUAR_NEGERI",
    catatan: "Agregator beasiswa global terbaru.",
  },
];

/**
 * Kata kunci untuk menyaring item feed yang relevan dengan program DOKTOR.
 * Item harus mengandung salah satu kata ini di judul/deskripsi.
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
 * Kata kunci yang menandakan beasiswa relevan (bukan sekadar berita).
 * Setidaknya satu harus cocok agar item dianggap beasiswa.
 */
export const SCHOLARSHIP_KEYWORDS = [
  "scholarship",
  "fellowship",
  "beasiswa",
  "funded",
  "grant",
  "studentship",
  "bursary",
];
