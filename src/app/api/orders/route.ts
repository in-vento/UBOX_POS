import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCustomOrderId } from '@/lib/orderIdGenerator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = searchParams.get('limit');
        const waiterId = searchParams.get('waiterId');
        const showAll = searchParams.get('all') === 'true';
        const search = searchParams.get('search'); // New: search parameter

        const where: any = {};
        if (status) where.status = status;
        if (waiterId) where.waiterId = waiterId;

        // Add search functionality
        if (search) {
            where.OR = [
                { customId: { contains: search, mode: 'insensitive' } },
                { customer: { contains: search, mode: 'insensitive' } },
                { waiter: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (!showAll) {
            // Find the last SHIFT_CLOSE log
            const lastCloseLog = await prisma.log.findFirst({
                where: { action: 'SHIFT_CLOSE' },
                orderBy: { timestamp: 'desc' }
            });

            if (lastCloseLog) {
                where.OR = [
                    { createdAt: { gt: lastCloseLog.timestamp } },
                    { status: 'Pending' }
                ];
            }
        }

        const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit ? parseInt(limit) : undefined,
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
        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('POST /api/orders body:', JSON.stringify(body, null, 2));
        const { waiterId, customer, items, masajistaIds } = body;
        console.log('Creating order with waiterId:', waiterId);

        // Generate custom order ID
        const customId = await generateCustomOrderId();

        // Fetch products to get current prices
        const productIds = items.map((item: any) => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        let calculatedTotal = 0;
        const orderItemsData = items.map((item: any) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            const price = product.price;
            calculatedTotal += price * item.quantity;
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: price
            };
        });

        const order = await prisma.order.create({
            data: {
                customId,  // Add custom ID
                waiterId,
                customer: customer || 'Cliente General',
                totalAmount: calculatedTotal,
                status: 'Pending',
                masajistaIds: masajistaIds ? JSON.stringify(masajistaIds) : null,
                items: {
                    create: orderItemsData
                }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                waiter: true
            }
        });

        // Add to sync queue
        try {
            const { SyncService } = await import('@/lib/sync-service');
            await SyncService.addToQueue('Order', order.id, 'CREATE', order);
        } catch (e) {
            console.error('Failed to add order to sync queue:', e);
        }

        // Broadcast to monitors
        try {
            const { broadcast } = await import('@/lib/sse');
            broadcast('order_created', order);
        } catch (e) {
            console.error('Failed to broadcast order creation:', e);
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        // Log the full error details
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create order' }, { status: 500 });
    }
}
