/**
 * Print Electronic Receipt API
 * 
 * POST /api/print/electronic
 * 
 * Prints a SUNAT-compliant electronic receipt with QR code
 */

import { NextRequest, NextResponse } from 'next/server';
import { printReceipt } from '@/lib/printer';
import { buildElectronicReceiptData } from '@/lib/electronic-receipt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { documentId, printerIp: providedPrinterIp } = body;

        console.log('[PrintElectronicAPI] Received request for document:', documentId);

        // Get SUNAT document with all relations
        const document = await prisma.sunatDocument.findUnique({
            where: { id: documentId },
            include: {
                items: true,
                client: true,
                order: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        },
                        payments: true
                    }
                }
            }
        });

        if (!document) {
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
        }

        // Get company SUNAT config
        const companyData = await prisma.companySunatConfig.findUnique({
            where: { id: 'default' }
        });

        if (!companyData) {
            return NextResponse.json({ error: 'Configuración SUNAT no encontrada' }, { status: 400 });
        }

        // Determine printer IP
        let printerIp = providedPrinterIp;

        if (!printerIp || printerIp.trim() === '') {
            // Find printer assigned to Caja
            const printers = await prisma.printer.findMany();
            const assignedPrinter = printers.find((p: any) => {
                try {
                    const areas = JSON.parse(p.areas);
                    return Array.isArray(areas) && areas.includes('Caja');
                } catch (e) {
                    return p.areas.includes('Caja');
                }
            });

            if (assignedPrinter) {
                printerIp = assignedPrinter.ip;
                console.log(`[PrintElectronicAPI] Using assigned printer: ${printerIp}`);
            }
        }

        if (!printerIp || printerIp.trim() === '') {
            return NextResponse.json({
                error: 'No se encontró una impresora configurada. Configure una impresora en Configuración.'
            }, { status: 400 });
        }

        // Get payment details from order
        const lastPayment = document.order.payments[document.order.payments.length - 1];
        let paymentDetails;

        if (lastPayment) {
            // Parse payment method if it contains structured data
            const methodParts = lastPayment.method.split('|');
            const isEfectivo = methodParts[0] === 'Efectivo';

            if (isEfectivo && methodParts.length > 1) {
                const tendered = parseFloat(methodParts[1]?.split(':')[1] || '0');
                const change = parseFloat(methodParts[2]?.split(':')[1] || '0');
                paymentDetails = { tendered, change, operationCode: '' };
            } else {
                paymentDetails = {
                    tendered: lastPayment.amount,
                    change: 0,
                    operationCode: lastPayment.method.includes('Yape') || lastPayment.method.includes('Plin') ? 'N/A' : ''
                };
            }
        }

        // Build receipt data
        const receiptData = buildElectronicReceiptData(
            document,
            companyData,
            document.order,
            lastPayment?.cashier || 'Cajero',
            paymentDetails
        );

        // Print
        await printReceipt(printerIp, 9100, receiptData);

        console.log('[PrintElectronicAPI] Successfully printed electronic receipt');

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[PrintElectronicAPI] Error:', error);
        return NextResponse.json({ error: error.message || 'Error al imprimir' }, { status: 500 });
    }
}
