/**
 * SUNAT Provider Factory
 * 
 * This factory creates the appropriate SUNAT provider based on configuration.
 * It allows switching between providers without code changes.
 */

import type { ISunatProvider, CompanySunatConfig } from './types';
import { MockSunatProvider } from './providers/mock.provider';
import { NubefactProvider } from './providers/nubefact.provider';

export class SunatProviderFactory {
    /**
     * Create a SUNAT provider instance based on configuration
     */
    static create(config: CompanySunatConfig): ISunatProvider {
        console.log(`[SunatProviderFactory] Creating provider: ${config.provider}`);

        switch (config.provider) {
            case 'nubefact':
                if (!config.pseToken || !config.pseRucUsuario) {
                    throw new Error('Nubefact requires pseToken and pseRucUsuario in configuration');
                }

                return new NubefactProvider({
                    url: config.pseUrl || 'https://api.nubefact.com/api/v1',
                    token: config.pseToken,
                    rucUsuario: config.pseRucUsuario
                });

            case 'efact':
                // TODO: Implement EfactProvider
                throw new Error('Efact provider not implemented yet. Use "mock" or "nubefact".');

            case 'bizlinks':
                // TODO: Implement BizlinksProvider
                throw new Error('Bizlinks provider not implemented yet. Use "mock" or "nubefact".');

            case 'digiflow':
                // TODO: Implement DigiflowProvider
                throw new Error('Digiflow provider not implemented yet. Use "mock" or "nubefact".');

            case 'mock':
            default:
                return new MockSunatProvider();
        }
    }

    /**
     * Get list of available providers
     */
    static getAvailableProviders(): Array<{ value: string; label: string; available: boolean }> {
        return [
            { value: 'mock', label: 'Mock (Pruebas)', available: true },
            { value: 'nubefact', label: 'Nubefact', available: true },
            { value: 'efact', label: 'Efact', available: false },
            { value: 'bizlinks', label: 'Bizlinks', available: false },
            { value: 'digiflow', label: 'Digiflow', available: false }
        ];
    }
}
