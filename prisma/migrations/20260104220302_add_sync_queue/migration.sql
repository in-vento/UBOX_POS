-- CreateTable
CREATE TABLE "sync_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonitorConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "popupDuration" INTEGER NOT NULL DEFAULT 3000,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "localAccessOnly" BOOLEAN NOT NULL DEFAULT false,
    "showDashboard" BOOLEAN NOT NULL DEFAULT true,
    "publicAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
    "publicUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MonitorConfig" ("id", "isActive", "localAccessOnly", "popupDuration", "showDashboard", "soundEnabled", "updatedAt") SELECT "id", "isActive", "localAccessOnly", "popupDuration", "showDashboard", "soundEnabled", "updatedAt" FROM "MonitorConfig";
DROP TABLE "MonitorConfig";
ALTER TABLE "new_MonitorConfig" RENAME TO "MonitorConfig";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "sync_queue_status_idx" ON "sync_queue"("status");
