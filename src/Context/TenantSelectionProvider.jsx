import { createContext, useContext, useState, useEffect } from 'react';

const TenantSelectionContext = createContext();

export const TenantSelectionProvider = ({ children }) => {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load selected tenant from localStorage on mount
  useEffect(() => {
    const storedTenant = localStorage.getItem('selectedTenant');
    if (storedTenant) {
      try {
        setSelectedTenant(JSON.parse(storedTenant));
      } catch (error) {
        console.error('Error parsing stored tenant:', error);
        localStorage.removeItem('selectedTenant');
      }
    }
  }, []);

  // Update localStorage when selectedTenant changes
  useEffect(() => {
    if (selectedTenant) {
      localStorage.setItem('selectedTenant', JSON.stringify(selectedTenant));
    } else {
      localStorage.removeItem('selectedTenant');
    }
  }, [selectedTenant]);

  const selectTenant = (tenant) => {
    setSelectedTenant(tenant);
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