import axios from "axios";

// Create a token manager that will be updated by the context
let tokenManager = {
  getSandboxToken: () => null,
  getProductionToken: () => null,
  getCurrentToken: (environment = "sandbox") => null,
};

// Function to update token manager from context
export const updateTokenManager = (manager) => {
  console.log("API: Updating token manager with:", manager);
  tokenManager = manager;
};

const API_CONFIG = {
  apiKey: import.meta.env.VITE_SERVER_API || "/api",
  apiKeyLocal: import.meta.env.VITE_SERVER_API_LOCAL || "/api",
  get sandBoxTestToken() {
    const token = tokenManager.getSandboxToken();
    console.log("API_CONFIG: sandBoxTestToken =", token);
    return token;
  },
  get productionToken() {
    const token = tokenManager.getProductionToken();
    console.log("API_CONFIG: productionToken =", token);
    return token;
  },
  getCurrentToken(environment = "sandbox") {
    const token = tokenManager.getCurrentToken(environment);
    console.log("API_CONFIG: getCurrentToken(", environment, ") =", token);
    return token;
  },
};

const api = axios.create({
  baseURL: API_CONFIG.apiKeyLocal,
  // You can add headers or other config here if needed
});

// Add request interceptor to include auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("token");
    const tenantToken = localStorage.getItem("tenantToken");
    const tenantId = localStorage.getItem("tenantId");
    const selectedTenant = localStorage.getItem("selectedTenant");

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
        config.headers["X-Tenant-ID"] = tenant.tenant_id;
      } catch (error) {
        console.error("Error parsing selected tenant:", error);
      }
    } else if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Utility function to get current token state for debugging
export const getCurrentTokenState = () => {
  const selectedTenant = localStorage.getItem("selectedTenant");

  return {
    selectedTenant: selectedTenant ? JSON.parse(selectedTenant) : null,
    sandBoxTestToken: API_CONFIG.sandBoxTestToken,
    productionToken: API_CONFIG.productionToken,
    currentSandboxToken: tokenManager.getSandboxToken(),
    currentProductionToken: tokenManager.getProductionToken(),
  };
};

export { API_CONFIG, api };
