import { createContext, useContext, useState, useEffect } from 'react';
import { updateTokenManager, api } from '../API/Api';

const TenantSelectionContext = createContext();

export const TenantSelectionProvider = ({ children }) => {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokensLoaded, setTokensLoaded] = useState(false);

  // Load selected tenant from localStorage on mount and fetch tokens if needed
  useEffect(() => {
    const loadStoredTenant = async () => {
      const storedTenant = localStorage.getItem('selectedTenant');
      if (storedTenant) {
        try {
          const tenant = JSON.parse(storedTenant);
          console.log('TenantSelectionProvider: Loading stored tenant:', tenant);
          
          // Set tenant immediately with null tokens
          setSelectedTenant({
            ...tenant,
            sandboxTestToken: null
          });
          
          // Fetch tokens for the stored tenant
          try {
            console.log('TenantSelectionProvider: Fetching tokens for stored tenant:', tenant.tenant_id);
            const response = await api.get(`/admin/tenants/${tenant.tenant_id}`);
            if (response.data.success) {
              const tenantWithTokens = response.data.data;
              console.log('TenantSelectionProvider: Received tenant with tokens:', tenantWithTokens);
              setSelectedTenant(tenantWithTokens);
            }
          } catch (error) {
            console.error('Error fetching tokens for stored tenant:', error);
            // Keep the tenant without tokens if we can't fetch them
          }
        } catch (error) {
          console.error('Error parsing stored tenant:', error);
          localStorage.removeItem('selectedTenant');
        }
      }
    };
    
    loadStoredTenant();
  }, []);

  // Update localStorage when selectedTenant changes (but exclude tokens)
  useEffect(() => {
    if (selectedTenant) {
      // Store tenant data without sensitive tokens in localStorage
      const { sandboxTestToken, ...tenantData } = selectedTenant;
      localStorage.setItem('selectedTenant', JSON.stringify(tenantData));
    } else {
      localStorage.removeItem('selectedTenant');
    }
  }, [selectedTenant]);

  // Secure token getters - tokens are only stored in context, not localStorage
  const getSandboxToken = () => {
    return selectedTenant?.sandboxTestToken || null;
  };

  const getProductionToken = () => {
    return selectedTenant?.sandboxTestToken || null; // Use test token for both sandbox and production
  };

  const getCurrentToken = (environment = 'sandbox') => {
    // Always use sandbox test token regardless of environment
    return getSandboxToken();
  };

  // Register token manager with API configuration
  useEffect(() => {
    console.log('TenantSelectionProvider: Updating token manager with selectedTenant:', selectedTenant);
    updateTokenManager({
      getSandboxToken,
      getProductionToken,
      getCurrentToken
    });
  }, [selectedTenant]);

  const selectTenant = async (tenant) => {
    try {
      console.log('TenantSelectionProvider: Selecting tenant:', tenant);
      // If the tenant doesn't have the test token, fetch it from the server
      if (!tenant.sandboxTestToken) {
        console.log('TenantSelectionProvider: Fetching tokens for tenant:', tenant.tenant_id);
        const response = await api.get(`/admin/tenants/${tenant.tenant_id}`);
        if (response.data.success) {
          const tenantWithTokens = response.data.data;
          console.log('TenantSelectionProvider: Received tenant with tokens:', tenantWithTokens);
          setSelectedTenant(tenantWithTokens);
        } else {
          // If we can't fetch tokens, still set the tenant but with null tokens
          console.log('TenantSelectionProvider: Failed to fetch tokens, setting tenant without tokens');
          setSelectedTenant(tenant);
        }
      } else {
        console.log('TenantSelectionProvider: Tenant already has tokens, setting directly');
        setSelectedTenant(tenant);
      }
    } catch (error) {
      console.error('Error fetching tenant tokens:', error);
      // If there's an error, still set the tenant but with null tokens
      setSelectedTenant(tenant);
    }
  };

  const clearSelectedTenant = () => {
    setSelectedTenant(null);
  };

  const isTenantSelected = () => {
    return selectedTenant !== null;
  };

  const getSelectedTenantId = () => {
    return selectedTenant?.tenant_id;
  };

  const getSelectedTenantName = () => {
    return selectedTenant?.sellerBusinessName;
  };

  return (
    <TenantSelectionContext.Provider
      value={{
        selectedTenant,
        selectTenant,
        clearSelectedTenant,
        isTenantSelected,
        getSelectedTenantId,
        getSelectedTenantName,
        getSandboxToken,
        getProductionToken,
        getCurrentToken,
        loading,
        setLoading
      }}
    >
      {children}
    </TenantSelectionContext.Provider>
  );
};

export const useTenantSelection = () => {
  const context = useContext(TenantSelectionContext);
  if (!context) {
    throw new Error('useTenantSelection must be used within a TenantSelectionProvider');
  }
  return context;
}; 