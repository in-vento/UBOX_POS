import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const config = await prisma.systemConfig.findFirst({
            where: { id: 'default' }
        });
        return NextResponse.json(config || {});
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const config = await prisma.systemConfig.upsert({
            where: { id: 'default' },
            update: {
                cloudToken: body.cloudToken,
                businessId: body.businessId,
                fingerprint: body.fingerprint
            },
            create: {
                id: 'default',
                cloudToken: body.cloudToken,
                businessId: body.businessId,
                fingerprint: body.fingerprint
            }
        });
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
