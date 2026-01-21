-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipoDoc" TEXT NOT NULL,
    "numDoc" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "direccion" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SunatDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "clientId" TEXT,
    "documentType" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "fullNumber" TEXT NOT NULL,
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "subtotal" REAL NOT NULL,
    "igv" REAL NOT NULL,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "provider" TEXT,
    "hash" TEXT,
    "pdfUrl" TEXT,
    "xmlUrl" TEXT,
    "cdrUrl" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SunatDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SunatDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SunatDocumentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "valorUnitario" REAL NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "igv" REAL NOT NULL,
    "total" REAL NOT NULL,
    CONSTRAINT "SunatDocumentItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SunatDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanySunatConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "sunatEnabled" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "ruc" TEXT,
    "razonSocial" TEXT,
    "nombreComercial" TEXT,
    "direccion" TEXT,
    "ubigeo" TEXT,
    "departamento" TEXT,
    "provincia" TEXT,
    "distrito" TEXT,
    "regimen" TEXT,
    "serieFactura" TEXT NOT NULL DEFAULT 'F001',
    "serieBoleta" TEXT NOT NULL DEFAULT 'B001',
    "correlativoFactura" INTEGER NOT NULL DEFAULT 0,
    "correlativoBoleta" INTEGER NOT NULL DEFAULT 0,
    "pseToken" TEXT,
    "pseUrl" TEXT,
    "pseRucUsuario" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_numDoc_key" ON "Client"("numDoc");

-- CreateIndex
CREATE INDEX "SunatDocument_orderId_idx" ON "SunatDocument"("orderId");

-- CreateIndex
CREATE INDEX "SunatDocument_status_idx" ON "SunatDocument"("status");
