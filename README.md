# Sistem Informasi Beasiswa Doktor (S3) — UNU Yogyakarta

Portal beasiswa program doktor untuk dosen Universitas Nahdlatul Ulama Yogyakarta. Data crawling tidak langsung dipublikasikan — admin harus mereview dan menyetujui terlebih dahulu.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui (komponen inline)
- **Prisma ORM** + SQLite (dev) / PostgreSQL (prod)
- **Playwright** — crawling situs dinamis (JavaScript-rendered)
- **Cheerio** — parsing HTML statis
- **node-cron** — penjadwalan crawling otomatis
- **Zod** — validasi & sanitasi data
- **NextAuth v4** — autentikasi admin (Credentials Provider)

## Instalasi & Setup

### 1. Clone & install

```bash
git clone <repo>
cd unu-beasiswa
npm install
```

### 2. Install browser Playwright

```bash
npx playwright install chromium
```

### 3. Konfigurasi environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="isi-dengan-string-acak-minimal-32-karakter"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_DEFAULT_PASSWORD="password-admin-anda"
```

> **Tips:** Generate secret: `openssl rand -base64 32` atau `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### 4. Migrasi & seed database

```bash
npm run db:migrate   # Buat tabel
npm run db:seed      # Isi data dummy (8 beasiswa PUBLISHED)
```

### 5. Jalankan development server

```bash
npm run dev
```

Buka http://localhost:3000

**Login admin:** http://localhost:3000/admin/login  
Email: `admin@unu.ac.id` | Password: sesuai `ADMIN_DEFAULT_PASSWORD` di `.env`

---

## Menjalankan Crawler

### Manual (sekali jalan)

```bash
npm run crawl                      # Semua sumber
npm run crawl -- --source="LPDP"   # Sumber spesifik
```

### Scheduler otomatis (24 jam sekali, jam 02:00 WIB)

```bash
npm run scheduler
```

> Jalankan scheduler sebagai proses terpisah dari server Next.js.  
> Untuk produksi, gunakan `pm2`, systemd, atau platform worker (Railway, Render, dll).

### Trigger manual dari dashboard

Masuk ke `/admin` → klik tombol **"Crawl Semua"**.

---

## Menambah Crawler Sumber Baru

1. Buat file `lib/crawlers/<nama>.ts`, implementasi interface `ScholarshipCrawler`:

```typescript
import { BaseCrawler, ScholarshipCrawler } from "./base";
import { RawScholarship } from "@/lib/schemas/scholarship";

export class BeasiswaBaruCrawler extends BaseCrawler implements ScholarshipCrawler {
  name = "Nama Sumber";
  sourceUrl = "https://contoh.com/beasiswa";

  // PARSE: terpisah dari fetch agar mudah diuji
  parse(html: string): Partial<RawScholarship>[] {
    // Gunakan cheerio untuk parsing HTML
    // Kembalikan array objek beasiswa
  }

  async crawl(): Promise<RawScholarship[]> {
    if (!(await this.isAllowedByRobots(this.sourceUrl))) return [];
    const html = await this.fetchWithRetry(this.sourceUrl);
    const raw = this.parse(html);
    // Validasi dengan Zod
    return valid;
  }
}
```

2. Tambahkan selektor ke `lib/crawlers/config.ts`

3. Daftarkan di `lib/crawlers/index.ts`:
```typescript
import { BeasiswaBaruCrawler } from "./beasiswa-baru";
export const ALL_CRAWLERS = [
  // ...existing...
  new BeasiswaBaruCrawler(),
];
```

---

## Alur Data (Semi-Otomatis)

```
Crawler          Admin Dashboard        Halaman Publik
   |                    |                     |
   |-- crawl() -------> |                     |
   |   PENDING_REVIEW   |                     |
   |                    |-- Review ---------->|
   |                    |   Approve           |
   |                    |   PUBLISHED ------->|
   |                    |   Reject            |
   |                    |   REJECTED          |
```

Data PUBLISHED **tidak pernah ditimpa** oleh crawler. Jika ada perubahan terdeteksi (contentHash berbeda), sistem membuat entri PENDING_REVIEW baru untuk ditinjau admin.

---

## Struktur Direktori

```
app/
  page.tsx                    # Halaman publik — daftar beasiswa
  beasiswa/[id]/page.tsx      # Detail beasiswa
  admin/
    page.tsx                  # Dashboard admin
    login/page.tsx            # Login
    review/page.tsx           # Antrian review
    scholarships/page.tsx     # CRUD manual
  api/
    scholarships/             # API publik (GET only, PUBLISHED)
    admin/scholarships/       # API admin (CRUD)
    admin/review/[id]/        # Approve/reject
    crawl/                    # Trigger crawling manual
lib/
  crawlers/
    base.ts                   # BaseCrawler + interface + runAllCrawlers
    config.ts                 # ⚠️ Selektor CSS — perlu disesuaikan berkala
    index.ts                  # Orchestrator + simpan ke DB
    kemdikbud.ts / lpdp.ts / daad.ts / ...
  schemas/scholarship.ts      # Zod schemas
  utils/hash.ts               # contentHash
  utils/sanitize.ts           # Sanitasi HTML/URL
  auth.ts                     # NextAuth config
  prisma.ts                   # Prisma client singleton
scripts/
  scheduler.ts                # node-cron (24 jam)
  crawl-once.ts               # Run crawl sekali
prisma/
  schema.prisma               # Model DB
  seed.ts                     # 8 beasiswa dummy PUBLISHED
```

---

## Produksi (PostgreSQL)

Ganti di `.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Lalu jalankan ulang: `npm run db:migrate`

---

## Catatan Penting Crawler

> ⚠️ Selektor CSS di `lib/crawlers/config.ts` harus disesuaikan dengan struktur HTML aktual masing-masing situs. Situs web pemerintah dan beasiswa sering berganti tampilan. Lakukan audit selektor minimal setiap 3 bulan atau setiap kali crawling menghasilkan 0 item.
