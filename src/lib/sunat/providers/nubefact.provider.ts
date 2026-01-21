/**
 * Nubefact SUNAT Provider
 * 
 * This provider integrates with Nubefact API for real SUNAT electronic billing.
 * Documentation: https://nubefact.com/documentacion
 */

import axios, { AxiosError } from 'axios';
import type { ISunatProvider, SunatInvoiceData, SunatResult } from '../types';

interface NubefactConfig {
    url: string;
    token: string;
    rucUsuario: string;
}

interface NubefactResponse {
    aceptada_por_sunat?: boolean;
    sunat_description?: string;
    sunat_note?: string;
    sunat_responsecode?: string;
    sunat_soap_error?: string;
    pdf_zip_base64?: string;
    xml_zip_base64?: string;
    cdr_zip_base64?: string;
    hash?: string;
    enlace_del_pdf?: string;
    enlace_del_xml?: string;
    enlace_del_cdr?: string;
    codigo_sunat?: string;
    mensaje_sunat?: string;
    errors?: string;
}

export class NubefactProvider implements ISunatProvider {
    private baseUrl: string;
    private token: string;
    private rucUsuario: string;

    constructor(config: NubefactConfig) {
        this.baseUrl = config.url || 'https://api.nubefact.com/api/v1';
        this.token = config.token;
        this.rucUsuario = config.rucUsuario;
    }

    async sendInvoice(data: SunatInvoiceData): Promise<SunatResult> {
        try {
            const payload = this.transformToNubefactFormat(data);

            console.log('[NubefactProvider] Sending invoice to Nubefact:', {
                type: data.documentType,
                serie: data.serie,
                correlativo: data.correlativo
            });

            const response = await axios.post<NubefactResponse>(
                `${this.baseUrl}/invoice`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 seconds
                }
            );

            return this.normalizeNubefactResponse(response.data);

        } catch (error) {
            return this.handleError(error);
        }
    }

    async sendCreditNote(data: SunatInvoiceData): Promise<SunatResult> {
        // Credit notes use the same endpoint with different document type
        return this.sendInvoice(data);
    }

    async getDocumentStatus(serie: string, correlativo: number): Promise<SunatResult> {
        try {
            const response = await axios.get<NubefactResponse>(
                `${this.baseUrl}/consulta/${serie}-${correlativo}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                }
            );

            return this.normalizeNubefactResponse(response.data);

        } catch (error) {
            return this.handleError(error);
        }
    }

    private transformToNubefactFormat(data: SunatInvoiceData): any {
        const documentTypeMap: Record<string, number> = {
            '01': 1, // Factura
            '03': 2, // Boleta
            '07': 7, // Nota de Crédito
            '08': 8  // Nota de Débito
        };

        return {
            operacion: 'generar_comprobante',
            tipo_de_comprobante: documentTypeMap[data.documentType] || 2,
            serie: data.serie,
            numero: data.correlativo,
            sunat_transaction: 1, // Send to SUNAT
            cliente_tipo_de_documento: this.getClientDocTypeCode(data.client.tipoDoc),
            cliente_numero_de_documento: data.client.numDoc,
            cliente_denominacion: data.client.razonSocial,
            cliente_direccion: data.client.direccion || '',
            cliente_email: data.client.email || '',
            fecha_de_emision: this.formatDate(data.fechaEmision),
            moneda: data.moneda,
            tipo_de_cambio: '',
            porcentaje_de_igv: 18.00,
            total_gravada: data.subtotal,
            total_igv: data.igv,
            total: data.total,
            enviar_automaticamente_a_la_sunat: true,
            enviar_automaticamente_al_cliente: false,
            items: data.items.map((item, index) => ({
                unidad_de_medida: 'NIU', // Unidad
                codigo: `ITEM${String(index + 1).padStart(3, '0')}`,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                valor_unitario: item.valorUnitario,
                precio_unitario: item.precioUnitario,
                subtotal: item.cantidad * item.valorUnitario,
                tipo_de_igv: 1, // Gravado - Operación Onerosa
                igv: item.igv,
                total: item.cantidad * item.precioUnitario,
                anticipo_regularizacion: false
            }))
        };
    }

    private normalizeNubefactResponse(response: NubefactResponse): SunatResult {
        if (response.aceptada_por_sunat) {
            return {
                status: 'ACEPTADO',
                code: response.codigo_sunat || response.sunat_responsecode || '0',
                message: response.mensaje_sunat || response.sunat_description || 'Aceptado por SUNAT',
                hash: response.hash,
                pdfUrl: response.enlace_del_pdf,
                xmlUrl: response.enlace_del_xml,
                cdrUrl: response.enlace_del_cdr
            };
        } else {
            return {
                status: 'RECHAZADO',
                code: response.codigo_sunat || response.sunat_responsecode || 'ERROR',
                message: response.mensaje_sunat || response.sunat_description || response.errors || 'Error desconocido'
            };
        }
    }

    private handleError(error: unknown): SunatResult {
        console.error('[NubefactProvider] Error:', error);

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<NubefactResponse>;

            if (axiosError.response?.data) {
                return this.normalizeNubefactResponse(axiosError.response.data);
            }

            if (axiosError.code === 'ECONNABORTED') {
                return {
                    status: 'PENDIENTE',
                    code: 'TIMEOUT',
                    message: 'Tiempo de espera agotado. El documento se reintentará automáticamente.'
                };
            }

            if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
                return {
                    status: 'PENDIENTE',
                    code: 'NETWORK_ERROR',
                    message: 'No se pudo conectar con Nubefact. Verifique su conexión a internet.'
                };
            }
        }

        return {
            status: 'RECHAZADO',
            code: 'UNKNOWN_ERROR',
            message: error instanceof Error ? error.message : 'Error desconocido al procesar el documento'
        };
    }

    private getClientDocTypeCode(tipoDoc: string): string {
        const map: Record<string, string> = {
            'DNI': '1',
            'RUC': '6',
            'CE': '4',
            'PASAPORTE': '7'
        };
        return map[tipoDoc] || '1';
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
