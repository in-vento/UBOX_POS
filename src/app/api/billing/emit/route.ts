/**
 * Billing Emission API
 * 
 * POST /api/billing/emit
 * 
 * This endpoint handles the emission of electronic documents (Facturas/Boletas) to SUNAT.
 * It orchestrates the entire flow: validation, document creation, PSE communication, and sync.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SunatProviderFactory } from '@/lib/sunat/factory';
import type { SunatInvoiceData } from '@/lib/sunat/types';

export const dynamic = 'force-dynamic';

interface EmitRequest {
    orderId: string;
    documentType: '01' | '03'; // 01=Factura, 03=Boleta
    clientData: {
        tipoDoc: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
        numDoc: string;
        razonSocial: string;
        direccion?: string;
        email?: string;
    };
}

export async function POST(req: NextRequest) {
    try {
        const body: EmitRequest = await req.json();
        const { orderId, documentType, clientData } = body;

        console.log('[BillingAPI] Emission request:', { orderId, documentType, client: clientData.numDoc });

        // 1. Get SUNAT configuration
        const config = await prisma.companySunatConfig.findUnique({
            where: { id: 'default' }
        });

        if (!config) {
            // Create default config if it doesn't exist
            const newConfig = await prisma.companySunatConfig.create({
                data: { id: 'default' }
            });
            return NextResponse.json({
                error: 'SUNAT no está configurado. Por favor, active SUNAT en Configuración.'
            }, { status: 400 });
        }

        if (!config.sunatEnabled) {
            return NextResponse.json({
                error: 'SUNAT está desactivado. Active SUNAT en Configuración para emitir comprobantes.'
            }, { status: 400 });
        }

        // 2. Get order with items
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                payments: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
        }

        if (order.status !== 'Completed') {
            return NextResponse.json({
                error: 'Solo se pueden emitir comprobantes para órdenes completadas'
            }, { status: 400 });
        }

        // 3. Get or create client
        let client = await prisma.client.findUnique({
            where: { numDoc: clientData.numDoc }
        });

        if (!client) {
            client = await prisma.client.create({
                data: clientData
            });
            console.log('[BillingAPI] Created new client:', client.id);
        }

        // 4. Check if document already exists for this order
        const existingDoc = await prisma.sunatDocument.findFirst({
            where: {
                orderId: order.id,
                documentType,
                status: { in: ['ACEPTADO', 'ENVIADO'] }
            }
        });

        if (existingDoc) {
            return NextResponse.json({
                error: `Ya existe un ${documentType === '01' ? 'Factura' : 'Boleta'} para esta orden: ${existingDoc.fullNumber}`
            }, { status: 400 });
        }

        // 5. Generate correlativo and serie
        const serie = documentType === '01' ? config.serieFactura : config.serieBoleta;
        const correlativoField = documentType === '01' ? 'correlativoFactura' : 'correlativoBoleta';
        const newCorrelativo = config[correlativoField] + 1;
        const fullNumber = `${serie}-${String(newCorrelativo).padStart(8, '0')}`;

        console.log('[BillingAPI] Generated document number:', fullNumber);

        // 6. Calculate IGV (18%)
        const subtotal = order.totalAmount / 1.18;
        const igv = order.totalAmount - subtotal;

        // 7. Create SUNAT document in DRAFT status
        const sunatDoc = await prisma.sunatDocument.create({
            data: {
                orderId: order.id,
                clientId: client.id,
                documentType,
                serie,
                correlativo: newCorrelativo,
                fullNumber,
                subtotal,
                igv,
                total: order.totalAmount,
                status: 'DRAFT',
                provider: config.provider,
                items: {
                    create: order.items.map(item => {
                        const itemSubtotal = item.price / 1.18;
                        const itemIgv = item.price - itemSubtotal;
                        return {
                            descripcion: item.product?.name || 'Producto',
                            cantidad: item.quantity,
                            valorUnitario: itemSubtotal,
                            precioUnitario: item.price,
                            igv: itemIgv * item.quantity,
                            total: item.price * item.quantity
                        };
                    })
                }
            },
            include: {
                items: true,
                client: true
            }
        });

        // 8. Update correlativo
        await prisma.companySunatConfig.update({
            where: { id: 'default' },
            data: { [correlativoField]: newCorrelativo }
        });

        // 9. Prepare data for PSE
        const invoiceData: SunatInvoiceData = {
            documentType,
            serie,
            correlativo: newCorrelativo,
            fechaEmision: sunatDoc.fechaEmision,
            client: {
                tipoDoc: client.tipoDoc as any,
                numDoc: client.numDoc,
                razonSocial: client.razonSocial,
                direccion: client.direccion,
                email: client.email
            },
            items: sunatDoc.items.map(i => ({
                descripcion: i.descripcion,
                cantidad: i.cantidad,
                valorUnitario: i.valorUnitario,
                precioUnitario: i.precioUnitario,
                igv: i.igv
            })),
            subtotal: sunatDoc.subtotal,
            igv: sunatDoc.igv,
            total: sunatDoc.total,
            moneda: sunatDoc.moneda
        };

        // 10. Send to SUNAT via PSE
        let result;
        try {
            const provider = SunatProviderFactory.create(config);
            result = await provider.sendInvoice(invoiceData);
            console.log('[BillingAPI] PSE response:', result);

        } catch (error: any) {
            console.error('[BillingAPI] PSE error:', error);
            result = {
                status: 'PENDIENTE' as const,
                code: 'PSE_ERROR',
                message: error.message || 'Error al conectar con el proveedor de facturación'
            };
        }

        // 11. Update document with result
        const updatedDoc = await prisma.sunatDocument.update({
            where: { id: sunatDoc.id },
            data: {
                status: result.status,
                hash: result.hash,
                pdfUrl: result.pdfUrl,
                xmlUrl: result.xmlUrl,
                cdrUrl: result.cdrUrl,
                errorMessage: result.message
            },
            include: {
                items: true,
                client: true,
                order: true
            }
        });

        // 12. Add to sync queue
        try {
            const { SyncService } = await import('@/lib/sync-service');
            await SyncService.addToQueue('SunatDocument', updatedDoc.id, 'CREATE', updatedDoc);
            console.log('[BillingAPI] Added to sync queue');
        } catch (e) {
            console.error('[BillingAPI] Failed to add to sync queue:', e);
        }

        // 13. Create audit log
        await prisma.log.create({
            data: {
                action: 'SUNAT_EMISSION',
                details: `${documentType === '01' ? 'Factura' : 'Boleta'} ${fullNumber} - ${result.status} - Cliente: ${client.razonSocial}`
            }
        });

        return NextResponse.json({
            success: true,
            document: updatedDoc,
            result
        });

    } catch (error: any) {
        console.error('[BillingAPI] Error:', error);
        return NextResponse.json({
            error: error.message || 'Error al emitir el comprobante'
        }, { status: 500 });
    }
}
