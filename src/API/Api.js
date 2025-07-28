import axios from 'axios';

const API_CONFIG = {
  apiKey: import.meta.env.VITE_SERVER_API || '/api',
  apiKeyLocal: import.meta.env.VITE_SERVER_API_LOCAL || '/api',
  sandBoxTestToken: '63f756ee-69e4-3b5b-a3b7-0b8656624912'
  // sandBoxTestToken: '2ad94ba1-3c8d-34ae-9f28-2f6e7bc86545'
};

const api = axios.create({
  baseURL: API_CONFIG.apiKeyLocal,
  // You can add headers or other config here if needed
});

// Add request interceptor to include auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('token');
    const tenantToken = localStorage.getItem('tenantToken');
    const tenantId = localStorage.getItem('tenantId');
    const selectedTenant = localStorage.getItem('selectedTenant');
    
    // Use tenant token if available, otherwise use admin token
    if (tenantToken) {
      config.headers.Authorization = `Bearer ${tenantToken}`;
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    
    // For admin users, use selected tenant ID if available
    if (selectedTenant) {
      try {
        const tenant = JSON.parse(selectedTenant);
        config.headers['X-Tenant-ID'] = tenant.tenant_id;
      } catch (error) {
        console.error('Error parsing selected tenant:', error);
      }
    } else if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { API_CONFIG, api };
