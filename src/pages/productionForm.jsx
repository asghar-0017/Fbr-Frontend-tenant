import * as React from "react";
import {
  Box,
  InputLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Button from "@mui/material/Button";
import dayjs from "dayjs";
import { fetchData, postData } from "../API/GetApi";
import RateSelector from "../component/RateSelector";
import SROScheduleNumber from "../component/SROScheduleNumber";
import SROItem from "../component/SROItem";
import UnitOfMeasurement from "../component/UnitOfMeasurement";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {API_CONFIG} from "../API/Api";
import TenantSelectionPrompt from "../component/TenantSelectionPrompt";
import { useTenantSelection } from "../Context/TenantSelectionProvider";
import TenantDashboard from "../component/TenantDashboard";

const { apiKeyLocal, sandBoxTestToken } = API_CONFIG;

export default function ProductionFoam() {
  const { selectedTenant } = useTenantSelection();
  
  const [formData, setFormData] = React.useState({
    invoiceType: "",
    invoiceDate: dayjs(),
    sellerNTNCNIC: "",
    sellerBusinessName: "",
    sellerProvince: "",
    sellerAddress: "",
    buyerNTNCNIC: "",
    buyerBusinessName: "",
    buyerProvince: "",
    buyerAddress: "",
    buyerRegistrationType: "",
    invoiceRefNo: "",
    transactionTypeId: "",
    items: [
      {
        hsCode: "",
        productDescription: "",
        rate: "",
        uoM: "",
        quantity: "1",
        totalValues: "0",
        valueSalesExcludingST: "0",
        fixedNotifiedValueOrRetailPrice: "1",
        salesTaxApplicable: "0",
        salesTaxWithheldAtSource: "0",
        sroScheduleNo: "",
        sroItemSerialNo: "",
        saleType: "",
        isSROScheduleEnabled: false,
        isSROItemEnabled: false,
        extraTax: "",
        furtherTax: "0",
        fedPayable: "0",
        discount: "0",
        isValueSalesManual: false,
      },
    ],
  });

  const [transactionTypes, setTransactionTypes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [isPrintable, setIsPrintable] = React.useState(false);
  const [province, setProvince] = React.useState([]);
  const [hsCodeList, setHsCodeList] = React.useState([]);
  const [invoiceTypes, setInvoiceTypes] = React.useState([]);
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const navigate = useNavigate();
  const [allLoading, setAllLoading] = React.useState(true);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update form data when selected tenant changes
  React.useEffect(() => {
    if (selectedTenant) {
      setFormData(prev => ({
        ...prev,
        sellerNTNCNIC: selectedTenant.sellerNTNCNIC || "",
        sellerBusinessName: selectedTenant.sellerBusinessName || "",
        sellerProvince: selectedTenant.sellerProvince || "",
        sellerAddress: selectedTenant.sellerAddress || "",
      }));
    } else {
      // Clear seller fields if no tenant is selected
      setFormData(prev => ({
        ...prev,
        sellerNTNCNIC: "",
        sellerBusinessName: "",
        sellerProvince: "",
        sellerAddress: "",
      }));
    }
  }, [selectedTenant]);

  React.useEffect(() => {
    setAllLoading(true);
    Promise.allSettled([
      fetchData("pdi/v1/provinces").then((response) => {
        setProvince(response);
        localStorage.setItem("provinceResponse", JSON.stringify(response));
      }),
      fetch("https://gw.fbr.gov.pk/pdi/v1/itemdesccode", {
        headers: {
          Authorization: `Bearer ${sandBoxTestToken}`,
        },
      })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data) =>
          setHsCodeList(data.map((item) => ({ hS_CODE: item.hS_CODE })))
        )
        .catch(() => setHsCodeList([])),
      fetch("https://gw.fbr.gov.pk/pdi/v1/doctypecode", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data) => setInvoiceTypes(data))
        .catch(() =>
          setInvoiceTypes([
            { docTypeId: 4, docDescription: "Sale Invoice" },
            { docTypeId: 9, docDescription: "Debit Note" },
          ])
        ),
      fetchData("pdi/v1/transtypecode").then((res) => setTransactionTypes(res)),
    ]).finally(() => setAllLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${apiKeyLocal}/get-buyers`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setBuyers(data.users || []))
      .catch(() => setBuyers([]));
  }, []);

  useEffect(() => {
    if (!selectedBuyerId) return;
    const buyer = buyers.find((b) => b.id === selectedBuyerId);
    if (buyer) {
      setFormData((prev) => ({
        ...prev,
        buyerNTNCNIC: buyer.buyerNTNCNIC || "",
        buyerBusinessName: buyer.buyerBusinessName || "",
        buyerProvince: buyer.buyerProvince || "",
        buyerAddress: buyer.buyerAddress || "",
        buyerRegistrationType: buyer.buyerRegistrationType || "",
      }));
    }
  }, [selectedBuyerId, buyers]);

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index] };
  
      // Utility to parse values
      const parseValue = (val, isFloat = true) =>
        val === "" ? (isFloat ? 0 : "") : isFloat ? parseFloat(val) || 0 : val;
  
      // Update the field - store the raw string value for display
      if (
        [
          "quantity",
          "fixedNotifiedValueOrRetailPrice",
          "valueSalesExcludingST",
          "salesTaxApplicable",
          "totalValues",
          "salesTaxWithheldAtSource",
          "extraTax",
          "furtherTax",
          "fedPayable",
          "discount",
        ].includes(field)
      ) {
        // Store the raw string value for display
        item[field] = value;
        if (field === "valueSalesExcludingST") {
          item.isValueSalesManual = true;
        }
      } else {
        item[field] = value;
      }
  
      // Handle SRO reset logic
      if (field === "rate" && value) {
        item.isSROScheduleEnabled = true;
        item.sroScheduleNo = "";
        item.sroItemSerialNo = "";
        item.isSROItemEnabled = false;
        item.isValueSalesManual = false;
      }
  
      if (field === "sroScheduleNo" && value) {
        item.isSROItemEnabled = true;
        item.sroItemSerialNo = "";
      }
  
      // Begin calculations
      if (!item.isValueSalesManual) {
        // NEW LOGIC: unitCost is the total cost, not multiplied by quantity
        const unitCost = parseFloat(item.fixedNotifiedValueOrRetailPrice || 0);
        const rate = parseFloat((item.rate || "0").replace("%", "")) || 0;

        // Value without sales tax is just the unit cost
        item.valueSalesExcludingST = unitCost.toString();

        // Sales tax
        let rateFraction = 0;
        if (item.rate && item.rate.toLowerCase() !== "exempt" && item.rate !== "0%") {
          rateFraction = rate / 100;
          const salesTax = Number((unitCost * rateFraction).toFixed(2));
          item.salesTaxApplicable = salesTax.toString();
        } else {
          item.salesTaxApplicable = "0";
          item.salesTaxWithheldAtSource = "0";
        }

        // Total before discount
        let totalBeforeDiscount =
          parseFloat(item.valueSalesExcludingST || 0) +
          parseFloat(item.salesTaxApplicable || 0) +
          parseFloat(item.furtherTax || 0) +
          parseFloat(item.fedPayable || 0) +
          parseFloat(item.extraTax || 0);

        // Discount as percentage
        let discountPercent = parseFloat(item.discount || 0);
        let discountAmount = 0;
        if (discountPercent > 0) {
          discountAmount = (totalBeforeDiscount * discountPercent) / 100;
        }
        const totalValue = Number((totalBeforeDiscount - discountAmount).toFixed(2));
        item.totalValues = totalValue.toString();
      }
  
            // Parse extra fields always as numbers for calculations
      const extraTaxNum = parseInt(item.extraTax, 10) || 0;
      const furtherTaxNum = parseFloat(item.furtherTax || 0);
      const fedPayableNum = parseFloat(item.fedPayable || 0);
      const discountNum = parseFloat(item.discount || 0);

      // Calculate totals
      const totalValue =
        parseFloat(item.valueSalesExcludingST || 0) +
        parseFloat(item.salesTaxApplicable || 0) +
        furtherTaxNum +
        fedPayableNum +
        extraTaxNum -
        discountNum;

      item.totalValues = Number(totalValue.toFixed(2)).toString();
      item.salesTaxApplicable = Number(parseFloat(item.salesTaxApplicable || 0).toFixed(2)).toString();
  
      updatedItems[index] = item;
      return { ...prev, items: updatedItems };
    });
  };

  const addNewItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          hsCode: "",
          productDescription: "",
          rate: "",
          uoM: "",
          quantity: "1",
          totalValues: "0",
          valueSalesExcludingST: "0",
          fixedNotifiedValueOrRetailPrice: "1",
          salesTaxApplicable: "0",
          salesTaxWithheldAtSource: "0",
          sroScheduleNo: "",
          sroItemSerialNo: "",
          extraTax: "",
          furtherTax: "0",
          fedPayable: "0",
          discount: "0",
          saleType: "Goods at Standard Rate (default)",
          isSROScheduleEnabled: false,
          isSROItemEnabled: false,
          isValueSalesManual: false,
        },
      ],
  }));

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleTransactionTypeChange = (desc) => {
    const selectedType = transactionTypes.find((item) => item.transactioN_DESC === desc);
    if (!selectedType) return;
    console.log("selectedType", selectedType.transactioN_TYPE_ID);
    localStorage.setItem("transactionTypeId", selectedType.transactioN_TYPE_ID);
    localStorage.setItem("saleType", selectedType.transactioN_DESC);
    setFormData((prev) => ({
      ...prev,
      transactionTypeId: selectedType.transactioN_TYPE_ID,
      items: prev.items.map((item) => ({
        ...item,
        saleType: selectedType.transactioN_DESC,
      })),
    }));
  };

  const handleSubmitChange = async () => {
    setLoading(true);
    try {
      // Validate that a tenant is selected and seller information is populated
      if (!selectedTenant) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a tenant before creating an invoice.",
          confirmButtonColor: "#d33",
        });
        setLoading(false);
        return;
      }

      // Validate seller fields
      const sellerRequiredFields = [
        { field: "sellerNTNCNIC", label: "Seller NTN/CNIC" },
        { field: "sellerBusinessName", label: "Seller Business Name" },
        { field: "sellerProvince", label: "Seller Province" },
        { field: "sellerAddress", label: "Seller Address" },
      ];

      for (const { field, label } of sellerRequiredFields) {
        if (!formData[field] || formData[field].trim() === "") {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `${label} is required. Please select a tenant to populate seller information.`,
            confirmButtonColor: "#d33",
          });
          setLoading(false);
          return;
        }
      }

      for (const [index, item] of formData.items.entries()) {
        const itemRequiredFields = [
          {
            field: "hsCode",
            message: `HS Code is required for item ${index + 1}`,
          },
          {
            field: "productDescription",
            message: `Product Description is required for item ${index + 1}`,
          },
          { field: "rate", message: `Rate is required for item ${index + 1}` },
          {
            field: "uoM",
            message: `Unit of Measurement is required for item ${index + 1}`,
          },
          {
            field: "quantity",
            message: `Quantity is required for item ${index + 1}`,
          },
          {
            field: "valueSalesExcludingST",
            message: `Value Sales Excluding ST is required for item ${
              index + 1
            }`,
          },
          ...(item.rate && item.rate.toLowerCase() === "exempt"
            ? [
                {
                  field: "sroScheduleNo",
                  message: `SRO Schedule Number is required for exempt item ${
                    index + 1
                  }`,
                },
                {
                  field: "sroItemSerialNo",
                  message: `SRO Item Serial Number is required for exempt item ${
                    index + 1
                  }`,
                },
              ]
            : []),
        ];

        for (const { field, message } of itemRequiredFields) {
          if (
            !item[field] ||
            (field === "valueSalesExcludingST" && item[field] <= 0)
          ) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: message,
              confirmButtonColor: "#d33",
            });
            setLoading(false);
            return;
          }
        }
      }

      const cleanedItems = formData.items.map(
        ({ isSROScheduleEnabled, isSROItemEnabled, ...rest }) => {
          const baseItem = {
            ...rest,
            quantity: rest.quantity === "" ? 0 : parseInt(rest.quantity, 10),
            sroScheduleNo: rest.sroScheduleNo?.trim() || "",
            sroItemSerialNo: rest.sroItemSerialNo?.trim() || "",
            productDescription: rest.productDescription?.trim() || "N/A",
            saleType: rest.saleType?.trim() || "Goods at standard rate (default)",
            furtherTax: Number(rest.furtherTax) || 0,
            fedPayable: Number(rest.fedPayable) || 0,
            discount: Number(rest.discount) || 0,
            salesTaxApplicable: Number(Number(rest.salesTaxApplicable).toFixed(2)),
            totalValues: Number(Number(rest.totalValues).toFixed(2)),
          };

          // Only include extraTax if saleType is NOT "Goods at Reduced Rate"
          if (rest.saleType?.trim() !== "Goods at Reduced Rate") {
            baseItem.extraTax = Number(rest.extraTax) || 0;
          }

          return baseItem;
        }
      );

      const cleanedData = {
        ...formData,
        invoiceDate: dayjs(formData.invoiceDate).format("YYYY-MM-DD"),
        items: cleanedItems,
      };

      const token = localStorage.getItem("token");
      console.log("Token used:", token);

      const validateRes = await postData(
        "di_data/v1/di/validateinvoicedata_sb",
        cleanedData
      );

      if (
        validateRes.status === 200 &&
        validateRes.data.validationResponse.statusCode === "00"
      ) {
        try {
          const postRes = await postData(
            "di_data/v1/di/postinvoicedata_sb",
            cleanedData
          );
          console.log("Post Invoice Response:", postRes);
          if (
            postRes.status === 200 &&
        postRes.data.validationResponse.statusCode === "00"
          ) {
            Swal.fire({
              icon: "success",
              title: "Success",
              text: `Invoice submitted successfully! Invoice Number: ${postRes.data.invoiceNumber}`,
              confirmButtonColor: "#28a745",
              willClose: () => {
                navigate("/your-invoices");
              },
            });
            setIsPrintable(true);
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text:
                postRes.data.validationResponse.error ||
                "Invoice submission failed.",
              confirmButtonColor: "#d33",
            });
          }
        } catch (postError) {
          console.error("Post Invoice Error:", {
            message: postError.message,
            status: postError.response?.status,
            data: postError.response?.data,
          });
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `Failed to submit invoice: ${
              postError.response?.data?.validationResponse?.error ||
              postError.message
            }`,
            confirmButtonColor: "#d33",
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            validateRes.data.validationResponse.error ||
            "Invoice validation failed.",
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      console.error("General Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to process the invoice: ${error.message}`,
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    printInvoice(formData);
  };

  return (
    <TenantSelectionPrompt>
      {selectedTenant && <TenantDashboard />}
      <Box
        sx={{
          p: { xs: 2, sm: 4 },
          background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)",
          borderRadius: 4,
          mt: selectedTenant ? 2 : 8,
          boxShadow: 6,
          maxWidth: 1200,
          mx: "auto",
          mb: 6,
        }}
      >
      {/* Invoice Type Section */}
      <Box
        sx={{
          border: "1px solid #e3e8ee",
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          mb: 4,
          background: "#fff",
          boxShadow: 2,
          transition: "box-shadow 0.2s",
          "&:hover": { boxShadow: 6 },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#1976d2",
            letterSpacing: 1,
          }}
        >
          Invoice Details
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ m: 1, flex: "1 1 30%", minWidth: "250px" }}>
            <FormControl fullWidth>
              <InputLabel id="invoice-type-label">Invoice Type</InputLabel>
              <Select
                labelId="invoice-type-label"
                value={formData.invoiceType}
                label="Invoice Type"
                onChange={(e) => handleChange("invoiceType", e.target.value)}
              >
                {invoiceTypes.map((type) => (
                  <MenuItem key={type.docTypeId} value={type.docDescription}>
                    {type.docDescription}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["DatePicker"]}>
                <DatePicker
                  label="Invoice Date"
                  value={formData.invoiceDate}
                  onChange={(date) => handleChange("invoiceDate", date)}
                  sx={{ width: "100%" }}
                />
              </DemoContainer>
            </LocalizationProvider>
          </Box>

          <Box sx={{ m: 1, flex: "1 1 30%", minWidth: "250px" }}>
            <TextField
              fullWidth
              label="Invoice Ref No."
              value={formData.invoiceRefNo}
              onChange={(e) => handleChange("invoiceRefNo", e.target.value)}
              variant="outlined"
              disabled={formData.invoiceType === "Sale Invoice"}
            />
          </Box>
        </Box>
      </Box>
      {/* Seller Detail Section */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#1976d2",
          letterSpacing: 1,
        }}
      >
        Seller Detail
      </Typography>
      
      {/* Tenant Selection Status */}
      {selectedTenant ? (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'white' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ✓ Selected Tenant: {selectedTenant.sellerBusinessName} ({selectedTenant.sellerNTNCNIC})
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Seller information has been automatically populated from the selected tenant.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'white' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ⚠ Please select a tenant to populate seller information
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mb: 1 }}>
            Go to Tenant Management to select a tenant before creating an invoice.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/tenant-management')}
            sx={{ 
              bgcolor: 'white', 
              color: 'warning.main',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            Select Tenant
          </Button>
        </Box>
      )}
      
      <Box
        sx={{
          border: "1px solid #e3e8ee",
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          mb: 4,
          background: selectedTenant ? "#f7fafd" : "#fff5f5",
          boxShadow: 1,
          transition: "box-shadow 0.2s",
          "&:hover": { boxShadow: 4 },
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {[
            { label: "Seller NTN/CNIC", field: "sellerNTNCNIC" },
            { label: "Seller Business Name", field: "sellerBusinessName" },
            { label: "Seller Address", field: "sellerAddress" },
          ].map(({ label, field }) => (
            <Box key={field} sx={{ flex: "1 1 30%", minWidth: "250px" }}>
              <TextField
                fullWidth
                label={label}
                value={formData[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                variant="outlined"
                disabled={true}
              />
            </Box>
          ))}

          <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
            <FormControl fullWidth>
              <InputLabel id="seller-province-label">Seller Province</InputLabel>
              <Select
                labelId="seller-province-label"
                value={formData.sellerProvince}
                label="Seller Province"
                onChange={(e) => handleChange("sellerProvince", e.target.value)}
                disabled={true}
              >
                {/* Add tenant's province if it's not in the FBR list */}
                {selectedTenant && selectedTenant.sellerProvince && 
                 !province.find(p => p.stateProvinceDesc === selectedTenant.sellerProvince) && (
                  <MenuItem value={selectedTenant.sellerProvince}>
                    {selectedTenant.sellerProvince} (Custom)
                  </MenuItem>
                )}
                {/* Standard FBR provinces */}
                {province.map((prov) => (
                  <MenuItem
                    key={prov.stateProvinceCode}
                    value={prov.stateProvinceDesc}
                  >
                    {prov.stateProvinceDesc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
      {/* Buyer Detail Section */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#1976d2",
          letterSpacing: 1,
        }}
      >
        Buyer Detail
      </Typography>
      <Box
        sx={{
          border: "1px solid #e3e8ee",
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          mb: 4,
          background: "#fff",
          boxShadow: 1,
          transition: "box-shadow 0.2s",
          "&:hover": { boxShadow: 4 },
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
            <Autocomplete
              fullWidth
              options={buyers}
              getOptionLabel={(option) =>
                option.buyerBusinessName
                  ? `${option.buyerBusinessName} (${option.buyerNTNCNIC})`
                  : ""
              }
              value={buyers.find((b) => b.id === selectedBuyerId) || null}
              onChange={(_, newValue) =>
                setSelectedBuyerId(newValue ? newValue.id : "")
              }
              renderInput={(params) => (
                <TextField {...params} label="Select Buyer" variant="outlined" />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionKey={(option) =>
                option.id ||
                option.buyerNTNCNIC ||
                option.buyerBusinessName ||
                option.buyerAddress ||
                Math.random()
              }
            />
          </Box>
        </Box>
        
        {/* Buyer Details Fields - Only show when a buyer is selected */}
        {selectedBuyerId && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3 }}>
            {[
              { label: "Buyer NTN/CNIC", field: "buyerNTNCNIC" },
              { label: "Buyer Business Name", field: "buyerBusinessName" },
              { label: "Buyer Address", field: "buyerAddress" },
            ].map(({ label, field }) => (
              <Box key={field} sx={{ flex: "1 1 30%", minWidth: "250px" }}>
                <TextField
                  fullWidth
                  label={label}
                  value={formData[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  variant="outlined"
                  disabled={true}
                />
              </Box>
            ))}

            <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
              <FormControl fullWidth>
                <InputLabel id="buyer-province-label">Buyer Province</InputLabel>
                <Select
                  labelId="buyer-province-label"
                  value={formData.buyerProvince}
                  label="Buyer Province"
                  onChange={(e) => handleChange("buyerProvince", e.target.value)}
                  disabled={true}
                >
                  {province.map((prov) => (
                    <MenuItem
                      key={prov.stateProvinceCode}
                      value={prov.stateProvinceDesc}
                    >
                      {prov.stateProvinceDesc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
              <FormControl fullWidth>
                <InputLabel id="buyer-registration-type-label">Buyer Registration Type</InputLabel>
                <Select
                  labelId="buyer-registration-type-label"
                  value={formData.buyerRegistrationType}
                  label="Buyer Registration Type"
                  onChange={(e) => handleChange("buyerRegistrationType", e.target.value)}
                  disabled={true}
                >
                  <MenuItem value="Registered">Registered</MenuItem>
                  <MenuItem value="Unregistered">Unregistered</MenuItem>
                  <MenuItem value="Consumer">Consumer</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}
      </Box>
      {/* Transaction Type Section */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#1976d2",
          letterSpacing: 1,
        }}
      >
        Transaction Type
      </Typography>
      <Box
        sx={{
          border: "1px solid #e3e8ee",
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          mb: 4,
          background: "#f7fafd",
          boxShadow: 1,
          transition: "box-shadow 0.2s",
          "&:hover": { boxShadow: 4 },
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
            <FormControl fullWidth>
              <InputLabel id="transaction-type-label">Transaction Type</InputLabel>
              <Select
                labelId="transaction-type-label"
                value={formData.transactionTypeDesc}
                label="Transaction Type"
                onChange={(e) => handleTransactionTypeChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select a transaction type</em>
                </MenuItem>
                {transactionTypes.map((type) => (
                  <MenuItem key={type.transactioN_TYPE_ID} value={type.transactioN_DESC}>
                    {type.transactioN_TYPE_ID} {type.transactioN_DESC}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
      {/* Items Section */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#1976d2",
          letterSpacing: 1,
        }}
      >
        Items
      </Typography>
      {formData.items.map((item, index) => (
        <Box
          key={index}
          sx={{
            mb: 4,
            border: "1px solid #e3e8ee",
            borderRadius: 3,
            p: { xs: 2, sm: 3 },
            boxShadow: 2,
            background: "#fff",
            position: "relative",
            minHeight: "200px",
            transition: "box-shadow 0.2s, border-color 0.2s",
            "&:hover": { boxShadow: 6, borderColor: "#1976d2" },
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
              <Autocomplete
                fullWidth
                options={hsCodeList}
                getOptionLabel={(option) => option.hS_CODE}
                value={
                  hsCodeList.find((code) => code.hS_CODE === item.hsCode) || null
                }
                onChange={(_, newValue) => {
                  handleItemChange(
                    index,
                    "hsCode",
                    newValue ? newValue.hS_CODE : ""
                  );
                  handleItemChange(index, "productDescription", "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="HS Code" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) =>
                  option.hS_CODE === value.hS_CODE
                }
                filterOptions={(options, { inputValue }) =>
                  options.filter((option) =>
                    option.hS_CODE
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  )
                }
              />
            </Box>
            <RateSelector
              key={`RateSelector-${index}`}
              index={index}
              item={item}
              handleItemChange={handleItemChange}
              transactionTypeId={formData.transactionTypeId}
              selectedProvince={formData.sellerProvince}
            />
            <SROScheduleNumber
              key={`SROScheduleNumber-${index}`}
              index={index}
              item={item}
              disabled={!item.isSROScheduleEnabled}
              handleItemChange={handleItemChange}
              RateId={localStorage.getItem("selectedRateId")}
              selectedProvince={formData.sellerProvince}
            />
            <SROItem
              key={`SROItem-${index}`}
              index={index}
              disabled={!item.isSROItemEnabled}
              item={item}
              handleItemChange={handleItemChange}
              SROId={localStorage.getItem("SROId")}
            />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
              <TextField
                fullWidth
                label="Product Description"
                value={item.productDescription || ""}
                onChange={(e) => handleItemChange(index, "productDescription", e.target.value)}
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
              <TextField
                fullWidth
                label="Sales Type"
                type="text"
                value={item.saleType || ""}
                onChange={(e) =>
                  handleItemChange(index, "saleType", e.target.value)
                }
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
              />
            </Box>
            <UnitOfMeasurement
              key={`UnitOfMeasurement-${index}`}
              index={index}
              item={item}
              handleItemChange={handleItemChange}
              hsCode={item.hsCode}
            />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Unit Cost"
                type="text"
                value={item.fixedNotifiedValueOrRetailPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleItemChange(
                      index,
                      "fixedNotifiedValueOrRetailPrice",
                      value
                    );
                  }
                }}
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Qty"
                type="text"
                value={item.quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers
                  if (value === '' || /^\d*$/.test(value)) {
                    handleItemChange(index, "quantity", value);
                  }
                }}
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Value Sales (Excl. ST)"
                type="text"
                value={item.valueSalesExcludingST}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleItemChange(
                      index,
                      "valueSalesExcludingST",
                      value
                    );
                  }
                }}
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Sales Tax Applicable"
                type="text"
                value={item.salesTaxApplicable}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleItemChange(index, "salesTaxApplicable", value);
                  }
                }}
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Total Values"
                type="text"
                value={item.totalValues}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleItemChange(index, "totalValues", value);
                  }
                }}
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="ST Withheld at Source"
                type="text"
                value={item.salesTaxWithheldAtSource}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleItemChange(
                      index,
                      "salesTaxWithheldAtSource",
                      value
                    );
                  }
                }}
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Extra Tax"
                type="text"
                value={item.extraTax}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleItemChange(index, "extraTax", value);
                  }
                }}
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Further Tax"
                type="text"
                value={item.furtherTax}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleItemChange(index, "furtherTax", value);
                  }
                }}
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="FED Payable"
                type="text"
                value={item.fedPayable}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleItemChange(index, "fedPayable", value);
                  }
                }}
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Discount"
                type="text"
                value={item.discount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleItemChange(index, "discount", value);
                  }
                }}
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ position: "relative", mt: 2, textAlign: "right" }}>
            <Button
              variant="contained"
              color="error"
              onClick={() => removeItem(index)}
              sx={{
                mt: 2,
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                boxShadow: 1,
                transition: "background 0.2s",
                "&:hover": { background: "#b71c1c" },
              }}
            >
              Remove Item
            </Button>
          </Box>
        </Box>
      ))}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button
          variant="contained"
          onClick={addNewItem}
          color="success"
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            px: 4,
            py: 1.5,
            boxShadow: 2,
            fontSize: 18,
            letterSpacing: 1,
            transition: "background 0.2s",
            "&:hover": { background: "#388e3c" },
          }}
        >
          + Add New Item
        </Button>
        <Box>
          <Button
            onClick={handleSubmitChange}
            variant="contained"
            color="primary"
            sx={{
              mr: 2,
              borderRadius: 2,
              fontWeight: 700,
              px: 4,
              py: 1.5,
              fontSize: 18,
              letterSpacing: 1,
              boxShadow: 2,
              transition: "background 0.2s",
              "&:hover": { background: "#115293" },
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Submit"
            )}
          </Button>
        </Box>
      </Box>
      {allLoading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bgcolor: "rgba(255,255,255,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={50} color="primary" />
        </Box>
      )}
    </Box>
    </TenantSelectionPrompt>
  );
}