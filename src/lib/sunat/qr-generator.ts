/**
 * SUNAT QR Code Generator
 * 
 * Generates QR codes compliant with SUNAT requirements for electronic documents.
 * Format: RUC|TIPO_DOC|SERIE|NUMERO|IGV|TOTAL|FECHA|TIPO_DOC_CLIENTE|NUM_DOC_CLIENTE|HASH
 */

export interface SunatQRData {
    ruc: string;
    tipoDoc: '01' | '03' | '07' | '08'; // 01=Factura, 03=Boleta, 07=NC, 08=ND
    serie: string;
    numero: number;
    igv: number;
    total: number;
    fecha: Date;
    tipoDocCliente: string; // 1=DNI, 6=RUC, 4=CE, 7=PASAPORTE
    numDocCliente: string;
    hash?: string;
}

/**
 * Generate SUNAT-compliant QR code text
 */
export function generateSunatQRText(data: SunatQRData): string {
    const {
        ruc,
        tipoDoc,
        serie,
        numero,
        igv,
        total,
        fecha,
        tipoDocCliente,
        numDocCliente,
        hash
    } = data;

    // Format date as YYYY-MM-DD
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${year}-${month}-${day}`;

    // Format amounts with 2 decimals
    const igvStr = igv.toFixed(2);
    const totalStr = total.toFixed(2);

    // Build QR text according to SUNAT specification
    const parts = [
        ruc,
        tipoDoc,
        serie,
        String(numero),
        igvStr,
        totalStr,
        fechaStr,
        tipoDocCliente,
        numDocCliente
    ];

    // Add hash if available
    if (hash) {
        parts.push(hash);
    }

    return parts.join('|');
}

/**
 * Generate QR code as ASCII art for thermal printer
 * This is a simplified version - in production, use a proper QR library
 */
export function generateQRCodeASCII(text: string): string {
    // For thermal printers, we'll use ESC/POS QR code commands
    // This is a placeholder - actual implementation would use proper ESC/POS commands

    const ESC = '\x1b';
    const GS = '\x1d';

    // QR Code commands for ESC/POS printers
    // GS ( k pL pH cn fn n1 n2 [parameters]

    const qrCommands = [
        // Set QR code model
        GS + '(k' + '\x04\x00' + '\x31\x41' + '\x32\x00',

        // Set QR code size (module size)
        GS + '(k' + '\x03\x00' + '\x31\x43' + '\x08', // Size 8

        // Set error correction level (L=48, M=49, Q=50, H=51)
        GS + '(k' + '\x03\x00' + '\x31\x45' + '\x31', // Level M

        // Store QR code data
        GS + '(k' + String.fromCharCode(text.length + 3, 0) + '\x31\x50\x30' + text,

        // Print QR code
        GS + '(k' + '\x03\x00' + '\x31\x51\x30'
    ];

    return qrCommands.join('');
}

/**
 * Map client document type to SUNAT code
 */
export function getClientDocTypeCode(tipoDoc: string): string {
    const map: Record<string, string> = {
        'DNI': '1',
        'RUC': '6',
        'CE': '4',
        'PASAPORTE': '7'
    };
    return map[tipoDoc] || '1';
}
