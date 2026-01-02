import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const where: any = {};
        if (category) {
            where.category = category;
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, price, category, commissionPercentage, isCombo, comboItems } = body;

        const product = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                category,
                stock: 0, // Default stock changed from 100 to 0
                isCommissionable: body.isCommissionable || false,
                commissionPercentage: commissionPercentage ? parseFloat(commissionPercentage) : 0,
                isCombo: isCombo || false,
                comboItems: isCombo && comboItems ? {
                    create: comboItems.map((item: any) => ({
                        productId: item.productId,
                        quantity: parseInt(item.quantity)
                    }))
                } : undefined
            },
            include: {
                comboItems: true
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({
            error: 'Failed to create product',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
