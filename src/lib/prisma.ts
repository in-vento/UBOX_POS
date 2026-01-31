import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// In Electron production, process.env.DATABASE_URL is set in main.js
// We log it to verify debugging in case of 500 errors.
const dbUrl = process.env.DATABASE_URL;

if (!globalForPrisma.prisma) {
    console.log('[Prisma] Initializing client. URL defined:', !!dbUrl);
    if (dbUrl) console.log('[Prisma] Using DB at:', dbUrl.split('?')[0]); // Redact params
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query', 'error', 'warn'],
        datasources: {
            db: {
                url: dbUrl,
            },
        },
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
