-- AlterTable
ALTER TABLE "Order" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "editedBy" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "cashier" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- CreateTable
CREATE TABLE "MonitorConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "popupDuration" INTEGER NOT NULL DEFAULT 3000,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "localAccessOnly" BOOLEAN NOT NULL DEFAULT false,
    "showDashboard" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Printer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "areas" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
