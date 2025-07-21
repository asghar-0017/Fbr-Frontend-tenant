import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button, Typography, Divider, Stack, MenuItem, Select, InputLabel, FormControl, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const BuyerModal = ({ isOpen, onClose, onSave, buyer }) => {
  const [formData, setFormData] = useState({
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: '',
    buyerAddress: '',
    buyerRegistrationType: ''
  });

  useEffect(() => {
    if (buyer) {
      setFormData({
        buyerNTNCNIC: buyer.buyerNTNCNIC || '',
        buyerBusinessName: buyer.buyerBusinessName || '',
        buyerProvince: buyer.buyerProvince || '',
        buyerAddress: buyer.buyerAddress || '',
        buyerRegistrationType: buyer.buyerRegistrationType || ''
      });
    } else {
      setFormData({
        buyerNTNCNIC: '',
        buyerBusinessName: '',
        buyerProvince: '',
        buyerAddress: '',
        buyerRegistrationType: ''
      });
    }
  }, [buyer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      bgcolor: 'rgba(0,0,0,0.4)',
      zIndex: 1300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Paper elevation={8} sx={{
        p: { xs: 2, sm: 4 },
        width: { xs: '90%', sm: 400 },
        borderRadius: 4,
        position: 'relative',
        background: 'linear-gradient(135deg, #f6f9fc 0%, #e0e7ff 100%)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, color: '#888' }}>
          <CloseIcon fontSize="large" />
        </IconButton>
        <Typography variant="h5" fontWeight={700} align="center" gutterBottom sx={{ color: '#3f51b5', mt: 1 }}>
          {buyer ? 'Edit Buyer' : 'Add Buyer'}
        </Typography>
        <Divider sx={{ width: '100%', mb: 3, borderColor: '#3f51b5' }} />
        <Box component="form" onSubmit={handleSave} sx={{ width: '100%' }}>
          <Stack spacing={2}>
            <TextField
              label="NTN/CNIC"
              name="buyerNTNCNIC"
              value={formData.buyerNTNCNIC}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
            />
            <TextField
              label="Business Name"
              name="buyerBusinessName"
              value={formData.buyerBusinessName}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
            />
            <TextField
              label="Province"
              name="buyerProvince"
              value={formData.buyerProvince}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
            />
            <TextField
              label="Address"
              name="buyerAddress"
              value={formData.buyerAddress}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
            />
            <FormControl fullWidth required>
              <InputLabel id="buyerRegistrationType-label">Registration Type</InputLabel>
              <Select
                labelId="buyerRegistrationType-label"
                name="buyerRegistrationType"
                value={formData.buyerRegistrationType}
                label="Registration Type"
                onChange={handleChange}
              >
                <MenuItem value="Registered">Registered</MenuItem>
                <MenuItem value="Unregistered">Unregistered</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ fontWeight: 600, fontSize: '1rem', py: 1.2, borderRadius: 2, boxShadow: '0 4px 12px rgba(63, 81, 181, 0.3)' }}
            >
              Save
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ fontWeight: 600, fontSize: '1rem', py: 1.2, borderRadius: 2 }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default BuyerModal; 