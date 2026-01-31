import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'local-secret-revery-pos';

export async function GET() {
    try {
        const headersList = await headers();
        const authHeader = headersList.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;

        try {
            decoded = verify(token, JWT_SECRET);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch businesses from local config
        const config = await prisma.systemConfig.findFirst({ where: { id: 'default' } });

        // Mock business structure as expected by SelectBusinessPage
        const businesses = config?.businessId ? [
            {
                business: {
                    id: config.businessId,
                    name: 'Mi Negocio',
                    plan: 'FREE',
                    slug: 'mi-negocio'
                },
                role: 'OWNER'
            }
        ] : [];

        return NextResponse.json({
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                businesses: businesses
            }
        });

    } catch (error: any) {
        console.error('[Auth Me] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
