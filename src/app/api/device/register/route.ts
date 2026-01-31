import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { fingerprint, name, businessId } = body;

        console.log('[Device Register] Registering device:', { fingerprint, name, businessId });

        await prisma.systemConfig.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                fingerprint,
                businessId
            },
            update: {
                fingerprint,
                businessId
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                fingerprint,
                status: 'REGISTERED'
            }
        });
    } catch (error: any) {
        console.error('[Device Register] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
