import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: { fingerprint: string } }
) {
    try {
        const { fingerprint } = params;
        console.log('[Device Check] Checking fingerprint:', fingerprint);

        const config = await prisma.systemConfig.findFirst({
            where: { id: 'default' }
        });

        // For local POS, if no fingerprint is set, we consider it authorized upon registration
        // If one is set, it must match.
        const isAuthorized = !config?.fingerprint || config.fingerprint === fingerprint;

        return NextResponse.json({
            data: {
                isAuthorized,
                message: isAuthorized ? 'Device authorized' : 'Device not authorized'
            }
        });
    } catch (error: any) {
        console.error('[Device Check] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
