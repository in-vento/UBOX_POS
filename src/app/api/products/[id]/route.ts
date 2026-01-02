import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();
        const { name, price, category, stock } = body;

        const dataToUpdate: any = {};
        if (name) dataToUpdate.name = name;
        if (price !== undefined) dataToUpdate.price = parseFloat(price);
        if (category) dataToUpdate.category = category;
        if (stock !== undefined) dataToUpdate.stock = parseInt(stock);
        if (body.isCommissionable !== undefined) dataToUpdate.isCommissionable = body.isCommissionable;

        console.log('Updating product:', id, dataToUpdate);

        const product = await prisma.product.update({
            where: { id },
            data: dataToUpdate,
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Failed to update product', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // Check if product is used in any orders
        const orderItems = await prisma.orderItem.findFirst({
            where: { productId: id }
        });

        if (orderItems) {
            return NextResponse.json(
                { error: 'No se puede eliminar. Este producto está siendo usado en pedidos existentes.' },
                { status: 400 }
            );
        }

        await prisma.product.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
