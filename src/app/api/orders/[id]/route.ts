import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, payment, items, userId, editedBy } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        // Omit editedBy from updateData to avoid Prisma client validation error
        // We will update it using a raw query below

        // Fetch current order to compare or get data for logs
        const currentOrder = await prisma.order.findUnique({
            where: { id },
            include: { items: { include: { product: true } } }
        });
        if (!currentOrder) throw new Error('Order not found');

        // If items are provided, update them and recalculate total
        if (items) {
            // Delete old items
            await prisma.orderItem.deleteMany({ where: { orderId: id } });

            // Fetch products to get current prices and categories
            const productIds = items.map((item: any) => item.productId);
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } }
            });

            let calculatedTotal = 0;
            const orderItemsData = items.map((item: any) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) throw new Error(`Product not found: ${item.productId}`);
                calculatedTotal += product.price * item.quantity;
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price
                };
            });

            updateData.totalAmount = calculatedTotal;
            updateData.items = {
                create: orderItemsData
            };

            // Masajista logic: if no items are commissionable, clear masajistaIds
            const hasCommissionableItems = products.some(p => p.isCommissionable);
            if (!hasCommissionableItems) {
                updateData.masajistaIds = null;
            }

            // Log the edit
            const oldItemsDesc = currentOrder.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ');
            const newItemsDesc = items.map((i: any) => {
                const p = products.find(prod => prod.id === i.productId);
                return `${i.quantity}x ${p?.name || 'Producto'}`;
            }).join(', ');

            await prisma.log.create({
                data: {
                    action: 'ORDER_EDITED',
                    details: `Pedido ${currentOrder.customId || id.slice(-6)} editado por ${editedBy || 'Admin'}. Antes: [${oldItemsDesc}]. Ahora: [${newItemsDesc}]. Total: S/ ${calculatedTotal.toFixed(2)}`,
                    userId: userId || null
                }
            });
        }

        // Update editedBy using raw SQL to bypass Prisma client limitations
        if (editedBy) {
            try {
                console.log(`Updating editedBy for order ${id} to ${editedBy}`);
                await prisma.$executeRaw`UPDATE "Order" SET "editedBy" = ${editedBy} WHERE "id" = ${id}`;
            } catch (e) {
                console.error("Failed to update editedBy via raw SQL", e);
            }
        }

        // Determine if stock should be deducted (only if status is changing to Completed)
        const targetTotal = updateData.totalAmount !== undefined ? updateData.totalAmount : currentOrder.totalAmount;
        const isBecomingCompleted = (status === 'Completed' || (payment && (currentOrder.paidAmount + payment.amount) >= targetTotal)) && currentOrder.status !== 'Completed';

        if (isBecomingCompleted) {
            console.log(`Order ${id} is becoming Completed. Deducting stock...`);
            const orderWithItems = await prisma.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (orderWithItems) {
                const visitedIds = new Set<string>();
                // Recursive function to deduct stock
                const deductStockRecursive = async (productId: string, quantity: number, depth: number = 0) => {
                    if (depth > 10 || visitedIds.has(productId)) {
                        console.warn(`Circular dependency or too deep recursion detected for product ${productId}`);
                        return;
                    }
                    visitedIds.add(productId);

                    const product = await prisma.product.findUnique({
                        where: { id: productId },
                        include: { comboItems: true }
                    });

                    if (product?.isCombo && product.comboItems.length > 0) {
                        console.log(`Deducting combo ${product.name} (x${quantity}) -> components: ${product.comboItems.length}`);
                        for (const comboItem of product.comboItems) {
                            await deductStockRecursive(comboItem.productId, comboItem.quantity * quantity, depth + 1);
                        }
                    } else if (product) {
                        console.log(`Deducting regular product ${product.name} (x${quantity}). Current stock: ${product.stock}`);
                        await prisma.product.update({
                            where: { id: productId },
                            data: { stock: { decrement: quantity } }
                        });
                    }
                    visitedIds.delete(productId);
                };

                for (const item of orderWithItems.items) {
                    await deductStockRecursive(item.productId, item.quantity);
                }
            }
        }

        // If payment is provided, add it and update paidAmount
        if (payment) {
            updateData.paidAmount = { increment: payment.amount };
            updateData.payments = {
                create: {
                    amount: payment.amount,
                    method: payment.method,
                    cashier: payment.cashier
                }
            };

            // Auto-complete if fully paid
            if ((currentOrder.paidAmount + payment.amount) >= targetTotal) {
                updateData.status = 'Completed';
            }
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: updateData,
            include: {
                items: { include: { product: true } },
                payments: true
            }
        });

        // Add to sync queue
        try {
            const { SyncService } = await import('@/lib/sync-service');
            // Sync the updated order
            await SyncService.addToQueue('Order', id, 'UPDATE', updatedOrder);

            // If a new payment was added, sync it too
            if (payment) {
                const lastPayment = updatedOrder.payments[updatedOrder.payments.length - 1];
                if (lastPayment) {
                    await SyncService.addToQueue('Payment', lastPayment.id, 'CREATE', {
                        ...lastPayment,
                        orderId: id
                    });
                }
            }
        } catch (e) {
            console.error('Failed to add order update to sync queue:', e);
        }

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const { reason, userId } = body;

        // Fetch order details before deleting for the log
        const orderToDelete = await prisma.order.findUnique({
            where: { id },
            include: { items: { include: { product: true } } }
        });

        if (orderToDelete) {
            const itemsDesc = orderToDelete.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ');
            await prisma.log.create({
                data: {
                    action: 'ORDER_DELETED',
                    details: `Pedido ${orderToDelete.customId || id.slice(-6)} anulado por ${body.adminName || 'Admin'}. Motivo: ${reason || 'No especificado'}. Contenía: [${itemsDesc}]. Total: S/ ${orderToDelete.totalAmount.toFixed(2)}`,
                    userId: userId || null
                }
            });

            // Soft delete: update status to Cancelled
            await prisma.order.update({
                where: { id },
                data: {
                    status: 'Cancelled'
                }
            });

            // Update cancelReason and editedBy using raw SQL to bypass Prisma client limitations
            try {
                const cancelReason = reason || 'No especificado';
                const adminName = body.adminName || 'Admin';
                await prisma.$executeRaw`UPDATE "Order" SET "cancelReason" = ${cancelReason}, "editedBy" = ${adminName} WHERE "id" = ${id}`;
            } catch (e) {
                console.error("Failed to update cancelReason/editedBy via raw SQL", e);
            }
            // Sync the cancellation
            try {
                const { SyncService } = await import('@/lib/sync-service');
                const cancelledOrder = await prisma.order.findUnique({
                    where: { id },
                    include: { items: { include: { product: true } }, payments: true }
                });
                if (cancelledOrder) {
                    await SyncService.addToQueue('Order', id, 'UPDATE', cancelledOrder);
                }
            } catch (e) {
                console.error('Failed to sync order cancellation:', e);
            }
        }

        return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
}
