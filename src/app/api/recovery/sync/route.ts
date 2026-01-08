import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { products, staffUsers } = body;
        const businessId = request.headers.get('X-Business-Id');

        // Sync Products
        if (products && Array.isArray(products)) {
            for (const p of products) {
                await prisma.product.upsert({
                    where: { id: p.id },
                    update: {
                        name: p.name,
                        price: p.price,
                        category: p.category,
                        stock: p.stock,
                        isCommissionable: p.isCommissionable,
                        commissionPercentage: p.commissionPercentage,
                        isCombo: p.isCombo,
                        updatedAt: new Date(),
                    },
                    create: {
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        category: p.category,
                        stock: p.stock,
                        isCommissionable: p.isCommissionable,
                        commissionPercentage: p.commissionPercentage,
                        isCombo: p.isCombo,
                        updatedAt: new Date(),
                    },
                });
            }
        }

        // Sync Staff Users
        if (staffUsers && Array.isArray(staffUsers)) {
            for (const u of staffUsers) {
                // Skip if user is admin/boss to avoid overwriting the cloud account owner
                // or handle carefully. For now, we sync everyone to ensure staff list is complete.
                await prisma.user.upsert({
                    where: { id: u.id },
                    update: {
                        name: u.name,
                        role: u.role,
                        pin: u.pin,
                        status: u.status,
                        phone: u.phone,
                        commission: u.commission,
                        updatedAt: new Date(),
                    },
                    create: {
                        id: u.id,
                        name: u.name,
                        role: u.role,
                        pin: u.pin,
                        status: u.status,
                        phone: u.phone,
                        commission: u.commission,
                        updatedAt: new Date(),
                    },
                });
            }
        }

        return NextResponse.json({ success: true, message: 'Data synced successfully' });

    } catch (error) {
        console.error('Error syncing recovery data:', error);
        return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 });
    }
}
