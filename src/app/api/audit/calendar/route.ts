import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userType = searchParams.get('userType'); // 'mozo' | 'masajista' | 'cliente'
        const userId = searchParams.get('userId'); // For mozo/masajista
        const customerName = searchParams.get('customerName'); // For cliente
        const startDate = searchParams.get('startDate'); // Optional: filter by date range
        const endDate = searchParams.get('endDate'); // Optional: filter by date range

        if (!userType) {
            return NextResponse.json({ error: 'userType is required' }, { status: 400 });
        }

        // Build where clause based on user type
        const where: any = {};

        if (userType === 'mozo') {
            if (!userId) {
                return NextResponse.json({ error: 'userId is required for mozo' }, { status: 400 });
            }
            where.waiterId = userId;
        } else if (userType === 'masajista') {
            if (!userId) {
                return NextResponse.json({ error: 'userId is required for masajista' }, { status: 400 });
            }
            // For masajistas, we need to filter by masajistaIds (JSON array)
            // We'll fetch all orders and filter in memory since SQLite doesn't support JSON queries well
        } else if (userType === 'cliente') {
            if (!customerName) {
                return NextResponse.json({ error: 'customerName is required for cliente' }, { status: 400 });
            }
            // Search for exact or partial match
            where.customer = customerName;
        }

        // Add date range filter if provided
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        // Fetch orders with all related data
        let orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                waiter: true,
                payments: true
            }
        });

        // Filter by masajistaIds if userType is masajista
        if (userType === 'masajista' && userId) {
            orders = orders.filter(order => {
                if (!order.masajistaIds) return false;
                try {
                    const ids = JSON.parse(order.masajistaIds);
                    return Array.isArray(ids) && ids.includes(userId);
                } catch (e) {
                    return false;
                }
            });
        }

        // Group orders by date
        const groupedByDate: Record<string, any> = {};

        orders.forEach(order => {
            // Use local date to avoid timezone offset issues
            const orderDate = new Date(order.createdAt);
            const localDate = new Date(orderDate.getTime() - (orderDate.getTimezoneOffset() * 60000));
            const date = localDate.toISOString().split('T')[0];

            if (!groupedByDate[date]) {
                groupedByDate[date] = {
                    date,
                    orderCount: 0,
                    totalAmount: 0,
                    totalCommission: 0,
                    orders: []
                };
            }

            // Transform order data
            const transformedOrder = {
                ...order,
                amount: order.totalAmount || 0,
                date: new Date(order.createdAt).toLocaleDateString('es-PE'),
                time: new Date(order.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                masajistaIds: (() => {
                    try {
                        if (Array.isArray(order.masajistaIds)) return order.masajistaIds;
                        if (!order.masajistaIds) return [];
                        if (typeof order.masajistaIds === 'object') return order.masajistaIds;
                        return JSON.parse(order.masajistaIds);
                    } catch (e) {
                        return [];
                    }
                })(),
                products: (order.items || []).map((item: any) => ({
                    id: item.product?.id || item.productId,
                    name: item.product?.name || 'Producto',
                    quantity: item.quantity,
                    price: item.price,
                    category: item.product?.category,
                    isCommissionable: item.product?.isCommissionable,
                    commissionPercentage: item.product?.commissionPercentage
                }))
            };

            groupedByDate[date].orderCount++;
            groupedByDate[date].totalAmount += order.totalAmount;
            groupedByDate[date].orders.push(transformedOrder);

            // Calculate commission for masajistas
            if (userType === 'masajista') {
                const orderCommission = transformedOrder.products.reduce((sum: number, p: any) => {
                    if (p.isCommissionable) {
                        const productPercentage = p.commissionPercentage || 0;
                        const defaultPercentage = 32; // Default commission
                        const effectivePercentage = productPercentage > 0 ? productPercentage : defaultPercentage;
                        return sum + (p.price * (effectivePercentage / 100) * p.quantity);
                    }
                    return sum;
                }, 0);

                // Divide by number of masajistas if multiple
                const masajistasCount = transformedOrder.masajistaIds.length || 1;
                groupedByDate[date].totalCommission += orderCommission / masajistasCount;
            }
        });

        // Convert to array and sort by date descending
        const dates = Object.values(groupedByDate).sort((a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return NextResponse.json({ dates });
    } catch (error) {
        console.error('Error fetching calendar audit data:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
    }
}
