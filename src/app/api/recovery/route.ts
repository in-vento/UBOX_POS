import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const businessId = request.headers.get('X-Business-Id');
        const authHeader = request.headers.get('Authorization');

        console.log('[API Recovery] Request received for business:', businessId);

        if (!businessId) {
            return NextResponse.json({ error: 'X-Business-Id header is required' }, { status: 400 });
        }

        // Fetch Products from Supabase
        const { data: products, error: pError } = await supabase
            .from('products')
            .select('*')
            .eq('businessId', businessId);

        if (pError) {
            console.error('[API Recovery] Supabase Products Error:', pError);
            throw pError;
        }

        // Fetch Staff from Supabase
        // Note: Check if the table is 'staff' or 'staff_users' or shared 'users'
        // Based on the SyncService logic, it expects 'staffUsers' in the response.
        const { data: staffUsers, error: sError } = await supabase
            .from('staff_users')
            .select('*')
            .eq('businessId', businessId);

        // If 'staff_members' doesn't exist, try 'users' or return empty
        let finalStaff = staffUsers || [];
        if (sError) {
            console.warn('[API Recovery] staff_members not found, trying users table...');
            const { data: altStaff } = await supabase
                .from('users')
                .select('*')
                .eq('businessId', businessId);
            finalStaff = altStaff || [];
        }

        return NextResponse.json({
            success: true,
            data: {
                products: (products || []).map(p => ({
                    localId: p.localId || p.id,
                    name: p.name,
                    price: p.price,
                    category: p.category,
                    stock: p.stock
                })),
                staffUsers: finalStaff.map(u => ({
                    localId: u.localId || u.id,
                    name: u.name,
                    role: u.role,
                    pin: u.pin,
                    status: u.status || 'ACTIVE'
                }))
            }
        });

    } catch (error: any) {
        console.error('[API Recovery] Internal Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error fetching cloud data'
        }, { status: 500 });
    }
}
