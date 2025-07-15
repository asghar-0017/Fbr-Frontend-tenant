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
  const [allLoading, setAllLoading] = React.useState(true);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  React.useEffect(() => {
    setAllLoading(true);
    Promise.allSettled([
      fetchData("pdi/v1/provinces").then((response) => {
        setProvince(response);
        localStorage.setItem("provinceResponse", JSON.stringify(response));
      }),
      fetch("https://gw.fbr.gov.pk/pdi/v1/itemdesccode", {
        headers: {
          Authorization: `Bearer 63f756ee-69e4-3b5b-a3b7-0b8656624912`,
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
      fetchData("pdi/v1/transtypecode").then((res) => setScenario(res)),
    ]).finally(() => setAllLoading(false));
  }, []);

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index] };

      // Parse numeric values, handling empty strings
      const parseValue = (val, isFloat = true) =>
        val === "" ? (isFloat ? 0 : "") : isFloat ? parseFloat(val) || 0 : val;

      // Handle all editable fields
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

      // Handle SRO-related fields
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

      // Calculate dependent fields if not manually overridden
      if (
        !item.isValueSalesManual &&
        (field === "quantity" || field === "fixedNotifiedValueOrRetailPrice")
      ) {
        const unitCost = parseFloat(item.fixedNotifiedValueOrRetailPrice || 0);
        const quantity = parseFloat(item.quantity || 0);
        item.valueSalesExcludingST = unitCost * quantity;
      }

      // Update tax calculations
      if (
        item.rate &&
        item.rate.toLowerCase() !== "exempt" &&
        [
          "quantity",
          "fixedNotifiedValueOrRetailPrice",
          "valueSalesExcludingST",
          "rate",
        ].includes(field)
      ) {
        const rateFraction =
          parseFloat((item.rate || "0").replace("%", "")) / 100;
        const valueSales = parseFloat(item.valueSalesExcludingST || 0);
        const salesTax = Math.round(valueSales * rateFraction);
        item.salesTaxApplicable = salesTax;
        item.totalValues = valueSales + salesTax;
        item.salesTaxWithheldAtSource = salesTax;
      } else if (item.rate && item.rate.toLowerCase() === "exempt") {
        // For exempt items, calculate valueSalesExcludingST but set taxes to 0
        const unitCost = parseFloat(item.fixedNotifiedValueOrRetailPrice || 0);
        const quantity = parseFloat(item.quantity || 0);
        item.valueSalesExcludingST = item.isValueSalesManual
          ? parseFloat(item.valueSalesExcludingST || 0)
          : unitCost * quantity;
        item.salesTaxApplicable = 0;
        item.totalValues = item.valueSalesExcludingST;
        item.salesTaxWithheldAtSource = 0;
        item.extraTax = "";
        item.furtherTax = 0;
        item.fedPayable = 0;
        item.discount = 0;
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
      : "Goods at Standard Rate (default)";

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
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

    const isExemptScenario = id === "SN006";
    const defaultRate = isExemptScenario ? "exempt" : "18%";

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
        items: prev.items.map((item) => {
          const unitCost = parseFloat(
            item.fixedNotifiedValueOrRetailPrice || 0
          );
          const quantity = parseFloat(item.quantity || 1);
          const valueSalesExcludingST = unitCost * quantity;
          return {
            ...item,
            productDescription: selectedScenario.description,
            sroScheduleNo: "",
            sroItemSerialNo: "",
            rate: defaultRate,
            fixedNotifiedValueOrRetailPrice: unitCost,
            quantity: quantity,
            valueSalesExcludingST: isExemptScenario ? valueSalesExcludingST : 0,
            salesTaxApplicable: isExemptScenario ? 0 : item.salesTaxApplicable,
            totalValues: isExemptScenario ? valueSalesExcludingST : 0,
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
          };
        }),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        scenarioId: id,
      }));
    }
  };

  const handleSubmitChange = async () => {
    setLoading(true);
    try {
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
          // {
          //   field: "salesTaxApplicable",
          //   message: `Sales Tax Applicable is required for item ${index + 1}`,
          // },
          // {
          //   field: "saleType",
          //   message: `Sale Type is required for item ${index + 1}`,
          // },
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
                  navigate("/your-invoices");
                },
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
    printInvoice(formData);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f0f2f5", borderRadius: 2, mt: 8 }}>
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
              <InputLabel id="buyer-registration-type-label">
                Buyer Registration Type
              </InputLabel>
              <Select
                labelId="buyer-registration-type-label"
                value={formData.buyerRegistrationType}
                label="Buyer Registration Type"
                onChange={(e) =>
                  handleChange("buyerRegistrationType", e.target.value)
                }
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
        {formData.scenarioId && (
          <Typography
            variant="body2"
            sx={{ mt: 1, ml: 2, color: "text.secondary" }}
          >
            {scenarioData.find((s) => s.id === formData.scenarioId)
              ?.description || ""}
          </Typography>
        )}
      </Box>

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
            <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
              <Autocomplete
                fullWidth
                options={hsCodeList}
                getOptionLabel={(option) => option.hS_CODE}
                value={
                  hsCodeList.find((code) => code.hS_CODE === item.hsCode) ||
                  null
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
                value={item.productDescription}
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
