-- CreateTable
CREATE TABLE "SourceMonitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sumber" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "pageHash" TEXT NOT NULL DEFAULT '',
    "lastChecked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChanged" DATETIME,
    "hasUnreviewedChange" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceMonitor_sumber_key" ON "SourceMonitor"("sumber");
