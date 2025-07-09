import * as React from 'react';
import {
  Box,
  InputLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Typography,
} from '@mui/material';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';

export default function CreateInvoice() {
  const [formData, setFormData] = React.useState({
    invoiceType: 'Sale Invoice',
    invoiceDate: dayjs('2025-07-02'),
    sellerNTNCNIC: '7458525',
    sellerBusinessName: 'IBL',
    sellerProvince: 'Sindh',
    sellerAddress: 'Karachi',
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: 'AZAD JAMMU AND KASHMIR',
    buyerAddress: '',
    buyerRegistrationType: 'Registered',
    invoiceRefNo: 'INV-1751446315',
    scenarioId: 'SN001',
    items: [
      {
        hsCode: '',
        productDescription: '',
        rate: '18.00%',
        uoM: '',
        quantity: '',
        totalValues: '',
        valueSalesExcludingST: '',
        fixedNotifiedValueOrRetailPrice: '',
        salesTaxApplicable: '',
        salesTaxWithheldAtSource: '',
        sroScheduleNo: '',
        sroItemSerialNo: '',
      },
    ],
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };

  const addNewItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          hsCode: '',
          productDescription: '',
          rate: '18.00%',
          uoM: '',
          quantity: '',
          totalValues: '',
          valueSalesExcludingST: '',
          fixedNotifiedValueOrRetailPrice: '',
          salesTaxApplicable: '',
          salesTaxWithheldAtSource: '',
          sroScheduleNo: '',
          sroItemSerialNo: '',
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f0f2f5', borderRadius: 2,mt:8 }}>
      {/* Invoice Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textTransform: 'uppercase', color: 'primary.main' }}>
        Invoice
      </Typography>
      <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 3, mb: 4, backgroundColor: '#ffffff', boxShadow: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{m:1, flex: '1 1 30%', minWidth: '250px' }}>
            <FormControl fullWidth>
              <InputLabel id="invoice-type-label">Invoice Type</InputLabel>
              <Select
                labelId="invoice-type-label"
                value={formData.invoiceType}
                label="Invoice Type"
                onChange={(e) => handleChange('invoiceType', e.target.value)}
              >
                <MenuItem value="Sale Invoice">Sale Invoice</MenuItem>
                <MenuItem value="Service Invoice">Service Invoice</MenuItem>
                <MenuItem value="Export Invoice">Export Invoice</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={['DatePicker']}>
                <DatePicker
                  label="Invoice Date"
                  value={formData.invoiceDate}
                  onChange={(date) => handleChange('invoiceDate', date)}
                  sx={{ width: '100%' }}
                />
              </DemoContainer>
            </LocalizationProvider>
          </Box>

          <Box sx={{m:1, flex: '1 1 30%', minWidth: '250px' }}>
            <TextField
              fullWidth
              label="Invoice Ref No."
              value={formData.invoiceRefNo}
              onChange={(e) => handleChange('invoiceRefNo', e.target.value)}
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      {/* Seller Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textTransform: 'uppercase', color: 'primary.main' }}>
        Seller Detail
      </Typography>
      <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 3, mb: 4, backgroundColor: '#ffffff', boxShadow: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {[
            { label: 'Seller NTN/CNIC', field: 'sellerNTNCNIC' },
            { label: 'Seller Business Name', field: 'sellerBusinessName' },
            { label: 'Seller Address', field: 'sellerAddress' },
          ].map(({ label, field }) => (
            <Box key={field} sx={{ flex: '1 1 30%', minWidth: '250px' }}>
              <TextField
                fullWidth
                label={label}
                value={formData[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                variant="outlined"
              />
            </Box>
          ))}

          <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
            <FormControl fullWidth>
              <InputLabel id="seller-province-label">Seller Province</InputLabel>
              <Select
                labelId="seller-province-label"
                value={formData.sellerProvince}
                label="Seller Province"
                onChange={(e) => handleChange('sellerProvince', e.target.value)}
              >
                <MenuItem value="Sindh">Sindh</MenuItem>
                <MenuItem value="Punjab">Punjab</MenuItem>
                <MenuItem value="KPK">KPK</MenuItem>
                <MenuItem value="Balochistan">Balochistan</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Buyer Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textTransform: 'uppercase', color: 'primary.main' }}>
        Buyer Detail
      </Typography>
      <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 3, mb: 4, backgroundColor: '#ffffff', boxShadow: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {[
            { label: 'Buyer NTN/CNIC', field: 'buyerNTNCNIC' },
            { label: 'Buyer Business Name', field: 'buyerBusinessName' },
            { label: 'Buyer Address', field: 'buyerAddress' },
          ].map(({ label, field }) => (
            <Box key={field} sx={{ flex: '1 1 30%', minWidth: '250px' }}>
              <TextField
                fullWidth
                label={label}
                value={formData[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                variant="outlined"
              />
            </Box>
          ))}

          <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
            <FormControl fullWidth>
              <InputLabel id="buyer-province-label">Buyer Province</InputLabel>
              <Select
                labelId="buyer-province-label"
                value={formData.buyerProvince}
                label="Buyer Province"
                onChange={(e) => handleChange('buyerProvince', e.target.value)}
              >
                <MenuItem value="AZAD JAMMU AND KASHMIR">AZAD JAMMU AND KASHMIR</MenuItem>
                <MenuItem value="Sindh">Sindh</MenuItem>
                <MenuItem value="Punjab">Punjab</MenuItem>
                <MenuItem value="KPK">KPK</MenuItem>
                <MenuItem value="Balochistan">Balochistan</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
            <FormControl fullWidth>
              <InputLabel id="buyer-registration-type-label">Buyer Registration Type</InputLabel>
              <Select
                labelId="buyer-registration-type-label"
                value={formData.buyerRegistrationType}
                label="Buyer Registration Type"
                onChange={(e) => handleChange('buyerRegistrationType', e.target.value)}
              >
                <MenuItem value="Registered">Registered</MenuItem>
                <MenuItem value="Unregistered">Unregistered</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Scenario ID Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textTransform: 'uppercase', color: 'primary.main' }}>
        Scenario
      </Typography>
      <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 3, mb: 4, backgroundColor: '#ffffff', boxShadow: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 30%', minWidth: '250px' }}>
            <TextField
              fullWidth
              label="Scenario ID"
              value={formData.scenarioId}
              onChange={(e) => handleChange('scenarioId', e.target.value)}
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      {/* Items Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textTransform: 'uppercase', color: 'primary.main' }}>
        Items
      </Typography>
      {formData.items.map((item, index) => (
        <Box
          key={index}
          sx={{
            mb: 4,
            border: '1px solid #ccc',
            borderRadius: 2,
            p: 2,
            boxShadow: 1,
            backgroundColor: '#fafafa',
            position: 'relative',
            minHeight: '200px',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ flex: '1 1 23%', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel id={`sro-item-${index}`}>SRO Item #</InputLabel>
                <Select
                  labelId={`sro-item-${index}`}
                  value={item.sroItemSerialNo}
                  label="SRO Item #"
                  onChange={(e) => handleItemChange(index, 'sroItemSerialNo', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select SF</em>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 23%', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel id={`sro-schedule-${index}`}>SRO Schedule No</InputLabel>
                <Select
                  labelId={`sro-schedule-${index}`}
                  value={item.sroScheduleNo}
                  label="SRO Schedule No"
                  onChange={(e) => handleItemChange(index, 'sroScheduleNo', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select SRO Schedule</em>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 23%', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel id={`hs-code-${index}`}>HS Code</InputLabel>
                <Select
                  labelId={`hs-code-${index}`}
                  value={item.hsCode}
                  label="HS Code"
                  onChange={(e) => handleItemChange(index, 'hsCode', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select HS</em>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 23%', minWidth: '200px' }}>
              <TextField
                fullWidth
                label="Product Description"
                value={item.productDescription}
                onChange={(e) => handleItemChange(index, 'productDescription', e.target.value)}
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ flex: '1 1 23%', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel id={`uom-${index}`}>Unit of Measure (UoM)</InputLabel>
                <Select
                  labelId={`uom-${index}`}
                  value={item.uoM}
                  label="Unit of Measure (UoM)"
                  onChange={(e) => handleItemChange(index, 'uoM', e.target.value)}
                >
                  <MenuItem value="">
                    <em>-- Select UOM --</em>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 23%', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel id={`rate-${index}`}>Rate</InputLabel>
                <Select
                  labelId={`rate-${index}`}
                  value={item.rate}
                  label="Rate"
                  onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                >
                  <MenuItem value="18.00%">18.00%</MenuItem>
                  <MenuItem value="17.00%">17.00%</MenuItem>
                  <MenuItem value="0.00%">0.00%</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 18%', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="Unit Cost"
                type="number"
                value={item.fixedNotifiedValueOrRetailPrice}
                onChange={(e) => handleItemChange(index, 'fixedNotifiedValueOrRetailPrice', e.target.value)}
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: '1 1 18%', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="Qty"
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: '1 1 18%', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="Value Sales (Excl. ST)"
                type="number"
                value={item.valueSalesExcludingST}
                onChange={(e) => handleItemChange(index, 'valueSalesExcludingST', e.target.value)}
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: '1 1 18%', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="Sales Tax Applicable"
                type="number"
                value={item.salesTaxApplicable}
                onChange={(e) => handleItemChange(index, 'salesTaxApplicable', e.target.value)}
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: '1 1 18%', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="Total Values"
                type="number"
                value={item.totalValues}
                onChange={(e) => handleItemChange(index, 'totalValues', e.target.value)}
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box sx={{ flex: '1 1 18%', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="ST Withheld at Source"
                type="number"
                value={item.salesTaxWithheldAtSource}
                onChange={(e) => handleItemChange(index, 'salesTaxWithheldAtSource', e.target.value)}
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ position: 'relative', mt: 2, textAlign: 'right' }}>
            <Button
              variant="contained"
              color="error"
              onClick={() => removeItem(index)}
              sx={{ mt: 2 }}
            >
              Remove Item
            </Button>
          </Box>
        </Box>
      ))}

      {/* Add and Submit Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="contained" onClick={addNewItem} color="secondary">
          Add New Item
        </Button>
        <Button variant="contained" color="primary">
          Submit
        </Button>
      </Box>
    </Box>
  );
}