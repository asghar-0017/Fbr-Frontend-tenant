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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import { green } from "@mui/material/colors";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

export default function BasicTable() {
  const [invoices, setInvoices] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const theme = useTheme();

  const getMyInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://45.55.137.96:5150/get-invoice-data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInvoices(res.data.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  useEffect(() => {
    getMyInvoices();
  }, []);

  const handleButtonClick = async (id) => {
    try {
      const link = `http://45.55.137.96:5150/print-invoice/${id}`;
      window.open(link, "_blank");
    } catch (error) {
      console.error("Error printing invoice:", error);
      alert("Error printing invoice. Check console for details.");
    }
  };

  const handleViewInvoice = async (id) => {
    try {
      const view = await axios.get(
        `http://45.55.137.96:5150/get-invoice-data/${id}`
      );
      setSelectedInvoice(view.data.data);
      setViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching invoice data:", error);
    }
  };

  // Sort invoices so the last one (newest) appears first
  const sortedInvoices = [...invoices].reverse();

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: "bold",
          color: (theme) => theme.palette.primary.main,
        }}
      >
        Invoice List
      </Typography>

      <TableContainer
        component={Paper}
        elevation={3}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="invoice table">
          <TableHead>
            <TableRow
              sx={(theme) => ({
                backgroundColor: theme.palette.primary.main,
              })}
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
                  sx={(theme) => ({
                    color: theme.palette.primary.contrastText,
                    fontWeight: "bold",
                  })}
                >
                  {heading}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedInvoices.map((row, index) => (
              <TableRow
                key={row._id || index}
                sx={{
                  "&:nth-of-type(odd)": (theme) => ({
                    backgroundColor: theme.palette.action.hover,
                  }),
                  "&:hover": (theme) => ({
                    backgroundColor: theme.palette.action.selected,
                  }),
                  transition: "background-color 0.3s",
                }}
              >
                <TableCell component="th" scope="row">
                  {row.invoiceNumber}
                </TableCell>
                <TableCell align="right">{row.invoiceType || "N/A"}</TableCell>
                <TableCell align="right">{row.scenarioId || "N/A"}</TableCell>
                <TableCell align="right">
                  {row.items.map((item) => item.hsCode).join(", ") || "N/A"}
                </TableCell>
                <TableCell align="right">
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
                  >
                    <Button
                      onClick={() => handleButtonClick(row.invoiceNumber)}
                      variant="outlined"
                      size="small"
                      startIcon={<PrintIcon />}
                      sx={(theme) => ({
                        cursor: "pointer",
                        textTransform: "none",
                        borderRadius: 2,
                        color: green[700],
                        borderColor: green[700],
                        fontSize: "0.75rem",
                        padding: "4px 10px",
                        "&:hover": {
                          backgroundColor: green[700],
                          color: "white",
                          borderColor: green[700],
                        },
                      })}
                    >
                      Print
                    </Button>
                    <Button
                      onClick={() => handleViewInvoice(row.invoiceNumber)}
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      sx={(theme) => ({
                        cursor: "pointer",
                        textTransform: "none",
                        borderRadius: 2,
                        color: theme.palette.primary.main,
                        borderColor: theme.palette.primary.main,
                        fontSize: "0.75rem",
                        padding: "4px 10px",
                        "&:hover": {
                          backgroundColor: theme.palette.primary.main,
                          color: "white",
                          borderColor: theme.palette.primary.main,
                        },
                      })}
                    >
                      View
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ================= Modal ================= */}
      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
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
                    <b>Scenario ID:</b> {selectedInvoice.scenarioId}
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
                  {selectedInvoice.items.map((item, index) => (
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
                        <b>HS Code:</b> {item.hsCode} | <b>UOM:</b> {item.uoM}
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
  );
}
