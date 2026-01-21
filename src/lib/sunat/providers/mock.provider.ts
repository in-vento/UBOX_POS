/**
 * Mock SUNAT Provider
 * 
 * This provider simulates SUNAT responses for testing and development.
 * It always returns ACEPTADO status after a short delay.
 */

import type { ISunatProvider, SunatInvoiceData, SunatResult } from '../types';

export class MockSunatProvider implements ISunatProvider {
    async sendInvoice(data: SunatInvoiceData): Promise<SunatResult> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('[MockSunatProvider] Simulating invoice emission:', {
            type: data.documentType,
            serie: data.serie,
            correlativo: data.correlativo,
            total: data.total
        });

        return {
            status: 'ACEPTADO',
            code: '0',
            message: 'Documento aceptado por SUNAT (MOCK)',
            hash: `MOCK-HASH-${Date.now()}`,
            pdfUrl: `mock://pdf/${data.serie}-${data.correlativo}`,
            xmlUrl: `mock://xml/${data.serie}-${data.correlativo}`,
            cdrUrl: `mock://cdr/${data.serie}-${data.correlativo}`
        };
    }

    async sendCreditNote(data: SunatInvoiceData): Promise<SunatResult> {
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('[MockSunatProvider] Simulating credit note emission:', {
            type: data.documentType,
            serie: data.serie,
            correlativo: data.correlativo
        });

        return {
            status: 'ACEPTADO',
            code: '0',
            message: 'Nota de crédito aceptada (MOCK)',
            hash: `MOCK-HASH-NC-${Date.now()}`,
            pdfUrl: `mock://pdf/${data.serie}-${data.correlativo}`,
            xmlUrl: `mock://xml/${data.serie}-${data.correlativo}`,
            cdrUrl: `mock://cdr/${data.serie}-${data.correlativo}`
        };
    }

    async getDocumentStatus(serie: string, correlativo: number): Promise<SunatResult> {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            status: 'ACEPTADO',
            code: '0',
            message: 'Documento encontrado (MOCK)'
        };
    }
}
