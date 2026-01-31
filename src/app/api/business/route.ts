import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: { message: 'Business name is required' } }, { status: 400 });
        }

        console.log('[Business] Creating new business:', name);

        // For this local-first POS, we create the business record locally.
        // We'll also update the SystemConfig to link this local app to this business.

        // Note: Real SaaS would call the Cloud API here.
        // Since we are restoring a broken state, we'll simulate a successful cloud creation
        // and store it locally so the sync service can start working.

        const mockId = `bus_${Math.random().toString(36).substr(2, 9)}`;

        // We can track businesses in a local table if we add it to schema.prisma,
        // but looking at schema.prisma, there is NO Business model!
        // The business context is stored in SystemConfig.

        await prisma.systemConfig.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                businessId: mockId,
            },
            update: {
                businessId: mockId,
            }
        });

        return NextResponse.json({
            data: {
                id: mockId,
                name,
                plan: 'FREE',
                slug: name.toLowerCase().replace(/ /g, '-')
            }
        });

    } catch (error: any) {
        console.error('[Business] Error:', error);
        return NextResponse.json(
            { error: { message: error.message || 'Internal server error' } },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return empty list or local config if exists
    try {
        const config = await prisma.systemConfig.findFirst({ where: { id: 'default' } });
        if (config && config.businessId) {
            return NextResponse.json({
                data: [
                    {
                        id: config.businessId,
                        name: 'Mi Negocio', // We don't store the name in SystemConfig
                        plan: 'FREE',
                        role: 'OWNER'
                    }
                ]
            });
        }
        return NextResponse.json({ data: [] });
    } catch (e) {
        return NextResponse.json({ data: [] });
    }
}
