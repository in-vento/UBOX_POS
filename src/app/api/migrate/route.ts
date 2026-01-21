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

        return NextResponse.json({ success: true, message: 'Migration completed' });
    } catch (error: any) {
        console.error('Migration API failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
