import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const businessId = request.headers.get('X-Business-Id');
        const { localId, action, data } = body;

        console.log(`[Cloud Sync] Syncing Staff Member ${localId} for business ${businessId}`);

        if (!businessId) {
            return NextResponse.json({ error: 'X-Business-Id is required' }, { status: 400 });
        }

        const cloudPayload = {
            ...data,
            businessId,
            localId: localId || data.id,
            updatedAt: new Date().toISOString()
        };

        delete cloudPayload.id;

        const { error } = await supabase
            .from('staff_users')
            .upsert(cloudPayload, { onConflict: 'businessId, localId' });

        if (error) {
            console.error('[Cloud Sync] Staff Sync Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
