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
import { useNavigate } from 'react-router-dom';

export default function CreateInvoice() {
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
    scenarioId: "",
    items: [
      {
        hsCode: "0304.5400",
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
        saleType: "",
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
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.clear(); // Clear all local storage
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getProvince = async () => {
    try {
      const response = await fetchData("pdi/v1/provinces");
      console.log("Province Response:", response);
      setProvince(response);
      localStorage.setItem("provinceResponse", JSON.stringify(response));
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };
  React.useEffect(() => {
    getProvince();
  }, []);

  React.useEffect(() => {
    const fetchHsCodes = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("https://gw.fbr.gov.pk/pdi/v1/itemdesccode", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch HS Codes");
        const data = await response.json();
        setHsCodeList(data);
      } catch (error) {
        // fallback to static list if API fails
        setHsCodeList([
          { hS_CODE: "0304.5400", description: "Sample Fish" },
          { hS_CODE: "0101.2100", description: "Sample Animal" },
          { hS_CODE: "0207.1400", description: "Sample Poultry" },
          { hS_CODE: "0402.2100", description: "Sample Dairy" },
          { hS_CODE: "0703.1000", description: "Sample Veg" }
        ]);
      }
    };
    fetchHsCodes();
  }, []);

  React.useEffect(() => {
    const fetchInvoiceTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("https://gw.fbr.gov.pk/pdi/v1/doctypecode", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch invoice types");
        const data = await response.json();
        setInvoiceTypes(data);
      } catch (error) {
        setInvoiceTypes([
          { docTypeId: 4, docDescription: "Sale Invoice" },
          { docTypeId: 9, docDescription: "Debit Note" }
        ]);
      }
    };
    fetchInvoiceTypes();
  }, []);

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index] };

      if (field === "quantity") {
        item.quantity = value === "" ? "" : parseInt(value, 10) || 0;
        // Only auto-calculate if not manually overridden
        if (!item.isValueSalesManual) {
          const unitCost = parseFloat(item.fixedNotifiedValueOrRetailPrice || 0);
          const quantity = parseFloat(item.quantity || 0);
          item.valueSalesExcludingST = unitCost * quantity;
        }
      } else if (field === "fixedNotifiedValueOrRetailPrice") {
        item.fixedNotifiedValueOrRetailPrice = value === "" ? 0 : parseFloat(value);
        if (!item.isValueSalesManual) {
          const unitCost = parseFloat(item.fixedNotifiedValueOrRetailPrice || 0);
          const quantity = parseFloat(item.quantity || 0);
          item.valueSalesExcludingST = unitCost * quantity;
        }
      } else if (field === "valueSalesExcludingST") {
        // Allow direct editing and recalculate dependent fields
        item.valueSalesExcludingST = value === "" ? 0 : parseFloat(value);
        item.isValueSalesManual = true;
        if (item.rate && item.rate.toLowerCase() !== 'exempt') {
          let rateFraction = parseFloat((item.rate || "0").replace("%", "")) / 100;
          const valueSales = item.valueSalesExcludingST;
          const salesTax = Math.round(valueSales * rateFraction);
          const totalValues = valueSales + salesTax;
          const withheld = salesTax;
          item.salesTaxApplicable = salesTax;
          item.totalValues = totalValues;
          item.salesTaxWithheldAtSource = withheld;
        } else {
          item.salesTaxApplicable = 0;
          item.totalValues = 0;
          item.salesTaxWithheldAtSource = 0;
        }
      } else {
        item[field] = value;
      }

      if (field === "rate" && value) {
        item.isSROScheduleEnabled = true;
        item.sroScheduleNo = "";
        item.sroItemSerialNo = "";
        item.isSROItemEnabled = false;
        item.isValueSalesManual = false; // Reset manual override on rate change
      }

      if (field === "sroScheduleNo" && value) {
        item.isSROItemEnabled = true;
        item.sroItemSerialNo = "";
      }

      // If rate is 'Exempt', set all calculated fields to 0
      if (item.rate && (item.rate.toLowerCase() === 'exempt' || value.toLowerCase() === 'exempt')) {
        item.valueSalesExcludingST = 0;
        item.salesTaxApplicable = 0;
        item.totalValues = 0;
        item.salesTaxWithheldAtSource = 0;
        item.extraTax = 0;
        item.furtherTax = 0;
        item.fedPayable = 0;
        item.discount = 0;
      } else if (field !== "valueSalesExcludingST") {
        let rateFraction = parseFloat((item.rate || "0").replace("%", "")) / 100;
        const unitCost = parseFloat(item.fixedNotifiedValueOrRetailPrice || 0);
        const quantity = parseFloat(item.quantity || 0);
        // Only auto-calculate if not manually overridden
        let valueSales = item.valueSalesExcludingST;
        if (!item.isValueSalesManual) {
          valueSales = unitCost * quantity;
          item.valueSalesExcludingST = valueSales;
        }
        if (
          (field === "fixedNotifiedValueOrRetailPrice" ||
            field === "quantity" ||
            field === "rate") &&
          unitCost >= 0 &&
          quantity > 0 &&
          rateFraction >= 0
        ) {
          // Use integer sales tax for FBR
          const salesTax = Math.round(valueSales * rateFraction);
          const totalValues = valueSales + salesTax;
          const withheld = salesTax;

          // Debug log
          console.log({
            valueSalesExcludingST: valueSales,
            rate: item.rate,
            rateFraction,
            salesTaxApplicable: salesTax,
            calculated: Math.round(valueSales * rateFraction * 100) / 100
          });

          item.salesTaxApplicable = salesTax;
          item.totalValues = totalValues;
          item.salesTaxWithheldAtSource = withheld;

          item.extraTax = "";
          item.furtherTax = 0;
          item.fedPayable = 0;
          item.discount = 0;
        }
      }

      updatedItems[index] = item;
      return { ...prev, items: updatedItems };
    });
  };

  const addNewItem = () => {
    // Find the selected scenario's saleType
    const selectedScenario = scenarioData.find((item) => item.id === formData.scenarioId);
    const saleType = selectedScenario ? selectedScenario.saleType : "Goods at Standard Rate (default)";

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          hsCode: "",
          productDescription: "",
          rate: "18%",
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
          saleType, // <-- set saleType here
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

  const getScenarioData = async () => {
    localStorage.setItem("token", "63f756ee-69e4-3b5b-a3b7-0b8656624912");
    try {
      const res = await fetchData("pdi/v1/transtypecode");
      setScenario(res);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    getScenarioData();
  }, []);

  const handleScenarioChange = (id) => {
    const selectedScenario = scenarioData.find((item) => item.id === id);

    if (!selectedScenario) {
      setFormData((prev) => ({
        ...prev,
        scenarioId: id,
      }));
      localStorage.removeItem("saleType");
      return;
    }

    const localDescription = selectedScenario.saleType;
    localStorage.setItem("productDescription", selectedScenario.description);
    const matchingApiRecord = scenario.find(
      (item) =>
        item.transactioN_DESC &&
        item.transactioN_DESC.trim().toLowerCase() ===
          localDescription.trim().toLowerCase()
    );

    if (matchingApiRecord) {
      localStorage.setItem(
        "transactionTypeId",
        matchingApiRecord.transactioN_TYPE_ID
      );
      localStorage.setItem("saleType", matchingApiRecord.transactioN_DESC);

      setFormData((prev) => ({
        ...prev,
        scenarioId: id,
        buyerRegistrationType: id === "SN001" ? "Registered" : "Unregistered",
        items: prev.items.map((item) => ({
          ...item,
          productDescription: selectedScenario.description,
          sroScheduleNo: "",
          sroItemSerialNo: "",
          rate: "18%",
          fixedNotifiedValueOrRetailPrice: 0,
          quantity: 1,
          valueSalesExcludingST: 0,
          salesTaxApplicable: 0,
          totalValues: 0,
          salesTaxWithheldAtSource: 0,
          extraTax: "",
          furtherTax: 0,
          fedPayable: 0,
          discount: 0,
          saleType:
            matchingApiRecord?.transactioN_DESC ??
            selectedScenario.saleType ??
            "",
          isSROScheduleEnabled: false,
          isSROItemEnabled: false,
          isValueSalesManual: false,
        })),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        scenarioId: id,
      }));
    }
  };

  // const handleSubmitChange = async () => {
  //   setLoading(true);
  //   try {
  //     const cleanedItems = formData.items.map(
  //       ({ isSROScheduleEnabled, isSROItemEnabled, ...rest }) => ({
  //         ...rest,
  //         sroScheduleNo:
  //           rest.sroScheduleNo?.trim() !== "" ? rest.sroScheduleNo : "",
  //         sroItemSerialNo:
  //           rest.sroItemSerialNo?.trim() !== "" ? rest.sroItemSerialNo : "",
  //         productDescription:
  //           rest.productDescription?.trim() !== ""
  //             ? rest.productDescription
  //             : "N/A",
  //         saleType:
  //           rest.saleType?.trim() !== ""
  //             ? rest.saleType
  //             : "Goods at standard rate (default)",
  //       })
  //     );

  //     const cleanedData = {
  //       ...formData,
  //       invoiceDate: dayjs(formData.invoiceDate).format("YYYY-MM-DD"),
  //       items: cleanedItems,
  //     };

  //     const res = await postData(
  //       "di_data/v1/di/validateinvoicedata_sb",
  //       cleanedData
  //     );

  //     if (
  //       res.status === 200 &&
  //       res?.data?.validationResponse?.statusCode === "01"
  //     ) {
  //       Swal.fire({
  //         icon: "error",
  //         title: "Error",
  //         text:
  //           res?.data?.validationResponse?.error ||
  //           "Invoice submission failed.",
  //         confirmButtonColor: "#d33",
  //       });
  //       setIsPrintable(true); // Enable print option after successful submission
  //     }

  //     if (
  //       res.status === 200 &&
  //       res?.data?.validationResponse?.statusCode === "00"
  //     ) {
  //       Swal.fire({
  //         icon: "success",
  //         title: "Success",
  //         text: "Invoice submitted successfully!",
  //         confirmButtonColor: "#28a745",
  //       });
  //       setIsPrintable(true); // Enable print option after successful submission
  //     }
  //   } catch (error) {
  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text: "Failed to submit the invoice. Please try again.",
  //       confirmButtonText: "OK",
  //       confirmButtonColor: "#d33",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmitChange = async () => {
    setLoading(true);
    try {
      // Validate required fields (unchanged from previous response)
      const requiredFields = [
        { field: "invoiceType", message: "Invoice Type is required" },
        { field: "invoiceDate", message: "Invoice Date is required" },
        { field: "sellerNTNCNIC", message: "Seller NTN/CNIC is required" },
        {
          field: "sellerBusinessName",
          message: "Seller Business Name is required",
        },
        { field: "sellerProvince", message: "Seller Province is required" },
        { field: "sellerAddress", message: "Seller Address is required" },
        {
          field: "buyerBusinessName",
          message: "Buyer Business Name is required",
        },
        { field: "buyerProvince", message: "Buyer Province is required" },
        { field: "buyerAddress", message: "Buyer Address is required" },
        {
          field: "buyerRegistrationType",
          message: "Buyer Registration Type is required",
        },
      ];

      for (const { field, message } of requiredFields) {
        if (!formData[field]) {
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

      // Validate buyerNTNCNIC for registered buyers
      if (
        formData.buyerRegistrationType === "Registered" &&
        !formData.buyerNTNCNIC
      ) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Buyer NTN/CNIC is required for registered buyers",
          confirmButtonColor: "#d33",
        });
        setLoading(false);
        return;
      }

      // Validate items
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
          // Only require valueSalesExcludingST if rate is not Exempt
          ...((item.rate && item.rate.toLowerCase() === 'exempt') ? [] : [{
            field: "valueSalesExcludingST",
            message: `Value Sales Excluding ST is required for item ${index + 1}`,
          }]),
          {
            field: "salesTaxApplicable",
            message: `Sales Tax Applicable is required for item ${index + 1}`,
          },
          {
            field: "saleType",
            message: `Sale Type is required for item ${index + 1}`,
          },
        ];

        for (const { field, message } of itemRequiredFields) {
          if (!item[field]) {
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
        ({ isSROScheduleEnabled, isSROItemEnabled, ...rest }) => ({
          ...rest,
          quantity: rest.quantity === "" ? 0 : parseInt(rest.quantity, 10),
          sroScheduleNo: rest.sroScheduleNo?.trim() || "",
          sroItemSerialNo: rest.sroItemSerialNo?.trim() || "",
          productDescription: rest.productDescription?.trim() || "N/A",
          saleType: rest.saleType?.trim() || "Goods at standard rate (default)",
        })
      );

      const cleanedData = {
        ...formData,
        invoiceDate: dayjs(formData.invoiceDate).format("YYYY-MM-DD"),
        items: cleanedItems,
      };

      // Log token for debugging
      const token = localStorage.getItem("token");
      console.log("Token used:", token);

      // Step 1: Validate invoice data
      const validateRes = await postData(
        "di_data/v1/di/validateinvoicedata_sb",
        cleanedData
      );

      if (
        validateRes.status === 200 &&
        validateRes.data.validationResponse.statusCode === "00"
      ) {
        // Step 2: Post invoice data
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
            const createInvoiceResponse = await axios.post(
              "http://45.55.137.96:5150/create-invoice",
              {
                ...cleanedData,
                invoiceNumber: postRes.data.invoiceNumber,
                dated: postRes.data.dated,
              }
            );
            console.log("Create Invoice Response:", createInvoiceResponse);
            if (createInvoiceResponse.status === 201) {
              Swal.fire({
                icon: "success",
                title: "Success",
                text: `Invoice submitted successfully! Invoice Number: ${postRes.data.invoiceNumber}`,
                confirmButtonColor: "#28a745",
                willClose: () => {
                  navigate('/yourinvoices');
                }
              });
              setIsPrintable(true);
            }
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
    printInvoice(formData); // Print the current form data
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f0f2f5", borderRadius: 2, mt: 8 }}>
      {/* Invoice Section */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: "bold",
          textTransform: "uppercase",
          color: "primary.main",
        }}
      >
        Invoice
      </Typography>
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: 2,
          p: 3,
          mb: 4,
          backgroundColor: "#ffffff",
          boxShadow: 2,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
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
            />
          </Box>
        </Box>
      </Box>

      {/* Seller Section */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: "bold",
          textTransform: "uppercase",
          color: "primary.main",
        }}
      >
        Seller Detail
      </Typography>
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: 2,
          p: 3,
          mb: 4,
          backgroundColor: "#ffffff",
          boxShadow: 2,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
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
              />
            </Box>
          ))}

          <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
            <FormControl fullWidth>
              <InputLabel id="seller-province-label">
                Seller Province
              </InputLabel>
              <Select
                labelId="seller-province-label"
                value={formData.sellerProvince}
                label="Seller Province"
                onChange={(e) => handleChange("sellerProvince", e.target.value)}
              >
                {province.map((prov) => (
                  <MenuItem key={prov.stateProvinceCode} value={prov.stateProvinceDesc}>
                    {prov.stateProvinceDesc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Buyer Section */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: "bold",
          textTransform: "uppercase",
          color: "primary.main",
        }}
      >
        Buyer Detail
      </Typography>
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: 2,
          p: 3,
          mb: 4,
          backgroundColor: "#ffffff",
          boxShadow: 2,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
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
              >
                {province.map((prov) => (
                  <MenuItem key={prov.stateProvinceCode} value={prov.stateProvinceDesc}>
                    {prov.stateProvinceDesc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
            <FormControl fullWidth>
              <InputLabel id="buyer-registration-type-label">
                Buyer Registration Type
              </InputLabel>
              <Select
                labelId="buyer-registration-type-label"
                value={formData.buyerRegistrationType}
                label="Buyer Registration Type"
                onChange={(e) => handleChange("buyerRegistrationType", e.target.value)}
                inputProps={{ readOnly: formData.scenarioId === "SN001" }}
                disabled={formData.scenarioId === "SN001"}
              >
                <MenuItem value="Registered">Registered</MenuItem>
                <MenuItem value="Unregistered">Unregistered</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Scenario ID Section */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: "bold",
          textTransform: "uppercase",
          color: "primary.main",
        }}
      >
        Scenario
      </Typography>
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: 2,
          p: 3,
          mb: 4,
          backgroundColor: "#ffffff",
          boxShadow: 2,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
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
        {/* Show selected scenario description */}
        {formData.scenarioId && (
          <Typography variant="body2" sx={{ mt: 1, ml: 2, color: 'text.secondary' }}>
            {scenarioData.find((s) => s.id === formData.scenarioId)?.description || ''}
          </Typography>
        )}
      </Box>

      {/* Items Section */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: "bold",
          textTransform: "uppercase",
          color: "primary.main",
        }}
      >
        Items
      </Typography>
      {formData.items.map((item, index) => (
        <Box
          key={index}
          sx={{
            mb: 4,
            border: "1px solid #ccc",
            borderRadius: 2,
            p: 2,
            boxShadow: 1,
            backgroundColor: "#fafafa",
            position: "relative",
            minHeight: "200px",
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            {/* Move HS Code to the first field */}
            <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
              <Autocomplete
                fullWidth
                options={hsCodeList}
                getOptionLabel={(option) => option.hS_CODE}
                value={hsCodeList.find((code) => code.hS_CODE === item.hsCode) || null}
                onChange={(_, newValue) => {
                  handleItemChange(index, "hsCode", newValue ? newValue.hS_CODE : "");
                  handleItemChange(index, "productDescription", newValue ? newValue.description : "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="HS Code" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) => option.hS_CODE === value.hS_CODE}
                filterOptions={(options, { inputValue }) =>
                  options.filter(
                    (option) =>
                      option.hS_CODE.toLowerCase().includes(inputValue.toLowerCase()) ||
                      option.description.toLowerCase().includes(inputValue.toLowerCase())
                  )
                }
              />
            </Box>
            <SROItem
              key={`SROItem-${index}`}
              index={index}
              disabled={!item.isSROItemEnabled}
              item={item}
              handleItemChange={handleItemChange}
              SROId={localStorage.getItem("SROId")}
            />
            <SROScheduleNumber
              key={`SROScheduleNumber-${index}`}
              index={index}
              item={item}
              disabled={!item.isSROScheduleEnabled}
              handleItemChange={handleItemChange}
              RateId={localStorage.getItem("selectedRateId")}
              selectedProvince={formData.buyerProvince}
            />
            <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
              <TextField
                fullWidth
                label="Product Description"
                value={item.productDescription}
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <UnitOfMeasurement
              key={`UnitOfMeasurement-${index}`}
              index={index}
              item={item}
              handleItemChange={handleItemChange}
              hsCode="0304.5400"
            />

            <RateSelector
              key={`RateSelector-${index}`}
              index={index}
              item={item}
              handleItemChange={handleItemChange}
              transactionTypeId={localStorage.getItem("transactionTypeId")}
              selectedProvince={formData.buyerProvince}
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
                InputProps={{ readOnly: true }}
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
                InputProps={{ readOnly: true }}
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
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Extra Tax"
                type="number"
                value={item.extraTax}
                onChange={(e) => handleItemChange(index, "extraTax", e.target.value)}
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Further Tax"
                type="number"
                value={item.furtherTax}
                onChange={(e) => handleItemChange(index, "furtherTax", e.target.value)}
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="FED Payable"
                type="number"
                value={item.fedPayable}
                onChange={(e) => handleItemChange(index, "fedPayable", e.target.value)}
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Discount"
                type="number"
                value={item.discount}
                onChange={(e) => handleItemChange(index, "discount", e.target.value)}
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Sales Type"
                type="text"
                value={localStorage.getItem("saleType") || ""}
                onChange={(e) =>
                  handleItemChange(index, "saleType", e.target.value)
                }
                InputProps={{
                  readOnly: true,
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
              sx={{ mt: 2 }}
            >
              Remove Item
            </Button>
          </Box>
        </Box>
      ))}

      {/* Add and Submit Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button variant="contained" onClick={addNewItem} color="success">
          Add New Item
        </Button>
        <Box>
          <Button
            onClick={handleSubmitChange}
            variant="contained"
            color="primary"
            sx={{ mr: 2 }}
            disabled={loading}
          >
            {loading ? <span className="loader" style={{ display: 'inline-block', width: 22, height: 22, border: '3px solid #fff', borderTop: '3px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite', verticalAlign: 'middle' }} /> : 'Submit'}
          </Button>
        </Box>
      </Box>
      {/* Full screen loader overlay */}
      {loading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: 'rgba(255,255,255,0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span className="loader" style={{ display: 'inline-block', width: 60, height: 60, border: '6px solid #1976d2', borderTop: '6px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </Box>
      )}
    </Box>
  );
}
