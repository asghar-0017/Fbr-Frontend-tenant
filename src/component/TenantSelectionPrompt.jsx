import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthProvider';
import { useTenantSelection } from '../Context/TenantSelectionProvider';
import { CircularProgress, Box } from '@mui/material';

const TenantSelectionPrompt = ({ children }) => {
  const { user } = useAuth();
  const { isTenantSelected } = useTenantSelection();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is admin and no tenant is selected, redirect to tenant management
    if (user?.role === 'admin' && !isTenantSelected()) {
      navigate('/tenant-management');
    }
  }, [user, isTenantSelected, navigate]);

  // If user is not admin or tenant is selected, render children
  if (user?.role !== 'admin' || isTenantSelected()) {
    return children;
  }

  // Show loading while redirecting
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '50vh' 
    }}>
      <CircularProgress />
    </Box>
  );
};

export default TenantSelectionPrompt; 