export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
  },
  
  // Licenses
  LICENSES: {
    GENERATE: '/api/licenses/generate',
    VERIFY: '/api/licenses/verify',
    LIST: '/api/licenses',
  },
  
  // Devices
  DEVICE: {
    REGISTER: '/api/devices',
    LIST: '/api/devices',
    CHECK: (fingerprint: string) => `/api/devices/check/${fingerprint}`,
    APPROVE: (id: string) => `/api/devices/${id}/approve`,
    REJECT: (id: string) => `/api/devices/${id}/reject`,
  },
  
  // Business
  BUSINESS: {
    REGISTER: '/api/business/register',
    LIST: '/api/business',
    GET: (id: string) => `/api/business/${id}`,
  },
  
  // Users
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
  },
  
  // System
  SYSTEM: {
    CONFIG: '/api/system/config',
    HEALTH: '/api/system/health',
  },
};