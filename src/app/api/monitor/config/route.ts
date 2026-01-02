import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let config = await prisma.monitorConfig.findUnique({
            where: { id: 'default' }
        });

        if (!config) {
            config = await prisma.monitorConfig.create({
                data: {
                    id: 'default',
                    isActive: true,
                    popupDuration: 3000,
                    soundEnabled: true,
                    localAccessOnly: false,
                    showDashboard: true,
                    publicAccessEnabled: false,
                    publicUrl: null,
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching monitor config:', error);
        return NextResponse.json({ error: 'Failed to fetch monitor config' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { isActive, popupDuration, soundEnabled, localAccessOnly, showDashboard, publicAccessEnabled, publicUrl } = body;

        const config = await prisma.monitorConfig.upsert({
            where: { id: 'default' },
            update: {
                isActive,
                popupDuration,
                soundEnabled,
                localAccessOnly,
                showDashboard,
                publicAccessEnabled,
                publicUrl,
            },
            create: {
                id: 'default',
                isActive: isActive ?? true,
                popupDuration: popupDuration ?? 3000,
                soundEnabled: soundEnabled ?? true,
                localAccessOnly: localAccessOnly ?? false,
                showDashboard: showDashboard ?? true,
                publicAccessEnabled: publicAccessEnabled ?? false,
                publicUrl: publicUrl ?? null,
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error updating monitor config:', error);
        return NextResponse.json({ error: 'Failed to update monitor config' }, { status: 500 });
    }
}
