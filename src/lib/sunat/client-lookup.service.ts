/**
 * Client Lookup Service
 * 
 * This service provides DNI and RUC lookup functionality.
 * It includes fallback to manual entry if external APIs fail.
 */

export interface ClientData {
    tipoDoc: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
    numDoc: string;
    razonSocial: string;
    direccion?: string;
    email?: string;
}

export interface IClientLookupService {
    lookupDNI(dni: string): Promise<ClientData | null>;
    lookupRUC(ruc: string): Promise<ClientData | null>;
}

/**
 * Mock Lookup Service for testing
 */
export class MockLookupService implements IClientLookupService {
    async lookupDNI(dni: string): Promise<ClientData | null> {
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('[MockLookupService] Looking up DNI:', dni);

        return {
            tipoDoc: 'DNI',
            numDoc: dni,
            razonSocial: `Cliente ${dni}`,
            direccion: 'Av. Ejemplo 123, Lima'
        };
    }

    async lookupRUC(ruc: string): Promise<ClientData | null> {
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('[MockLookupService] Looking up RUC:', ruc);

        return {
            tipoDoc: 'RUC',
            numDoc: ruc,
            razonSocial: `Empresa ${ruc} S.A.C.`,
            direccion: 'Jr. Comercio 456, Lima'
        };
    }
}

/**
 * External API Lookup Service
 * 
 * This service calls external APIs (RENIEC for DNI, SUNAT for RUC).
 * Falls back to null if the API fails, allowing manual entry.
 */
export class ExternalApiLookupService implements IClientLookupService {
    async lookupDNI(dni: string): Promise<ClientData | null> {
        try {
            // TODO: Integrate with RENIEC API or third-party service
            // Example: https://dniruc.apisperu.com/api/v1/dni/{dni}?token=YOUR_TOKEN

            console.log('[ExternalApiLookupService] DNI lookup not implemented, falling back to manual');
            return null;

        } catch (error) {
            console.error('[ExternalApiLookupService] DNI lookup failed:', error);
            return null;
        }
    }

    async lookupRUC(ruc: string): Promise<ClientData | null> {
        try {
            // TODO: Integrate with SUNAT API or third-party service
            // Example: https://dniruc.apisperu.com/api/v1/ruc/{ruc}?token=YOUR_TOKEN

            console.log('[ExternalApiLookupService] RUC lookup not implemented, falling back to manual');
            return null;

        } catch (error) {
            console.error('[ExternalApiLookupService] RUC lookup failed:', error);
            return null;
        }
    }
}

/**
 * Client Lookup Factory
 */
export class ClientLookupFactory {
    static create(useMock: boolean = true): IClientLookupService {
        if (useMock) {
            return new MockLookupService();
        } else {
            return new ExternalApiLookupService();
        }
    }
}
