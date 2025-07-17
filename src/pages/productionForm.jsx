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
import { scenarioData } from "../component/ScnerioData";
import { fetchData, postData } from "../API/GetApi";
import RateSelector from "../component/RateSelector";
import SROScheduleNumber from "../component/SROScheduleNumber";
import SROItem from "../component/SROItem";
import UnitOfMeasurement from "../component/UnitOfMeasurement";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API_CONFIG from "../API/Api";

const { apiKeyLocal } = API_CONFIG;

export default function ProductionForm() {
  const [formData, setFormData] = React.useState({
    invoiceType: "Sale Invoice",
    invoiceDate: dayjs(),
    sellerNTNCNIC: "4136940-8",
    sellerBusinessName: "Asghar Ali",
    sellerProvince: "SINDH",
    sellerAddress: "Innovative Solutions, Karachi",
    buyerNTNCNIC: "",
    buyerBusinessName: "",
    buyerProvince: "",
    buyerAddress: "",
    buyerRegistrationType: "Unregistered",
    invoiceRefNo: "",
    scenarioId: "",
    items: [
      {
        hsCode: "",
        productDescription: "",
        rate: "",
        uoM: "",
        quantity: 1,
        totalValues: 0,
        valueSalesExcludingST: 0,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 0,
        salesTaxWithheldAtSource: 0,
        sroScheduleNo: "",
        sroItemSerialNo: "",
        saleType: "Goods at standard rate (default)",
        isSROScheduleEnabled: false,
        isSROItemEnabled: false,
        extraTax: "",
        furtherTax: 0,
        fedPayable: 0,
        discount: 0,
        isValueSalesManual: false,
      },
    ],
  });

  const [scenario, setScenario] = React.useState([]);
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

  React.useEffect(() => {
    setAllLoading(true);
    const token = localStorage.getItem("token");
    Promise.allSettled([
      fetchData("pdi/v1/provinces", token).then((response) => {
        setProvince(response);
        localStorage.setItem("provinceResponse", JSON.stringify(response));
      }),
      fetch("https://gw.fbr.gov.pk/pdi/v1/itemdesccode", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data) =>
          setHsCodeList(data.map((item) => ({ hS_CODE: item.hS_CODE })))
        )
        .catch(() => setHsCodeList([])),
      fetch("https://gw.fbr.gov.pk/pdi/v1/doctypecode", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data) => setInvoiceTypes(data))
        .catch(() =>
          setInvoiceTypes([
            { docTypeId: 4, docDescription: "Sale Invoice" },
            { docTypeId: 9, docDescription: "Debit Note" },
          ])
        ),
      fetchData("pdi/v1/transtypecode", token).then((res) => setScenario(res)),
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
    const buyer = buyers.find((b) => b._id === selectedBuyerId);
    if (buyer) {
      setFormData((prev) => ({
        ...prev,
        buyerNTNCNIC: buyer.buyerNTNCNIC || "",
        buyerBusinessName: buyer.buyerBusinessName || "",
        buyerProvince: buyer.buyerProvince || "",
        buyerAddress: buyer.buyerAddress || "",
        buyerRegistrationType: buyer.buyerRegistrationType || "Unregistered",
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

      // Update the field
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
        item[field] = parseValue(value, field !== "extraTax");
        if (field === "valueSalesExcludingST") {
          item.isValueSalesManual = true;
        }
      } else {
        item[field] = value;
      }

      // Handle SRO reset logic
      if (field === "rate" && value) {
        item.isSROScheduleEnabled = value.toLowerCase() === "exempt";
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
        const quantity = parseFloat(item.quantity || 0);
        const unitCost = parseFloat(item.fixedNotifiedValueOrRetailPrice || 0);
        const retailPrice = unitCost * quantity;
        const rate = parseFloat((item.rate || "0").replace("%", "")) || 0;

        const isThirdSchedule =
          item.saleType === "3rd Schedule Goods" ||
          prev.scenarioId === "SN027" ||
          prev.scenarioId === "SN008";

        if (isThirdSchedule) {
          item.valueSalesExcludingST = retailPrice;
          let rateFraction = rate / 100;
          item.salesTaxApplicable = Number(
            (item.valueSalesExcludingST * rateFraction).toFixed(2)
          );
          item.totalValues = Number(
            (item.valueSalesExcludingST + item.salesTaxApplicable).toFixed(2)
          );
        } else {
          item.valueSalesExcludingST = retailPrice;
          let rateFraction = 0;
          if (item.rate && item.rate.toLowerCase() !== "exempt" && item.rate !== "0%") {
            rateFraction = rate / 100;
            item.salesTaxApplicable = Number(
              (item.valueSalesExcludingST * rateFraction).toFixed(2)
            );
          } else {
            item.salesTaxApplicable = 0;
            item.salesTaxWithheldAtSource = 0;
          }
          item.totalValues = Number(
            (item.valueSalesExcludingST + item.salesTaxApplicable).toFixed(2)
          );
        }
      }

      // Parse extra fields as numbers
      item.extraTax = parseValue(item.extraTax, false);
      item.furtherTax = parseValue(item.furtherTax);
      item.fedPayable = parseValue(item.fedPayable);
      item.discount = parseValue(item.discount);

      // Avoid overwriting 3rd Schedule totals
      const isThirdSchedule =
        item.saleType === "3rd Schedule Goods" ||
        prev.scenarioId === "SN027" ||
        prev.scenarioId === "SN008";

      if (!isThirdSchedule) {
        item.totalValues =
          Number(item.valueSalesExcludingST) +
          Number(item.salesTaxApplicable) +
          Number(item.furtherTax) +
          Number(item.fedPayable) +
          (item.extraTax !== "" ? Number(item.extraTax) : 0) -
          Number(item.discount);

        item.totalValues = Number(item.totalValues.toFixed(2));
      }

      if (!isThirdSchedule) {
        item.salesTaxApplicable = Number(item.salesTaxApplicable.toFixed(2));
      }

      updatedItems[index] = item;
      return { ...prev, items: updatedItems };
    });
  };

  const addNewItem = () => {
    const selectedScenario = scenarioData.find(
      (item) => item.id === formData.scenarioId
    );
    const saleType = selectedScenario
      ? selectedScenario.saleType
      : "Goods at standard rate (default)";

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          hsCode: "",
          productDescription: selectedScenario ? selectedScenario.description : "",
          rate: "",
          uoM: "",
          quantity: 1,
          totalValues: 0,
          valueSalesExcludingST: 0,
          fixedNotifiedValueOrRetailPrice: 0,
          salesTaxApplicable: 0,
          salesTaxWithheldAtSource: 0,
          sroScheduleNo: "",
          sroItemSerialNo: "",
          extraTax: "",
          furtherTax: 0,
          fedPayable: 0,
          discount: 0,
          saleType,
          isSROScheduleEnabled: false,
          isSROItemEnabled: false,
          isValueSalesManual: false,
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

  const handleScenarioChange = (id) => {
    const selectedScenario = scenarioData.find((item) => item.id === id);

    if (!selectedScenario) {
      setFormData((prev) => ({
        ...prev,
        scenarioId: id,
      }));
      localStorage.removeItem("saleType");
      localStorage.removeItem("productDescription");
      localStorage.removeItem("transactionTypeId");
      return;
    }

    let saleType = selectedScenario.saleType || "";
    let transactionTypeId = null;

    if (id === "SN016") {
      saleType = "Processing/Conversion of Goods";
      transactionTypeId = "25";
    } else if (id === "SN024") {
      saleType = "Goods as per SRO.297(I)/2023";
      transactionTypeId = "139";
    } else {
      const normalize = (str) => str?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const matchingApiRecord = scenario.find(
        (item) =>
          item.transactioN_DESC &&
          normalize(item.transactioN_DESC) === normalize(saleType)
      );
      if (matchingApiRecord) {
        transactionTypeId = matchingApiRecord.transactioN_TYPE_ID;
        saleType = matchingApiRecord.transactioN_DESC;
      }
    }

    localStorage.setItem("saleType", saleType);
    localStorage.setItem("productDescription", selectedScenario.description);
    if (transactionTypeId) {
      localStorage.setItem("transactionTypeId", transactionTypeId);
    } else {
      localStorage.removeItem("transactionTypeId");
    }

    setFormData((prev) => {
      const items = prev.items.length > 0
        ? prev.items.map((item) => ({
            ...item,
            productDescription: selectedScenario.description,
            saleType: saleType,
          }))
        : [
            {
              hsCode: "",
              productDescription: selectedScenario.description,
              rate: "",
              uoM: "",
              quantity: 1,
              totalValues: 0,
              valueSalesExcludingST: 0,
              fixedNotifiedValueOrRetailPrice: 0,
              salesTaxApplicable: 0,
              salesTaxWithheldAtSource: 0,
              sroScheduleNo: "",
              sroItemSerialNo: "",
              extraTax: "",
              furtherTax: 0,
              fedPayable: 0,
              discount: 0,
              saleType,
              isSROScheduleEnabled: false,
              isSROItemEnabled: false,
              isValueSalesManual: false,
            },
          ];
      return {
        ...prev,
        scenarioId: id,
        items,
      };
    });
  };

  const handleSubmitChange = async () => {
    setLoading(true);
    try {
      // Validate required fields for invoice header
      const requiredFields = [
        { field: "invoiceType", message: "Invoice Type is required (Error 0011)" },
        { field: "invoiceDate", message: "Invoice Date is required (Error 0042)" },
        { field: "sellerNTNCNIC", message: "Seller NTN/CNIC is required (Error 0108)" },
        { field: "sellerBusinessName", message: "Seller Business Name is required" },
        { field: "sellerProvince", message: "Seller Province is required" },
        { field: "sellerAddress", message: "Seller Address is required" },
        { field: "buyerBusinessName", message: "Buyer Business Name is required (Error 0160)" },
        { field: "buyerProvince", message: "Buyer Province is required" },
        { field: "buyerAddress", message: "Buyer Address is required" },
        { field: "buyerRegistrationType", message: "Buyer Registration Type is required (Error 0012)" },
      ];

      for (const { field, message } of requiredFields) {
        if (!formData[field] || formData[field] === "") {
          Swal.fire({
            icon: "error",
            title: "Validation Error",
            text: message,
            confirmButtonColor: "#d33",
          });
          setLoading(false);
          return;
        }
      }

      // Validate buyerNTNCNIC for registered buyers
      if (formData.buyerRegistrationType === "Registered" && !formData.buyerNTNCNIC) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Buyer NTN/CNIC is required for registered buyers (Error 0009)",
          confirmButtonColor: "#d33",
        });
        setLoading(false);
        return;
      }

      // Validate invoiceRefNo for Debit Note
      if (formData.invoiceType === "Debit Note" && !formData.invoiceRefNo) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Invoice Reference No. is required for Debit Note (Error 0026)",
          confirmButtonColor: "#d33",
        });
        setLoading(false);
        return;
      }

      // Validate items
      for (const [index, item] of formData.items.entries()) {
        const itemRequiredFields = [
          { field: "hsCode", message: `HS Code is required for item ${index + 1} (Error 0044)` },
          { field: "productDescription", message: `Product Description is required for item ${index + 1}` },
          { field: "rate", message: `Rate is required for item ${index + 1} (Error 0046)` },
          { field: "uoM", message: `Unit of Measurement is required for item ${index + 1} (Error 0099)` },
          { field: "quantity", message: `Quantity is required for item ${index + 1} (Error 0098)` },
          { field: "valueSalesExcludingST", message: `Value Sales Excluding ST is required for item ${index + 1} (Error 0167)` },
          ...(item.rate.toLowerCase() === "exempt" || formData.scenarioId === "SN006" || formData.scenarioId === "SN007"
            ? [
                { field: "sroScheduleNo", message: `SRO Schedule Number is required for exempt item ${index + 1} (Error 0077)` },
                { field: "sroItemSerialNo", message: `SRO Item Serial Number is required for exempt item ${index + 1} (Error 0078)` },
              ]
            : []),
        ];

        for (const { field, message } of itemRequiredFields) {
          if (!item[field] || (field === "valueSalesExcludingST" && item[field] <= 0)) {
            Swal.fire({
              icon: "error",
              title: "Validation Error",
              text: message,
              confirmButtonColor: "#d33",
            });
            setLoading(false);
            return;
          }
        }

        // Validate specific scenarios (e.g., Cotton Ginners)
        if (formData.scenarioId === "SN009" && formData.buyerRegistrationType !== "Registered") {
          Swal.fire({
            icon: "error",
            title: "Validation Error",
            text: "Cotton Ginners allowed against registered buyers only (Error 0168)",
            confirmButtonColor: "#d33",
          });
          setLoading(false);
          return;
        }
      }

      const cleanedItems = formData.items.map(
        ({ isSROScheduleEnabled, isSROItemEnabled, isValueSalesManual, ...rest }) => ({
          ...rest,
          quantity: rest.quantity === "" ? 0 : parseInt(rest.quantity, 10),
          sroScheduleNo: rest.sroScheduleNo?.trim() || "",
          sroItemSerialNo: rest.sroItemSerialNo?.trim() || "",
          productDescription: rest.productDescription?.trim() || "N/A",
          saleType: rest.saleType?.trim() || "Goods at standard rate (default)",
          extraTax: (rest.extraTax !== undefined && rest.extraTax !== null && rest.extraTax !== "" && Number(rest.extraTax) !== 0)
            ? parseInt(rest.extraTax, 10)
            : "",
          furtherTax: Number(rest.furtherTax) || 0,
          fedPayable: Number(rest.fedPayable) || 0,
          discount: Number(rest.discount) || 0,
          salesTaxApplicable: Number(Number(rest.salesTaxApplicable).toFixed(2)),
          totalValues: Number(Number(rest.totalValues).toFixed(2)),
        })
      );

      const cleanedData = {
        ...formData,
        invoiceDate: dayjs(formData.invoiceDate).format("YYYY-MM-DD"),
        items: cleanedItems,
      };

      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Authentication Error",
          text: "No security token found. Please log in again (Error 401)",
          confirmButtonColor: "#d33",
        });
        setLoading(false);
        return;
      }

      const validateRes = await postData("di_data/v1/di/validateinvoicedata", cleanedData, token);

      if (validateRes.status === 200 && validateRes.data.validationResponse.statusCode === "00") {
        try {
          const postRes = await postData("di_data/v1/di/postinvoicedata", cleanedData, token);
          if (postRes.status === 200 && postRes.data.validationResponse.statusCode === "00") {
            const createInvoiceResponse = await axios.post(
              "http://45.55.137.96:5150/create-invoice",
              {
                ...cleanedData,
                invoiceNumber: postRes.data.invoiceNumber,
                dated: postRes.data.dated,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (createInvoiceResponse.status === 201) {
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
            }
          } else {
            const errorCode = postRes.data.validationResponse.errorCode;
            const errorMessage = postRes.data.validationResponse.error || "Invoice submission failed.";
            Swal.fire({
              icon: "error",
              title: `Submission Error (${errorCode || "Unknown"})`,
              text: errorMessage,
              confirmButtonColor: "#d33",
            });
          }
        } catch (postError) {
          const errorCode = postError.response?.data?.validationResponse?.errorCode || "500";
          const errorMessage =
            postError.response?.data?.validationResponse?.error ||
            postError.message ||
            "Internal Server Error (Contact Administrator)";
          Swal.fire({
            icon: "error",
            title: `Submission Error (${errorCode})`,
            text: errorMessage,
            confirmButtonColor: "#d33",
          });
        }
      } else {
        const errorCode = validateRes.data.validationResponse.errorCode || "Unknown";
        const errorMessage = validateRes.data.validationResponse.error || "Invoice validation failed.";
        Swal.fire({
          icon: "error",
          title: `Validation Error (${errorCode})`,
          text: errorMessage,
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      const errorCode = error.response?.status === 401 ? "401" : "500";
      const errorMessage =
        errorCode === "401"
          ? "Unauthorized: Invalid or expired token"
          : "Internal Server Error (Contact Administrator)";
      Swal.fire({
        icon: "error",
        title: `Error (${errorCode})`,
        text: errorMessage,
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!isPrintable) {
      Swal.fire({
        icon: "warning",
        title: "Cannot Print",
        text: "Please submit the invoice successfully before printing.",
        confirmButtonColor: "#d33",
      });
      return;
    }
    // Placeholder for QR code and logo printing
    // QR Code: Version 2.0, 25x25, 1.0x1.0 inch
    // Include FBR Digital Invoicing System logo
    console.log("Printing invoice with QR code and FBR logo", formData);
    // Implement actual printing logic here (e.g., generate PDF with QR code)
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)",
        borderRadius: 4,
        mt: 8,
        boxShadow: 6,
        maxWidth: 1200,
        mx: "auto",
        mb: 6,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 900,
          textTransform: "uppercase",
          color: "#1976d2",
          letterSpacing: 2,
          textAlign: "center",
        }}
      >
        Invoice Creation
      </Typography>
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
              value={buyers.find((b) => b._id === selectedBuyerId) || null}
              onChange={(_, newValue) =>
                setSelectedBuyerId(newValue ? newValue._id : "")
              }
              renderInput={(params) => (
                <TextField {...params} label="Select Buyer" variant="outlined" />
              )}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              getOptionKey={(option) =>
                option._id ||
                option.buyerNTNCNIC ||
                option.buyerBusinessName ||
                option.buyerAddress ||
                Math.random()
              }
            />
          </Box>
        </Box>
      </Box>
      {/* Scenario Section */}
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
        Scenario
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
              <InputLabel id="scenarioId">Scenario</InputLabel>
              <Select
                labelId="scenarioId"
                name="scenarioId"
                value={formData.scenarioId ?? ""}
                label="Scenario"
                onChange={(e) => handleScenarioChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select a scenario</em>
                </MenuItem>
                {scenarioData.map((curElem) => (
                  <MenuItem key={curElem.id} value={curElem.id}>
                    {curElem.id} - {curElem.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        {formData.scenarioId && (
          <Typography
            variant="body2"
            sx={{ mt: 1, ml: 2, color: "text.secondary" }}
          >
            {scenarioData.find((s) => s.id === formData.scenarioId)?.description ||
              ""}
          </Typography>
        )}
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
                  const selectedScenario = scenarioData.find(
                    (s) => s.id === formData.scenarioId
                  );
                  handleItemChange(
                    index,
                    "productDescription",
                    selectedScenario ? selectedScenario.description : ""
                  );
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
              transactionTypeId={localStorage.getItem("transactionTypeId")}
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
                InputProps={{
                  readOnly: true,
                }}
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
                type="number"
                value={item.fixedNotifiedValueOrRetailPrice}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "fixedNotifiedValueOrRetailPrice",
                    e.target.value
                  )
                }
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Qty"
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Value Sales (Excl. ST)"
                type="number"
                value={item.valueSalesExcludingST}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "valueSalesExcludingST",
                    e.target.value
                  )
                }
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Sales Tax Applicable"
                type="number"
                value={item.salesTaxApplicable}
                onChange={(e) =>
                  handleItemChange(index, "salesTaxApplicable", e.target.value)
                }
                variant="outlined"
              />
            </Box>

            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Total Values"
                type="number"
                value={item.totalValues}
                onChange={(e) =>
                  handleItemChange(index, "totalValues", e.target.value)
                }
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="ST Withheld at Source"
                type="number"
                value={item.salesTaxWithheldAtSource}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "salesTaxWithheldAtSource",
                    e.target.value
                  )
                }
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Extra Tax"
                type="number"
                value={item.extraTax}
                onChange={(e) =>
                  handleItemChange(index, "extraTax", e.target.value)
                }
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Further Tax"
                type="number"
                value={item.furtherTax}
                onChange={(e) =>
                  handleItemChange(index, "furtherTax", e.target.value)
                }
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="FED Payable"
                type="number"
                value={item.fedPayable}
                onChange={(e) =>
                  handleItemChange(index, "fedPayable", e.target.value)
                }
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Discount"
                type="number"
                value={item.discount}
                onChange={(e) =>
                  handleItemChange(index, "discount", e.target.value)
                }
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
            onClick={handlePrintInvoice}
            variant="contained"
            color="secondary"
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
              "&:hover": { background: "#6d1b7b" },
            }}
            disabled={!isPrintable}
          >
            Print Invoice
          </Button>
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
  );
}