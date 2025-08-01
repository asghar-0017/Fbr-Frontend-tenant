import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Modal,
  Divider,
  useTheme,
  CircularProgress,
  TextField,
  MenuItem,
  InputAdornment,
  Pagination,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import { green } from "@mui/material/colors";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { api } from "../API/Api";
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import Tooltip from '@mui/material/Tooltip';
import { useTenantSelection } from '../Context/TenantSelectionProvider';

export default function BasicTable() {
  const [invoices, setInvoices] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [saleType, setSaleType] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [invoiceDate, setInvoiceDate] = useState(null);
  const theme = useTheme();
  const { selectedTenant } = useTenantSelection();

  const getMyInvoices = async () => {
    setLoading(true);
    try {
      if (!selectedTenant) {
        console.error("No tenant selected");
        setLoading(false);
        return;
      }

      const response = await api.get(`/tenant/${selectedTenant.tenant_id}/invoices`);
      
      if (response.data.success) {
        setInvoices(response.data.data.invoices || []);
      } else {
        console.error("Failed to fetch invoices:", response.data.message);
        setInvoices([]);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      if (error.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      }
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      getMyInvoices();
    }
  }, [selectedTenant]);

  const handleButtonClick = async (invoice) => {
    try {
      if (!selectedTenant) {
        alert("No tenant selected");
        return;
      }
      
      // Get the auth token
      const token = localStorage.getItem('tenantToken') || localStorage.getItem('token');
      if (!token) {
        alert("Authentication token not found");
        return;
      }
      
      const link =`${import.meta.env.VITE_SERVER_API_LOCAL}/print-invoice/${invoice.invoiceNumber}`
  
    
      window.open(link, '_blank');
      

    } catch (error) {
      console.error("Error printing invoice:", error);
      if (error.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert("Error printing invoice. Check console for details.");
      }
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      if (!selectedTenant) {
        alert("No tenant selected");
        return;
      }

      const response = await api.get(`/tenant/${selectedTenant.tenant_id}/invoices/${invoice.id}`);
      
      if (response.data.success) {
        setSelectedInvoice(response.data.data);
        setViewModalOpen(true);
      } else {
        console.error("Failed to fetch invoice:", response.data.message);
        alert("Failed to fetch invoice details");
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      if (error.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert("Error fetching invoice details. Check console for details.");
      }
    }
  };

  // Filtered invoices with date filter
  const filteredInvoices = [...(invoices || [])].filter((row) => {
    // Sale type filter
    const saleTypeMatch = saleType === "All" || (row.invoiceType || "").toLowerCase().includes(saleType.toLowerCase());
    // Search filter (invoice number or buyer NTN)
    const searchLower = search.trim().toLowerCase();
    const invoiceNumberMatch = (row.invoiceNumber || "").toString().toLowerCase().includes(searchLower);
    const buyerNTNMatch = (row.buyerNTNCNIC || "").toString().toLowerCase().includes(searchLower);
    // Date filter (single date)
    let dateMatch = true;
    if (invoiceDate) {
      dateMatch = dayjs(row.invoiceDate).isSame(dayjs(invoiceDate), 'day');
    }
    return saleTypeMatch && (invoiceNumberMatch || buyerNTNMatch) && dateMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);
  const paginatedInvoices = filteredInvoices.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <>
      {!selectedTenant ? (
        <Box
          sx={{
            textAlign: "center",
            p: 4,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Tenant Selected
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please select a tenant to view invoices.
          </Typography>
        </Box>
      ) : loading ? (
        <Box
          sx={{
            textAlign: "center",
            p: 4,
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.background.default,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
          {/* Header Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
              p: 2,
              borderRadius: 3,
              background: 'linear-gradient(90deg, #e3f2fd 0%, #f8fafc 100%)',
              boxShadow: 2,
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: 40, color: '#1976d2' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#1976d2',
                letterSpacing: 1,
                textShadow: '0 2px 8px #e3e3e3',
              }}
            >
              Your Invoices
            </Typography>
          </Box>
          {/* Search and Filter Controls */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search by Invoice # or Buyer NTN"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 260 }}
            />
            <TextField
              select
              label="Sale Type"
              size="small"
              value={saleType}
              onChange={e => { setSaleType(e.target.value); setPage(1); }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Sale Invoice">Sale Invoice</MenuItem>
              <MenuItem value="Debit Note">Debit Note</MenuItem>
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Invoice Date"
                value={invoiceDate}
                onChange={val => { setInvoiceDate(val); setPage(1); }}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }}
              />
            </LocalizationProvider>
          </Box>

          {/* Empty State */}
          {filteredInvoices.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: '#90a4ae' }}>
              <SentimentDissatisfiedIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No invoices found
              </Typography>
              <Typography variant="body2">
                Try adjusting your search or filter criteria.
              </Typography>
            </Box>
          ) : (
            <>
            <TableContainer
              component={Paper}
              elevation={4}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: 4,
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="invoice table">
                <TableHead>
                  <TableRow
                    sx={{
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                    }}
                  >
                    {[
                      "Invoice Number",
                      "Invoice Type",
                      "Scenario ID",
                      "HS Code",
                      "Actions",
                    ].map((heading) => (
                      <TableCell
                        key={heading}
                        align={heading === "Invoice Number" ? "left" : "right"}
                        sx={{
                          color: '#fff',
                          fontWeight: "bold",
                          fontSize: 16,
                          letterSpacing: 0.5,
                        }}
                      >
                        {heading}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedInvoices.map((row, index) => (
                    <TableRow
                      key={row._id || index}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#f5fafd' : '#e3f2fd',
                        '&:hover': {
                          backgroundColor: '#bbdefb',
                          transition: 'background-color 0.3s',
                        },
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 15 }}>
                        {row.invoiceNumber}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {row.invoiceType || "N/A"}
                      </TableCell>
                      <TableCell align="right">
                        {row.scenarioId || "N/A"}
                      </TableCell>
                      <TableCell align="right">
                        {row.items && row.items.length > 0 ? row.items.map((item) => item.hsCode || "N/A").join(", ") : "N/A"}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                          <Tooltip title="Print Invoice">
                            <Button
                              onClick={() => handleButtonClick(row)}
                              variant="outlined"
                              size="small"
                              startIcon={<PrintIcon />}
                              sx={{
                                cursor: "pointer",
                                textTransform: "none",
                                borderRadius: 2,
                                color: green[700],
                                borderColor: green[700],
                                fontSize: "0.85rem",
                                px: 2,
                                py: 0.5,
                                boxShadow: 1,
                                '&:hover': {
                                  backgroundColor: green[700],
                                  color: "white",
                                  borderColor: green[700],
                                },
                              }}
                            >
                              Print
                            </Button>
                          </Tooltip>
                          <Tooltip title="View Invoice Details">
                            <Button
                              onClick={() => handleViewInvoice(row)}
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              sx={{
                                cursor: "pointer",
                                textTransform: "none",
                                borderRadius: 2,
                                color: '#1976d2',
                                borderColor: '#1976d2',
                                fontSize: "0.85rem",
                                px: 2,
                                py: 0.5,
                                boxShadow: 1,
                                '&:hover': {
                                  backgroundColor: '#1976d2',
                                  color: "white",
                                  borderColor: '#1976d2',
                                },
                              }}
                            >
                              View
                            </Button>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
            </>
          )}

          {/* Invoice Details Modal (unchanged) */}
          <Modal
            open={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={(theme) => ({
                width: "90%",
                maxWidth: 800,
                bgcolor: "background.paper",
                boxShadow: 24,
                borderRadius: 2,
                overflow: "hidden",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
              })}
            >
              {/* Modal Header */}
              <Box
                sx={(theme) => ({
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2,
                  py: 1,
                })}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Invoice Details
                </Typography>
                <IconButton
                  onClick={() => setViewModalOpen(false)}
                  sx={{
                    color: theme.palette.primary.contrastText,
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Modal Content */}
              <Box
                sx={{
                  p: 3,
                  overflowY: "auto",
                }}
              >
                {selectedInvoice ? (
                  <>
                    {/* Top Section */}
                    <Box
                      sx={(theme) => ({
                        mb: 2,
                        p: 2,
                        border: `1px solid ${theme.palette.primary.light}`,
                        borderRadius: 2,
                        bgcolor: theme.palette.action.hover,
                      })}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        General Information
                      </Typography>
                      <Typography variant="body2">
                        <b>Invoice Number:</b> {selectedInvoice.invoiceNumber}
                        <br />
                        <b>Type:</b> {selectedInvoice.invoiceType}
                        <br />
                        <b>Date:</b> {selectedInvoice.invoiceDate}
                        <br />
                        <b>Scenario ID:</b> {selectedInvoice.scenarioId || "N/A"}
                      </Typography>
                    </Box>

                    {/* Seller */}
                    <Box
                      sx={(theme) => ({
                        mb: 2,
                        p: 2,
                        border: `1px solid ${theme.palette.primary.light}`,
                        borderRadius: 2,
                      })}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        Seller Details
                      </Typography>
                      <Typography variant="body2">
                        <b>Name:</b> {selectedInvoice.sellerBusinessName}
                        <br />
                        <b>NTN/CNIC:</b> {selectedInvoice.sellerNTNCNIC}
                        <br />
                        <b>Province:</b> {selectedInvoice.sellerProvince}
                        <br />
                        <b>Address:</b> {selectedInvoice.sellerAddress}
                      </Typography>
                    </Box>

                    {/* Buyer */}
                    <Box
                      sx={(theme) => ({
                        mb: 2,
                        p: 2,
                        border: `1px solid ${theme.palette.primary.light}`,
                        borderRadius: 2,
                        bgcolor: theme.palette.action.hover,
                      })}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        Buyer Details
                      </Typography>
                      <Typography variant="body2">
                        <b>Name:</b> {selectedInvoice.buyerBusinessName}
                        <br />
                        <b>NTN/CNIC:</b> {selectedInvoice.buyerNTNCNIC}
                        <br />
                        <b>Province:</b> {selectedInvoice.buyerProvince}
                        <br />
                        <b>Type:</b> {selectedInvoice.buyerRegistrationType}
                        <br />
                        <b>Address:</b> {selectedInvoice.buyerAddress}
                      </Typography>
                    </Box>

                    {/* Items */}
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        Items
                      </Typography>
                      {(selectedInvoice.items || []).map((item, index) => (
                        <Box
                          key={index}
                          sx={(theme) => ({
                            mb: 2,
                            p: 2,
                            border: `1px solid ${theme.palette.primary.light}`,
                            borderRadius: 2,
                          })}
                        >
                          <Typography variant="body2">
                            <b>Product:</b> {item.productDescription}
                            <br />
                            <b>HS Code:</b> {item.hsCode} | <b>UOM:</b>{" "}
                            {item.uoM}
                            <br />
                            <b>Quantity:</b> {item.quantity} | <b>Rate:</b>{" "}
                            {item.rate}
                            <br />
                            <b>Total:</b> {item.totalValues} | <b>Sales Tax:</b>{" "}
                            {item.salesTaxApplicable}
                            <br />
                            <b>Extra Tax:</b> {item.extraTax} | <b>FED:</b>{" "}
                            {item.fedPayable} | <b>Further Tax:</b>{" "}
                            {item.furtherTax}
                            <br />
                            <b>SRO Schedule No:</b> {item.sroScheduleNo} |{" "}
                            <b>SRO Serial No:</b> {item.sroItemSerialNo}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                ) : (
                  <Typography>Loading...</Typography>
                )}
              </Box>
            </Box>
          </Modal>
        </Box>
      )}
    </>
  );
}
