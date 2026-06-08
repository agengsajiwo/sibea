/**
 * KONFIGURASI SELEKTOR CRAWLER
 *
 * ⚠️  PERHATIAN: Selektor CSS/XPath di bawah ini HARUS disesuaikan dengan
 *     struktur HTML aktual masing-masing situs target. Situs web dapat
 *     berubah kapan saja tanpa pemberitahuan, sehingga selektor ini perlu
 *     dipelihara secara berkala (minimal setiap 3 bulan).
 *
 *     Cara memperbarui:
 *     1. Buka situs target di browser
 *     2. Klik kanan → Inspect Element pada elemen yang diinginkan
 *     3. Salin selektor CSS yang sesuai
 *     4. Perbarui nilai di bawah ini
 *     5. Jalankan `npm run crawl -- --source=<nama>` untuk menguji
 *
 *     Jika crawling menghasilkan 0 item, kemungkinan selektor sudah kadaluarsa.
 *     Setiap crawler memiliki data statis (getStaticEntries) sebagai fallback.
 */

export const CRAWLER_CONFIG = {
  global: {
    timeoutMs: parseInt(process.env.CRAWLER_TIMEOUT_MS ?? "30000"),
    retryAttempts: parseInt(process.env.CRAWLER_RETRY_ATTEMPTS ?? "3"),
    retryDelayMs: 2000,
    userAgent:
      "Mozilla/5.0 (compatible; UNUBeasiswaBot/1.0; +https://unu.ac.id/beasiswa-bot)",
  },

  // ─────────────────────────────────────────────────────────
  // SUMBER INDONESIA
  // ─────────────────────────────────────────────────────────

  kemdikbud: {
    // ⚠️ Sesuaikan dengan struktur beasiswa.kemdikbud.go.id
    baseUrl: "https://beasiswa.kemdikbud.go.id",
    listUrl: "https://beasiswa.kemdikbud.go.id/beranda",
    selectors: {
      itemList: ".card-beasiswa, .beasiswa-item, article.beasiswa, .program-item",
      nama: ".card-title, h3.nama-beasiswa, .judul-beasiswa, h2, h3",
      penyelenggara: ".card-penyelenggara, .penyelenggara",
      deadline: ".card-deadline, .tanggal-tutup, .deadline, time",
      link: "a.btn-daftar, a.btn-detail, .card-link, a[href*='detail']",
      keterangan: ".card-body p, .deskripsi, .keterangan",
      lokasi: ".lokasi, .tujuan",
    },
  },

  lpdp: {
    // ⚠️ Sesuaikan dengan struktur beasiswalpdp.kemenkeu.go.id
    baseUrl: "https://beasiswalpdp.kemenkeu.go.id",
    listUrl: "https://beasiswalpdp.kemenkeu.go.id/index.php/reg/index",
    selectors: {
      itemList: ".program-beasiswa, .list-beasiswa li, .beasiswa-card, .program-item",
      nama: ".nama-program, h4, h3, .program-name",
      penyelenggara: "LPDP",
      deadline: ".tanggal-berakhir, .deadline-date, time",
      link: "a.selengkapnya, a.detail-link, a[href*='detail']",
      keterangan: ".deskripsi-program, .keterangan, p",
    },
  },

  kemenag: {
    // ⚠️ Sesuaikan dengan struktur beasiswa.kemenag.go.id
    //    Program 5000 Doktor sangat relevan untuk dosen PTKI / UNU Yogyakarta
    baseUrl: "https://beasiswa.kemenag.go.id",
    listUrl: "https://beasiswa.kemenag.go.id",
    selectors: {
      itemList: ".beasiswa-item, .program-card, article, .card, .list-program li",
      nama: "h2, h3, h4, .judul, .title, .card-title",
      deadline: ".deadline, .tanggal-tutup, time, .tgl-penutupan",
      link: "a.detail, a.selengkapnya, a.btn, .card a",
      keterangan: "p, .deskripsi, .konten, .card-body",
      lokasi: ".lokasi, .tujuan, .jenis",
    },
  },

  brin: {
    // ⚠️ Sesuaikan dengan struktur beasiswa.brin.go.id atau brin.go.id
    baseUrl: "https://brin.go.id",
    listUrl: "https://brin.go.id/beasiswa",
    selectors: {
      itemList: ".beasiswa-item, .program-item, article, .card",
      nama: "h2, h3, .title, .judul",
      deadline: ".deadline, .tutup, time",
      link: "a[href*='beasiswa'], a.detail, a.more",
      keterangan: "p, .deskripsi, .excerpt",
      lokasi: ".lokasi, .tipe",
    },
  },

  // ─────────────────────────────────────────────────────────
  // SUMBER INTERNASIONAL — ASIA
  // ─────────────────────────────────────────────────────────

  mext: {
    // ⚠️ Sesuaikan dengan struktur id.emb-japan.go.jp (Kedutaan Jepang di Jakarta)
    //    atau mext.go.jp untuk informasi resmi MEXT
    baseUrl: "https://www.id.emb-japan.go.jp",
    listUrl: "https://www.id.emb-japan.go.jp/sch.html",
    selectors: {
      itemList: ".scholarship-item, table tr, .program, li",
      nama: "td:first-child, h3, h4, .title, strong",
      deadline: "td:nth-child(3), .deadline, time",
      link: "a[href*='scholarship'], a[href*='sch'], td a",
      keterangan: "td:nth-child(2), p, .description",
    },
  },

  cscChina: {
    // ⚠️ Sesuaikan dengan campuschina.org atau id.chineseembassy.org
    baseUrl: "https://www.campuschina.org",
    listUrl: "https://www.campuschina.org/scholarships/index.html",
    selectors: {
      itemList: ".scholarship-item, .program-card, article, li.item",
      nama: "h3, h4, .title, .name",
      deadline: ".deadline, time, .date",
      link: "a[href*='scholarship'], a.detail, a.more",
      keterangan: "p, .description, .summary",
    },
  },

  turkiyeBurslari: {
    // ⚠️ Sesuaikan dengan turkiyeburslari.gov.tr
    //    Situs menggunakan JavaScript berat, Playwright wajib
    baseUrl: "https://www.turkiyeburslari.gov.tr",
    listUrl: "https://www.turkiyeburslari.gov.tr/en",
    selectors: {
      itemList: ".scholarship-card, .program-item, article, .card",
      nama: "h2, h3, .title, .program-title",
      deadline: ".deadline, time, .date, .son-basvuru",
      link: "a.detail, a.apply, a[href*='scholarship']",
      keterangan: "p, .description, .summary",
    },
  },

  isdb: {
    // ⚠️ Sesuaikan dengan isdb.org/scholarship
    baseUrl: "https://www.isdb.org",
    listUrl: "https://www.isdb.org/what-we-do/develop-human-capital/scholarship",
    selectors: {
      itemList: ".scholarship-item, .program-card, article, .field--item",
      nama: "h3, h4, .title, .field--name-title",
      deadline: ".deadline, time, .field--name-field-date",
      link: "a[href*='scholarship'], a.read-more, h3 a",
      keterangan: "p, .field--name-body, .description",
    },
  },

  // ─────────────────────────────────────────────────────────
  // SUMBER INTERNASIONAL — EROPA & LAINNYA
  // ─────────────────────────────────────────────────────────

  daad: {
    // ⚠️ Sesuaikan dengan struktur daad.de
    baseUrl: "https://www.daad.de",
    listUrl: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    selectors: {
      itemList: ".c-scholarships__item, article.scholarship, .scholarship-item",
      nama: ".c-scholarships__headline, h3.scholarship-title",
      deadline: ".c-scholarships__deadline, .deadline, time",
      link: "a.c-scholarships__link, a.scholarship-link",
      keterangan: ".c-scholarships__description, .scholarship-desc",
    },
  },

  chevening: {
    // ⚠️ Sesuaikan dengan struktur chevening.org
    baseUrl: "https://www.chevening.org",
    listUrl: "https://www.chevening.org/scholarships/",
    selectors: {
      itemList: ".scholarship-listing article, .scholarship-card",
      nama: "h2.scholarship-title, .entry-title",
      deadline: ".scholarship-deadline, time",
      link: "a.scholarship-link, .read-more a",
      keterangan: ".scholarship-description, .entry-summary",
    },
  },

  australiaAwards: {
    // ⚠️ Sesuaikan dengan struktur australiaawardsindonesia.org
    baseUrl: "https://www.australiaawardsindonesia.org",
    listUrl: "https://www.australiaawardsindonesia.org/scholarships",
    selectors: {
      itemList: ".scholarship-item, .award-card, article",
      nama: "h2, h3, .scholarship-title",
      deadline: ".deadline, .closing-date, time",
      link: "a.apply-now, a.learn-more",
      keterangan: ".scholarship-desc, .summary, p",
    },
  },

  fulbright: {
    // ⚠️ Sesuaikan dengan struktur aminef.or.id
    baseUrl: "https://www.aminef.or.id",
    listUrl: "https://www.aminef.or.id/grants-for-indonesians/fulbright-programs/",
    selectors: {
      itemList: ".program-item, .grant-card, .entry, article",
      nama: "h3, .program-title, .entry-title",
      deadline: ".deadline, .due-date, time",
      link: "a.more-info, a.apply, .read-more a",
      keterangan: ".program-desc, .entry-content p, p",
    },
  },

  erasmusMundus: {
    // ⚠️ Sesuaikan dengan eacea.ec.europa.eu atau erasmus-plus.ec.europa.eu
    //    Situs EU berbasis JavaScript berat — Playwright wajib
    baseUrl: "https://www.eacea.ec.europa.eu",
    listUrl: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
    selectors: {
      itemList: ".views-row, .project-item, article, .field-content",
      nama: "h3, h4, .views-field-title, .project-title",
      deadline: ".deadline, time, .views-field-field-date",
      link: "a[href*='scholarship'], a[href*='project'], h3 a",
      keterangan: ".description, .field-body, p",
      bidang: ".field-subject, .discipline, .field-area",
    },
  },

  // ─────────────────────────────────────────────────────────
  // SUMBER BARU — PRIORITAS TINGGI (semua prodi UNU)
  // ─────────────────────────────────────────────────────────

  stipendiumHungaricum: {
    // ⚠️ Sesuaikan dengan stipendiumhungaricum.hu — login portal, sulit di-crawl
    baseUrl: "https://stipendiumhungaricum.hu",
    listUrl: "https://stipendiumhungaricum.hu/apply/",
    selectors: {
      itemList: ".scholarship-item, .programme-card, article, .card, .program",
      nama: "h2, h3, .title, .programme-name, .card-title",
      deadline: ".deadline, time, .apply-deadline, .date",
      link: "a.apply, a.details, a[href*='apply'], .card a",
      keterangan: "p, .description, .summary, .card-body",
    },
  },

  searca: {
    // ⚠️ Sesuaikan dengan searca.org
    baseUrl: "https://www.searca.org",
    listUrl: "https://www.searca.org/scholarships",
    selectors: {
      itemList: ".scholarship-item, .program-card, article, .views-row",
      nama: "h2, h3, .title, .views-field-title",
      deadline: ".deadline, time, .closing-date, .field--name-field-date",
      link: "a.read-more, a.details, h3 a, .views-field-title a",
      keterangan: "p, .field--name-body, .description, .views-field-body",
    },
  },

  adbJsp: {
    // ⚠️ Sesuaikan dengan adb.org — halaman statis, lebih mudah di-crawl
    baseUrl: "https://www.adb.org",
    listUrl: "https://www.adb.org/site/careers/japan-scholarship-program",
    selectors: {
      itemList: ".field-item, .content-item, article, section, .block",
      nama: "h2, h3, .title, strong",
      deadline: ".deadline, time, .date, .field-date",
      link: "a[href*='scholarship'], a.read-more, h3 a",
      keterangan: "p, .field-body, .description, .content",
    },
  },

  alAzharSacm: {
    // ⚠️ Situs Al-Azhar sering berubah dan sebagian berbahasa Arab
    //    Pantau juga: kemenag.go.id untuk jalur resmi melalui Indonesia
    baseUrl: "https://www.azhar.edu.eg",
    listUrl: "https://www.azhar.edu.eg/en/international-students",
    selectors: {
      itemList: ".scholarship-item, .program, article, .content-block, li",
      nama: "h2, h3, h4, .title, strong",
      deadline: ".deadline, time, .date",
      link: "a.details, a.apply, h3 a, a[href*='scholarship']",
      keterangan: "p, .description, .content",
    },
  },

  eiffel: {
    // ⚠️ Sesuaikan dengan campusfrance.org — halaman bisa berubah tiap siklus
    baseUrl: "https://www.campusfrance.org",
    listUrl: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
    selectors: {
      itemList: ".field-item, .paragraph, article, .block, section",
      nama: "h2, h3, .field-title, .block-title",
      deadline: ".deadline, time, .date, .field-date",
      link: "a[href*='eiffel'], a.en-savoir-plus, a.read-more",
      keterangan: "p, .field-body, .text, .wysiwyg",
    },
  },

  singa: {
    // ⚠️ Sesuaikan dengan a-star.edu.sg — JavaScript-heavy, Playwright wajib
    baseUrl: "https://www.a-star.edu.sg",
    listUrl: "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa",
    selectors: {
      itemList: ".content-block, .field-item, article, section, .accordion-item",
      nama: "h2, h3, .title, .accordion-title",
      deadline: ".deadline, time, .closing, .date",
      link: "a[href*='singa'], a.apply, a.read-more",
      keterangan: "p, .description, .content, .accordion-body",
    },
  },

  wageningen: {
    // ⚠️ Sesuaikan dengan wur.nl — posisi PhD diiklankan di halaman berbeda
    //    Pantau juga: wur.nl/en/education-programmes/phd-programmes/vacancies.htm
    baseUrl: "https://www.wur.nl",
    listUrl: "https://www.wur.nl/en/education-programmes/phd-programmes/scholarship-and-grants.htm",
    selectors: {
      itemList: ".scholarship-item, .card, article, .list-item, .content-block",
      nama: "h2, h3, .card-title, .title",
      deadline: ".deadline, time, .date",
      link: "a[href*='scholarship'], a[href*='phd'], .card a, h3 a",
      keterangan: "p, .card-body, .description, .intro",
    },
  },

  techFellowship: {
    // ⚠️ Situs Google Research — konten dinamis, Playwright wajib
    //    Jika crawl gagal, data statis di getStaticEntries() tetap digunakan
    baseUrl: "https://research.google",
    listUrl: "https://research.google/programs-and-events/phd-fellowship/",
    selectors: {
      itemList: ".glue-card, .program-item, article, .fellowship-item, .card",
      nama: "h2, h3, .glue-headline, .title, .card-title",
      deadline: ".deadline, time, .date, .glue-label",
      link: "a[href*='fellowship'], a[href*='program'], .glue-card a",
      keterangan: "p, .glue-body, .description, .card-body",
    },
  },
} as const;
