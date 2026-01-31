import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ entity: string }> }
) {
    try {
        const { entity } = await params;
        const body = await request.json();
        const businessId = request.headers.get('X-Business-Id');

        const { localId, action, data } = body;

        console.log(`[Cloud Sync] Syncing ${entity} ${localId} (${action}) for business ${businessId}`);

        if (!businessId) {
            return NextResponse.json({ error: 'X-Business-Id is required' }, { status: 400 });
        }

        // Map entity to Supabase table
        const tableMap: Record<string, string> = {
            'order': 'orders',
            'payment': 'payments',
            'product': 'products',
            'log': 'system_logs',
            'sunat-document': 'sunat_documents',
            'staff': 'staff_users'
        };

        const tableName = tableMap[entity.toLowerCase()] || `${entity.toLowerCase()}s`;

        let result;
        if (action === 'DELETE') {
            result = await supabase
                .from(tableName)
                .delete()
                .eq('businessId', businessId)
                .eq('localId', localId);
        } else {
            // UPSERT logic
            // Add businessId to the data
            const cloudPayload = {
                ...data,
                businessId,
                localId: localId || data.id,
                updatedAt: new Date().toISOString()
            };

            // Remove Prisma-specific relations if they exist
            delete cloudPayload.id; // Use cloud UUID or localId instead
            if (cloudPayload.comboItems) delete cloudPayload.comboItems;

            result = await supabase
                .from(tableName)
                .upsert(cloudPayload, { onConflict: 'businessId, localId' });
        }

        if (result.error) {
            console.error(`[Cloud Sync] Supabase Error (${tableName}):`, result.error);
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Cloud Sync] Internal Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
