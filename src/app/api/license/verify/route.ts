import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
    try {
        // Next.js 15 requires awaiting headers()
        const headersList = await headers();
        const businessId = headersList.get('x-business-id');
        const fingerprint = headersList.get('x-device-fingerprint');

        console.log('[License Verify] Verifying license for:', { businessId, fingerprint });

        // Mock a valid active license
        const now = new Date();
        const expiry = new Date();
        expiry.setFullYear(now.getFullYear() + 1); // 1 year trial/license

        return NextResponse.json({
            success: true,
            data: {
                status: 'ACTIVE',
                expiry: expiry.toISOString(),
                serverTime: now.toISOString(),
                plan: 'FREE_TRIAL'
            }
        });
    } catch (error: any) {
        console.error('[License Verify] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
