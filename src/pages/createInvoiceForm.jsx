import * as React from "react";
import {
  Box,
  InputLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Typography,
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

export default function CreateInvoice() {
  const [formData, setFormData] = React.useState({
    invoiceType: "Sale Invoice",
    invoiceDate: dayjs("2025-07-02"),
    sellerNTNCNIC: "7458525",
    sellerBusinessName: "IBL",
    sellerProvince: "Sindh",
    sellerAddress: "Karachi",
    buyerNTNCNIC: "",
    buyerBusinessName: "",
    buyerProvince: "AZAD JAMMU AND KASHMIR",
    buyerAddress: "",
    buyerRegistrationType: "Registered",
    invoiceRefNo: "",
    scenarioId: "SN001",
    items: [
      {
        hsCode: "0304.5400",
        productDescription: "",
        rate: "18.00%",
        uoM: "",
        quantity: "",
        totalValues: "",
        valueSalesExcludingST: "",
        fixedNotifiedValueOrRetailPrice: "",
        salesTaxApplicable: "",
        salesTaxWithheldAtSource: "",
        sroScheduleNo: "",
        sroItemSerialNo: "",
        salesType: "",
        isSROScheduleEnabled: false,
        isSROItemEnabled: false,
        extraTax: "",
        furtherTax: "",
        fedPayable: "",
        discount: "",
      },
    ],
  });

  const [scenario, setScenario] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index], [field]: value };

      // Enable SRO Schedule if Rate is entered
      if (field === "rate" && value) {
        item.isSROScheduleEnabled = true;
        item.sroScheduleNo = "";
        item.sroItemSerialNo = "";
        item.isSROItemEnabled = false;
      }

      // ✅ Enable SRO Item if SRO Schedule is entered
      if (field === "sroScheduleNo" && value) {
        item.isSROItemEnabled = true;
        item.sroItemSerialNo = ""; // Reset previously selected item if any
      }

      // Parse rate as fraction
      let rateFraction = 0;
      if (item.rate) {
        rateFraction = parseFloat(item.rate.replace("%", "")) / 100;
      }

      // Parse Unit Cost and Quantity
      const unitCost = parseFloat(item.fixedNotifiedValueOrRetailPrice || 0);
      const quantity = parseFloat(item.quantity || 0);

      // CALCULATION only if Unit Cost and Quantity are filled
      if (
        (field === "fixedNotifiedValueOrRetailPrice" ||
          field === "quantity" ||
          field === "rate") &&
        unitCost >= 0 &&
        quantity > 0 &&
        rateFraction >= 0
      ) {
        const valueSales = unitCost * quantity;
        const salesTax = valueSales * rateFraction;
        const totalValues = valueSales + salesTax;
        const withheld = salesTax * 0.1; // 10% withholding

        item.valueSalesExcludingST = valueSales.toFixed(2);
        item.salesTaxApplicable = salesTax.toFixed(2);
        item.totalValues = totalValues.toFixed(2);
        item.salesTaxWithheldAtSource = withheld.toFixed(2);

        // new fields
        item.extraTax = 0;
        item.furtherTax = 0;
        item.fedPayable = 0;
        item.discount = 0;
      }

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
          rate: "18.00%",
          uoM: "",
          quantity: "",
          totalValues: "",
          valueSalesExcludingST: "",
          fixedNotifiedValueOrRetailPrice: "",
          salesTaxApplicable: "",
          salesTaxWithheldAtSource: "",
          sroScheduleNo: "",
          sroItemSerialNo: "",
          extraTax: "",
          furtherTax: "",
          fedPayable: "",
          discount: "",
          saleType: "",
          isSROScheduleEnabled: false,
          isSROItemEnabled: false,
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
      const result = res;
      setScenario(result);
      console.log(result);
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
      // Id invalid, clear
      setFormData((prev) => ({
        ...prev,
        scenarioId: id,
        scenarioDescription: "",
      }));
      return;
    }

    const localDescription = selectedScenario.saleType;
    const productDescription = localStorage.setItem(
      "productDescription",
      selectedScenario.description
    );
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
      localStorage.setItem("salesType", matchingApiRecord.transactioN_DESC);

      console.log(
        "Transaction type ID saved:",
        matchingApiRecord.transactioN_TYPE_ID
      );

      // 4️⃣ Also update your formData with description
      setFormData((prev) => ({
        ...prev,
        scenarioId: id,
        scenarioDescription: matchingApiRecord?.transactioN_DESC ?? "",
        buyerRegistrationType: id === "SN001" ? "Registered" : "Unregistered",
        items: prev.items.map((item) => ({
          ...item,
          sroScheduleNo: "",
          sroItemSerialNo: "",
          rate: "",
          fixedNotifiedValueOrRetailPrice: "",
          quantity: "",
          valueSalesExcludingST: "",
          salesTaxApplicable: "",
          totalValues: "",
          salesTaxWithheldAtSource: "",
          extraTax: "",
          furtherTax: "",
          fedPayable: "",
          discount: "",
          isSROScheduleEnabled: false,
          isSROItemEnabled: false,
        })),
      }));
    } else {
      // No match ➜ clear or leave as is
      console.warn("No matching description found in API");
      setFormData((prev) => ({
        ...prev,
        scenarioId: id,
        scenarioDescription: "",
      }));
    }
  };

  const handleSubmitChange = async () => {
    setLoading(true);
    try {
      const res = await postData("di_data/v1/di/postinvoicedata_sb", formData);
      console.log(res);
      if (res.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Invoice submitted successfully.",
        });
        // Reset form after successful submission
        setFormData({
          invoiceType: "Sale Invoice",
          invoiceDate: dayjs("2025-07-02"),
          sellerNTNCNIC: "7458525",
          sellerBusinessName: "IBL",
          sellerProvince: "Sindh",
          sellerAddress: "Karachi",
          buyerNTNCNIC: "",
          buyerBusinessName: "",
          buyerProvince: "AZAD JAMMU AND KASHMIR",
          buyerAddress: "",
          buyerRegistrationType: "Registered",
          invoiceRefNo: "",
          scenarioId: "SN001",
          items: [
            {
              hsCode: "0304.5400",
              productDescription: "",
              rate: "18.00%",
              uoM: "",
              quantity: "",
              totalValues: "",
              valueSalesExcludingST: "",
              fixedNotifiedValueOrRetailPrice: "",
              salesTaxApplicable: "",
              salesTaxWithheldAtSource: "",
              sroScheduleNo: "",
              sroItemSerialNo: "",
              salesType: "",
              isSROScheduleEnabled: false,
              isSROItemEnabled: false,
              extraTax: "",
              furtherTax: "",
              fedPayable: "",
              discount: "",
            },
          ],
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to submit the invoice. Please try again.",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
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
                <MenuItem value="Sale Invoice">Sale Invoice</MenuItem>
                <MenuItem value="Service Invoice">Service Invoice</MenuItem>
                <MenuItem value="Export Invoice">Export Invoice</MenuItem>
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
                <MenuItem value="AZAD JAMMU AND KASHMIR">
                  AZAD JAMMU AND KASHMIR
                </MenuItem>
                <MenuItem value="Sindh">Sindh</MenuItem>
                <MenuItem value="Punjab">Punjab</MenuItem>
                <MenuItem value="KPK">KPK</MenuItem>
                <MenuItem value="Balochistan">Balochistan</MenuItem>
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
                    {curElem.id}
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
            />

            <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
              <FormControl fullWidth>
                <InputLabel id={`hs-code-${index}`}>HS Code</InputLabel>
                <Select
                  labelId={`hs-code-${index}`}
                  value={item.hsCode}
                  label="HS Code"
                  onChange={(e) =>
                    handleItemChange(index, "hsCode", e.target.value)
                  }
                >
                  <MenuItem value={item.hsCode}>
                    <em>0304.5400</em>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
              <TextField
                fullWidth
                label="Product Description"
                value={localStorage.getItem("productDescription") || ""}
                onChange={(e) =>
                  handleItemChange(index, "productDescription", e.target.value)
                }
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
                InputProps={{ readOnly: true }}
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
                onChange={(e) =>
                  handleItemChange(index, "extraTax", e.target.value)
                }
                variant="outlined"
                InputProps={{ readOnly: true }}
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
                InputProps={{ readOnly: true }}
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
                InputProps={{ readOnly: true }}
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
                InputProps={{ readOnly: true }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
            <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
              <TextField
                fullWidth
                label="Sales Type"
                type="text"
                value={localStorage.getItem("salesType") || ""}
                onChange={(e) =>
                  handleItemChange(index, "salesType", e.target.value)
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
        <Button variant="contained" onClick={addNewItem} color="secondary">
          Add New Item
        </Button>
        <Button
          onClick={handleSubmitChange}
          variant="contained"
          color="primary"
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
}
