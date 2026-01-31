import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const config = await prisma.systemConfig.findFirst({ where: { id: 'default' } });
        const syncCount = await prisma.syncQueue.count();
        const pendingCount = await prisma.syncQueue.count({ where: { status: 'PENDING' } });
        const failedCount = await prisma.syncQueue.count({ where: { status: 'FAILED' } });

        return NextResponse.json({
            config: {
                hasToken: !!config?.cloudToken,
                tokenPrefix: config?.cloudToken ? config.cloudToken.substring(0, 10) + '...' : null,
                businessId: config?.businessId,
                fingerprint: config?.fingerprint,
            },
            stats: {
                totalInQueue: syncCount,
                pending: pendingCount,
                failed: failedCount
            },
            env: {
                DATABASE_URL_DEFINED: !!process.env.DATABASE_URL,
                NODE_ENV: process.env.NODE_ENV
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
