import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const printers = await prisma.printer.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(printers);
    } catch (error) {
        console.error('Error fetching printers:', error);
        return NextResponse.json({ error: 'Error fetching printers' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, ip, areas } = body;

        if (!name || !ip || !areas) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const printer = await prisma.printer.create({
            data: {
                name,
                ip,
                areas: JSON.stringify(areas)
            }
        });

        return NextResponse.json(printer);
    } catch (error) {
        console.error('Error creating printer:', error);
        return NextResponse.json({ error: 'Error creating printer' }, { status: 500 });
    }
}
