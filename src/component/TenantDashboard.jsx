import React, { useState, useEffect } from 'react';
import { useTenantSelection } from '../Context/TenantSelectionProvider';
import { api } from '../API/Api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { getCurrentTokenState } from '../API/Api';

const TenantDashboard = () => {
  const { selectedTenant } = useTenantSelection();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tokenState = getCurrentTokenState();

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantStats();
    }
  }, [selectedTenant]);

  const fetchTenantStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/admin/tenants/${selectedTenant.tenant_id}/stats`);
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Failed to fetch tenant statistics');
      }
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      setError('Failed to fetch tenant statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedTenant) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Tenant Information Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <BusinessIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" component="h2">
                              {selectedTenant.sellerBusinessName}
            </Typography>
            <Chip 
              label={selectedTenant.is_active ? 'Active' : 'Inactive'} 
              color={selectedTenant.is_active ? 'success' : 'default'}
              sx={{ ml: 2 }}
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center">
                <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {selectedTenant.sellerProvince}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                NTN/CNIC: {selectedTenant.sellerNTNCNIC}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Address: {selectedTenant.sellerAddress}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : stats ? (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {stats.buyer_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Buyers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ReceiptIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {stats.invoice_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Invoices
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}

      {/* Debug section - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box mt={2} p={2} bgcolor="rgba(255,255,255,0.1)" borderRadius={1}>
          <Typography variant="caption" display="block" mb={1}>
          </Typography>
          <Typography variant="caption" display="block">
          </Typography>
          <Typography variant="caption" display="block">
          </Typography>
          <Typography variant="caption" display="block">
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TenantDashboard; 