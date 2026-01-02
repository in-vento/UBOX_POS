import { NextRequest, NextResponse } from 'next/server';
import { printReceipt, buildReceiptData, buildBarTicketData, buildCommissionTicketData, buildAuditTicketData, buildShiftReportData, buildCashierReportData, buildTestTicketData } from '@/lib/printer';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Print API Received Body:', JSON.stringify(body, null, 2));
        const { order, cashierName, paymentDetails, waiterName, type, reportData } = body;
        let { printerIp } = body;

        // If printerIp is not provided, try to find it in the database based on the type/area
        if (!printerIp) {
            let area = 'Caja'; // Default
            if (type === 'bar-ticket' || type === 'shift-report') {
                area = 'Barra';
            } else if (type === 'kitchen-ticket') {
                area = 'Cocina';
            }

            const printers = await prisma.printer.findMany();
            const assignedPrinter = printers.find((p: any) => {
                try {
                    const areas = JSON.parse(p.areas);
                    return Array.isArray(areas) && areas.includes(area);
                } catch (e) {
                    return p.areas.includes(area);
                }
            });

            if (assignedPrinter) {
                printerIp = assignedPrinter.ip;
                console.log(`Using assigned printer for ${area}: ${printerIp}`);
            }
        }

        if (!printerIp) {
            return NextResponse.json({ error: 'No se encontró una impresora configurada para esta área.' }, { status: 400 });
        }

        if (!order && !reportData && type !== 'test' && type !== 'commission-ticket') {
            return NextResponse.json({ error: 'Faltan datos para la impresión.' }, { status: 400 });
        }

        let receiptData;
        if (type === 'test') {
            const { printerName } = body;
            receiptData = buildTestTicketData(printerName || 'Impresora Genérica');
        } else if (type === 'bar-ticket') {
            receiptData = buildBarTicketData(order, waiterName || 'Mozo');
        } else if (type === 'commission-ticket') {
            const { staffName, amount } = body;
            receiptData = buildCommissionTicketData(staffName, amount);
        } else if (type === 'audit-ticket') {
            receiptData = buildAuditTicketData(order, cashierName || 'Admin');
        } else if (type === 'shift-report') {
            receiptData = buildShiftReportData(body.reportData);
        } else if (type === 'cashier-report') {
            receiptData = buildCashierReportData(body.reportData);
        } else {
            receiptData = buildReceiptData(order, cashierName || 'Cajero', paymentDetails, waiterName);
        }

        // Default port 9100
        await printReceipt(printerIp, 9100, receiptData);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Print error:', error);
        return NextResponse.json({ error: error.message || 'Error al imprimir' }, { status: 500 });
    }
}
