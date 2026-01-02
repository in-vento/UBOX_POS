import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { name, ip, areas } = body;

        const printer = await prisma.printer.update({
            where: { id: params.id },
            data: {
                name,
                ip,
                areas: areas ? JSON.stringify(areas) : undefined
            }
        });

        return NextResponse.json(printer);
    } catch (error) {
        console.error('Error updating printer:', error);
        return NextResponse.json({ error: 'Error updating printer' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.printer.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting printer:', error);
        return NextResponse.json({ error: 'Error deleting printer' }, { status: 500 });
    }
}
