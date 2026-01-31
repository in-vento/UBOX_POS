import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        console.log('Starting manual database migration via API...');

        const runQuery = async (query: string) => {
            try {
                await prisma.$executeRawUnsafe(query);
                console.log(`Executed: ${query}`);
            } catch (e: any) {
                // Ignore "duplicate column" errors
                if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
                    console.log(`Skipped (already exists): ${query}`);
                } else {
                    console.warn(`Failed to execute: ${query}. Error: ${e.message}`);
                }
            }
        };

        // Fix for v0.3.8: Add missing columns for Products
        await runQuery("ALTER TABLE Product ADD COLUMN commissionPercentage REAL DEFAULT 0");
        await runQuery("ALTER TABLE Product ADD COLUMN isCombo BOOLEAN DEFAULT 0");
        await runQuery("ALTER TABLE Product ADD COLUMN isCommissionable BOOLEAN DEFAULT 0");
        await runQuery("ALTER TABLE Product ADD COLUMN stock INTEGER DEFAULT 0");

        // Fix for v0.3.9: Create ComboItem table and fix stock
        await runQuery(`
            CREATE TABLE IF NOT EXISTS "ComboItem" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "comboId" TEXT NOT NULL,
                "productId" TEXT NOT NULL,
                "quantity" INTEGER NOT NULL DEFAULT 1,
                CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "ComboItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        // Ensure stock is not null for existing products so inventory adjustments work
        await runQuery("UPDATE Product SET stock = 0 WHERE stock IS NULL");

        // Fix for v0.3.10: Add missing columns to MonitorConfig
        await runQuery("ALTER TABLE MonitorConfig ADD COLUMN publicAccessEnabled BOOLEAN DEFAULT 0");
        await runQuery("ALTER TABLE MonitorConfig ADD COLUMN publicUrl TEXT");
        await runQuery("ALTER TABLE MonitorConfig ADD COLUMN showDashboard BOOLEAN DEFAULT 1");
        await runQuery("ALTER TABLE MonitorConfig ADD COLUMN localAccessOnly BOOLEAN DEFAULT 0");
        await runQuery("ALTER TABLE MonitorConfig ADD COLUMN popupDuration INTEGER DEFAULT 3000");
        await runQuery("ALTER TABLE MonitorConfig ADD COLUMN soundEnabled BOOLEAN DEFAULT 1");

        // Fix for v0.3.17: Add AppConfig table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS "AppConfig" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "masajistaRoleName" TEXT NOT NULL DEFAULT 'Masajista',
                "masajistaRoleNamePlural" TEXT NOT NULL DEFAULT 'Masajistas',
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Fix for v0.3.22: Add SyncQueue table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS "sync_queue" (
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
            )
        `);
        await runQuery(`CREATE INDEX IF NOT EXISTS "sync_queue_status_idx" ON "sync_queue"("status")`);

        // Fix for v0.3.23: Add SUNAT tables
        await runQuery(`
            CREATE TABLE IF NOT EXISTS "Client" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "tipoDoc" TEXT NOT NULL,
                "numDoc" TEXT NOT NULL,
                "razonSocial" TEXT NOT NULL,
                "direccion" TEXT,
                "email" TEXT,
                "telefono" TEXT,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL
            )
        `);
        await runQuery(`CREATE UNIQUE INDEX IF NOT EXISTS "Client_numDoc_key" ON "Client"("numDoc")`);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS "SunatDocument" (
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
            )
        `);
        await runQuery(`CREATE INDEX IF NOT EXISTS "SunatDocument_orderId_idx" ON "SunatDocument"("orderId")`);
        await runQuery(`CREATE INDEX IF NOT EXISTS "SunatDocument_status_idx" ON "SunatDocument"("status")`);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS "SunatDocumentItem" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "documentId" TEXT NOT NULL,
                "descripcion" TEXT NOT NULL,
                "cantidad" REAL NOT NULL,
                "valorUnitario" REAL NOT NULL,
                "precioUnitario" REAL NOT NULL,
                "igv" REAL NOT NULL,
                "total" REAL NOT NULL,
                CONSTRAINT "SunatDocumentItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SunatDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS "CompanySunatConfig" (
                "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
                "sunatEnabled" BOOLEAN NOT NULL DEFAULT 0,
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
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Fix for v0.3.38: Add SystemConfig table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS "SystemConfig" (
                "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
                "cloudToken" TEXT,
                "businessId" TEXT,
                "fingerprint" TEXT,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        return NextResponse.json({ success: true, message: 'Migration completed' });
    } catch (error: any) {
        console.error('Migration API failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
