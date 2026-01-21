/**
 * SUNAT Electronic Billing - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the SUNAT module.
 */

export interface SunatResult {
    status: 'ACEPTADO' | 'RECHAZADO' | 'PENDIENTE';
    code?: string;
    message?: string;
    pdfUrl?: string;
    xmlUrl?: string;
    cdrUrl?: string;
    hash?: string;
}

export interface SunatClientData {
    tipoDoc: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
    numDoc: string;
    razonSocial: string;
    direccion?: string;
    email?: string;
}

export interface SunatDocumentItem {
    descripcion: string;
    cantidad: number;
    valorUnitario: number;  // Price without IGV
    precioUnitario: number; // Price with IGV
    igv: number;
}

export interface SunatInvoiceData {
    documentType: '01' | '03' | '07' | '08'; // 01=Factura, 03=Boleta, 07=Nota Crédito, 08=Nota Débito
    serie: string;
    correlativo: number;
    fechaEmision: Date;
    client: SunatClientData;
    items: SunatDocumentItem[];
    subtotal: number;
    igv: number;
    total: number;
    moneda: string;
}

export interface ISunatProvider {
    /**
     * Send an invoice or boleta to SUNAT via PSE
     */
    sendInvoice(data: SunatInvoiceData): Promise<SunatResult>;

    /**
     * Send a credit note to SUNAT via PSE
     */
    sendCreditNote(data: SunatInvoiceData): Promise<SunatResult>;

    /**
     * Get the status of a previously sent document
     */
    getDocumentStatus(serie: string, correlativo: number): Promise<SunatResult>;
}

export interface SunatProviderConfig {
    provider: 'mock' | 'nubefact' | 'efact' | 'bizlinks' | 'digiflow';
    url?: string;
    token?: string;
    rucUsuario?: string;
}

export interface CompanySunatConfig {
    id: string;
    sunatEnabled: boolean;
    provider: string;
    ruc?: string;
    razonSocial?: string;
    nombreComercial?: string;
    direccion?: string;
    ubigeo?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    regimen?: string;
    serieFactura: string;
    serieBoleta: string;
    correlativoFactura: number;
    correlativoBoleta: number;
    pseToken?: string;
    pseUrl?: string;
    pseRucUsuario?: string;
    updatedAt: Date;
}
