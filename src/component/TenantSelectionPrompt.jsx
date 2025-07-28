import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthProvider';
import { useTenantSelection } from '../Context/TenantSelectionProvider';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Container
} from '@mui/material';
import {
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const TenantSelectionPrompt = ({ children }) => {
  const { user } = useAuth();
  const { isTenantSelected, selectedTenant } = useTenantSelection();
  const navigate = useNavigate();

  // If user is not admin or tenant is selected, render children
  if (user?.role !== 'admin' || isTenantSelected()) {
    return children;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <BusinessIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Select a Tenant
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            To access tenant-specific features like creating invoices and managing buyers, 
            you need to select a tenant from the available list.
          </Typography>

          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <strong>Note:</strong> Each tenant has their own separate database for invoices and buyers. 
            Please select the tenant you want to work with.
          </Alert>

          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/tenant-management')}
          >
            View Available Tenants
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TenantSelectionPrompt; 