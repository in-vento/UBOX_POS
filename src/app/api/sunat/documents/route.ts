import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const documents = await prisma.sunatDocument.findMany({
            include: {
                client: true,
                order: true
            },
            orderBy: {
                fechaEmision: 'desc'
            }
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        console.error('[SunatDocumentsAPI] Error:', error);
        return NextResponse.json({
            error: error.message || 'Error al obtener documentos SUNAT'
        }, { status: 500 });
    }
}
