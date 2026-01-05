export const API_BASE_URL = 'https://web-production-1e51d.up.railway.app';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ME: `${API_BASE_URL}/api/auth/me`,
  },
  BUSINESS: {
    CREATE: `${API_BASE_URL}/api/business`,
    LIST: `${API_BASE_URL}/api/business`,
    GET: (id: string) => `${API_BASE_URL}/api/business/${id}`,
  },
  DEVICE: {
    REGISTER: `${API_BASE_URL}/api/device/register`,
    CHECK: (fingerprint: string) => `${API_BASE_URL}/api/device/check/${fingerprint}`,
  },
  SYNC: {
    PUSH: `${API_BASE_URL}/api/sync`,
  },
  RECOVERY: {
    GET_DATA: `${API_BASE_URL}/api/recovery`,
    SYNC_CONFIG: `${API_BASE_URL}/api/recovery/sync`,
  }
};
