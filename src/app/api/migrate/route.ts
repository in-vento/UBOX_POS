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

        return NextResponse.json({ success: true, message: 'Migration completed' });
    } catch (error: any) {
        console.error('Migration API failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
