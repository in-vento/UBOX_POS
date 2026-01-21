import { API_ENDPOINTS } from './api-config';
import { getHWID } from './license';

export interface LicenseStatus {
  success: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'UNAUTHORIZED_DEVICE' | 'LIMIT_EXCEEDED' | 'ERROR';
  message?: string;
  expiry?: string;
  serverTime?: string;
}

export class LicenseService {
  private static CACHE_KEY = 'cloud_license_cache';

  /**
   * Verifies the license against the cloud backend.
   * Includes security measures like HWID and server-side time validation.
   */
  static async verifyCloudLicense(): Promise<LicenseStatus> {
    const businessId = localStorage.getItem('business_id');
    const token = localStorage.getItem('cloud_token');

    if (!businessId || !token) {
      return { success: false, status: 'ERROR', message: 'No se encontró información de negocio o sesión.' };
    }

    try {
      const fingerprint = await getHWID();
      const endpoint = `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/license/verify`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Business-Id': businessId,
          'X-Device-Fingerprint': fingerprint
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Cache the successful verification
        this.cacheLicense(result.data);
        return {
          success: true,
          status: 'ACTIVE',
          expiry: result.data.expiry,
          serverTime: result.data.serverTime
        };
      } else {
        return {
          success: false,
          status: result.status || 'ERROR',
          message: result.message || 'Error al verificar la licencia.'
        };
      }
    } catch (error) {
      console.error('[LicenseService] Verification failed:', error);
      
      // Try to use cached license if offline
      return this.checkCachedLicense();
    }
  }

  /**
   * Caches the license status locally for offline access (limited time).
   */
  private static cacheLicense(data: any) {
    const cacheData = {
      ...data,
      cachedAt: new Date().toISOString()
    };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
  }

  /**
   * Checks the local cache for a valid license.
   * Allows the app to work offline for up to 7 days if previously verified.
   */
  private static checkCachedLicense(): LicenseStatus {
    const cache = localStorage.getItem(this.CACHE_KEY);
    if (!cache) {
      return { success: false, status: 'ERROR', message: 'Sin conexión y sin licencia en caché.' };
    }

    try {
      const data = JSON.parse(cache);
      const cachedAt = new Date(data.cachedAt);
      const expiry = data.expiry ? new Date(data.expiry) : null;
      const now = new Date();

      // 1. Check if cache is too old (max 7 days offline)
      const daysSinceCache = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCache > 7) {
        return { success: false, status: 'ERROR', message: 'Se requiere conexión a internet para validar la licencia.' };
      }

      // 2. Check if license has expired
      if (expiry && expiry < now) {
        return { success: false, status: 'EXPIRED', message: 'Tu licencia ha expirado.' };
      }

      return {
        success: true,
        status: 'ACTIVE',
        expiry: data.expiry,
        message: 'Operando con licencia en caché (Offline).'
      };
    } catch (e) {
      return { success: false, status: 'ERROR', message: 'Error al leer la licencia local.' };
    }
  }

  /**
   * Generates a new license for a business
   */
  static async generateLicense(planType: string, businessData: any): Promise<{
    success: boolean;
    licenseKey?: string;
    message: string;
  }> {
    try {
      const businessId = localStorage.getItem('business_id');
      const token = localStorage.getItem('cloud_token');

      const response = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          businessId,
          planType,
          ...businessData,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          licenseKey: result.data.licenseKey,
          message: 'Licencia generada exitosamente'
        };
      } else {
        return {
          success: false,
          message: result.error?.message || 'Error al generar licencia'
        };
      }
    } catch (error) {
      console.error('License generation error:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Gets stored license from cache
   */
  static getStoredLicense(): any | null {
    const cache = localStorage.getItem(this.CACHE_KEY);
    return cache ? JSON.parse(cache) : null;
  }

  /**
   * Clears stored license cache
   */
  static clearStoredLicense(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }
}
