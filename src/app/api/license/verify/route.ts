import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { key, hwid } = await req.json();

        // MOCK VERIFICATION LOGIC
        // In production, this should call your central licensing server
        if (key.startsWith('UBOX-') && key.length > 10) {
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year license

            return NextResponse.json({
                key,
                hwid,
                activatedAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString(),
            });
        }

        return NextResponse.json({ error: 'Invalid license key' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
