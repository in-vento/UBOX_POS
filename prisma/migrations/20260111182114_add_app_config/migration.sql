-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "cloudToken" TEXT,
    "businessId" TEXT,
    "fingerprint" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "masajistaRoleName" TEXT NOT NULL DEFAULT 'Masajista',
    "masajistaRoleNamePlural" TEXT NOT NULL DEFAULT 'Masajistas',
    "updatedAt" DATETIME NOT NULL
);
