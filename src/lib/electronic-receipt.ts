/**
 * Electronic Receipt Builder for SUNAT
 * 
 * This module extends the printer library with SUNAT-compliant electronic receipt generation.
 */

import { ESC, GS, LF, COMMANDS } from './printer';

/**
 * Build Electronic Receipt Data (SUNAT Compliant)
 * 
 * Generates a thermal printer receipt for electronic documents (Facturas/Boletas)
 * with QR code, legal text, and hash as required by SUNAT.
 */
export function buildElectronicReceiptData(
    document: any,
    companyData: any,
    order: any,
    cashierName: string,
    paymentDetails?: { tendered: number, change: number, operationCode?: string }
): string {
    let buffer = '';

    // Helper to append text
    const add = (text: string) => { buffer += text; };
    const addLine = (text: string = '') => { buffer += text + LF; };

    // Init
    add(COMMANDS.INIT);

    // Header - Company Info
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine(companyData.nombreComercial || companyData.razonSocial || 'UBOX POS');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine(companyData.razonSocial || '');
    addLine(`RUC: ${companyData.ruc || ''}`);
    addLine(companyData.direccion || '');
    if (companyData.departamento && companyData.provincia && companyData.distrito) {
        addLine(`${companyData.distrito} - ${companyData.provincia} - ${companyData.departamento}`);
    }
    addLine('================================');

    // Document Type Header
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    const docTypeName = document.documentType === '01' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
    addLine(docTypeName);
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine(document.fullNumber);
    addLine('================================');

    // Client Info
    add(COMMANDS.ALIGN.LEFT);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine('DATOS DEL CLIENTE');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    if (document.client) {
        addLine(`${document.client.tipoDoc}: ${document.client.numDoc}`);
        addLine(`Nombre: ${document.client.razonSocial}`);
        if (document.client.direccion) {
            addLine(`Dirección: ${document.client.direccion}`);
        }
    }
    addLine('--------------------------------');

    // Order Info
    addLine(`Fecha: ${new Date(document.fechaEmision).toLocaleString('es-PE')}`);
    addLine(`Orden: ${order.customId || order.id.slice(-6)}`);
    addLine(`Cajero: ${cashierName}`);
    addLine('--------------------------------');

    // Items
    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine('DETALLE');
    add(COMMANDS.TEXT_FORMAT.NORMAL);

    if (document.items && document.items.length > 0) {
        document.items.forEach((item: any) => {
            // Item name
            addLine(`${item.cantidad}x ${item.descripcion}`);

            // Price breakdown
            add(COMMANDS.ALIGN.LEFT);
            add(`  Valor Unit: S/ ${item.valorUnitario.toFixed(2)}`);
            add(COMMANDS.ALIGN.RIGHT);
            addLine(`S/ ${(item.cantidad * item.valorUnitario).toFixed(2)}`);
            add(COMMANDS.ALIGN.LEFT);
        });
    }
    addLine('--------------------------------');

    // Totals
    add(COMMANDS.ALIGN.LEFT);
    add('OP. GRAVADA:');
    add(COMMANDS.ALIGN.RIGHT);
    addLine(`S/ ${document.subtotal.toFixed(2)}`);

    add(COMMANDS.ALIGN.LEFT);
    add('IGV (18%):');
    add(COMMANDS.ALIGN.RIGHT);
    addLine(`S/ ${document.igv.toFixed(2)}`);

    add(COMMANDS.ALIGN.LEFT);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    add('TOTAL:');
    add(COMMANDS.ALIGN.RIGHT);
    add(COMMANDS.TEXT_FORMAT.DOUBLE_HEIGHT);
    addLine(`S/ ${document.total.toFixed(2)}`);
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    add(COMMANDS.ALIGN.LEFT);

    addLine('--------------------------------');

    // Payment Details
    if (paymentDetails) {
        const isYapePlin = paymentDetails.operationCode && paymentDetails.operationCode.length > 0;

        add(COMMANDS.ALIGN.LEFT);
        add(isYapePlin ? 'Yape / Plin:' : 'Efectivo:');
        add(COMMANDS.ALIGN.RIGHT);
        addLine(`S/ ${paymentDetails.tendered.toFixed(2)}`);

        if (!isYapePlin && paymentDetails.change > 0) {
            add(COMMANDS.ALIGN.LEFT);
            add('Vuelto:');
            add(COMMANDS.ALIGN.RIGHT);
            addLine(`S/ ${paymentDetails.change.toFixed(2)}`);
        }

        if (isYapePlin) {
            add(COMMANDS.ALIGN.LEFT);
            add('N° Operación:');
            add(COMMANDS.ALIGN.RIGHT);
            addLine(paymentDetails.operationCode || '');
        }

        addLine('--------------------------------');
    }

    // QR Code
    if (document.hash && companyData.ruc) {
        add(COMMANDS.ALIGN.CENTER);
        addLine('');

        // Generate QR code text
        const { generateSunatQRText, getClientDocTypeCode } = require('./sunat/qr-generator');
        const qrText = generateSunatQRText({
            ruc: companyData.ruc,
            tipoDoc: document.documentType,
            serie: document.serie,
            numero: document.correlativo,
            igv: document.igv,
            total: document.total,
            fecha: new Date(document.fechaEmision),
            tipoDocCliente: getClientDocTypeCode(document.client?.tipoDoc || 'DNI'),
            numDocCliente: document.client?.numDoc || '',
            hash: document.hash
        });

        // Add QR code commands (ESC/POS)
        // Set QR code model
        add(GS + '(k' + '\x04\x00' + '\x31\x41' + '\x32\x00');

        // Set QR code size (module size 8)
        add(GS + '(k' + '\x03\x00' + '\x31\x43' + '\x08');

        // Set error correction level M
        add(GS + '(k' + '\x03\x00' + '\x31\x45' + '\x31');

        // Store QR code data
        const qrDataLength = qrText.length + 3;
        add(GS + '(k' + String.fromCharCode(qrDataLength & 0xFF, (qrDataLength >> 8) & 0xFF) + '\x31\x50\x30' + qrText);

        // Print QR code
        add(GS + '(k' + '\x03\x00' + '\x31\x51\x30');

        addLine('');
        addLine('');
    }

    // Legal Text
    add(COMMANDS.ALIGN.CENTER);
    add(COMMANDS.TEXT_FORMAT.BOLD);
    addLine('REPRESENTACIÓN IMPRESA');
    addLine('DEL COMPROBANTE ELECTRÓNICO');
    add(COMMANDS.TEXT_FORMAT.NORMAL);
    addLine('');
    addLine('Consulte su comprobante en:');
    addLine('www.sunat.gob.pe');

    if (document.hash) {
        addLine('');
        addLine('Hash:');
        add(COMMANDS.TEXT_FORMAT.NORMAL);
        // Print hash in chunks for readability
        const hash = document.hash;
        const chunkSize = 32;
        for (let i = 0; i < hash.length; i += chunkSize) {
            addLine(hash.substring(i, i + chunkSize));
        }
    }

    addLine('');
    addLine('================================');

    // Status Badge
    if (document.status === 'ACEPTADO') {
        add(COMMANDS.TEXT_FORMAT.BOLD);
        addLine('✓ ACEPTADO POR SUNAT');
        add(COMMANDS.TEXT_FORMAT.NORMAL);
    } else if (document.status === 'PENDIENTE') {
        addLine('⏳ PENDIENTE DE ENVÍO');
    }

    addLine('');
    addLine('¡Gracias por su preferencia!');
    addLine(LF + LF + LF); // Feed

    // Cut
    add(COMMANDS.CUT);

    return buffer;
}
