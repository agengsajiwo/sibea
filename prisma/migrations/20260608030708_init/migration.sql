-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaBeasiswa" TEXT NOT NULL,
    "penyelenggara" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "pilihanLokasi" TEXT NOT NULL,
    "skemaPembiayaan" TEXT NOT NULL,
    "jenisPembiayaan" TEXT NOT NULL,
    "komponenPembiayaan" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "linkPendaftaran" TEXT NOT NULL,
    "sumberCrawling" TEXT NOT NULL,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "contentHash" TEXT NOT NULL,
    "tanggalCrawling" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CrawlLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "jumlahDitemukan" INTEGER NOT NULL DEFAULT 0,
    "jumlahBaru" INTEGER NOT NULL DEFAULT 0,
    "jumlahDiperbarui" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "durasiMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Scholarship_status_idx" ON "Scholarship"("status");

-- CreateIndex
CREATE INDEX "Scholarship_lokasi_idx" ON "Scholarship"("lokasi");

-- CreateIndex
CREATE INDEX "Scholarship_deadline_idx" ON "Scholarship"("deadline");

-- CreateIndex
CREATE INDEX "Scholarship_contentHash_idx" ON "Scholarship"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
