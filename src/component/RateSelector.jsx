import React, { useState, useEffect } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { fetchData } from "../API/GetApi";

const RateSelector = ({
  index,
  item,
  handleItemChange,
  transactionTypeId,
  selectedProvince,
}) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch rate data
  const getRateData = async () => {
    if (!transactionTypeId || !selectedProvince) {
      console.log("Missing required data:", {
        transactionTypeId,
        selectedProvince,
      });
      setRates([]);
      return null;
    }
    setLoading(true);
    try {
      // Get the full province data from localStorage
      const provinceResponseRaw = localStorage.getItem("provinceResponse");

      console.log("Province Response Raw:", provinceResponseRaw);

      // Parse the province data from localStorage
      let provinceResponse;
      try {
        provinceResponse = provinceResponseRaw
          ? JSON.parse(provinceResponseRaw)
          : [];
      } catch (parseError) {
        console.error("Error parsing province data:", parseError);
        provinceResponse = [];
      }

      // Ensure provinceResponse is an array
      if (!Array.isArray(provinceResponse)) {
        console.error("Province response is not an array:", provinceResponse);
        setRates([]);
        return;
      }

      console.log(
        "Available provinces:",
        provinceResponse.map((p) => ({
          desc: p.stateProvinceDesc,
          code: p.stateProvinceCode,
        }))
      );
      console.log("Looking for province:", selectedProvince);

      const selectedProvinceObj = provinceResponse.find(
        (prov) => prov.stateProvinceDesc === selectedProvince
      );

      if (!selectedProvinceObj) {
        console.error("Selected province not found in province data");
        console.log(
          "Available province descriptions:",
          provinceResponse.map((p) => p.stateProvinceDesc)
        );
        setRates([]);
        return;
      }

      const stateProvinceCode = selectedProvinceObj.stateProvinceCode;
      console.log("Found province code:", stateProvinceCode);

      const response = await fetchData(
        `pdi/v2/SaleTypeToRate?date=24-Feb-2024&transTypeId=${transactionTypeId}&originationSupplier=${stateProvinceCode}`
      );
      console.log("Rate Response:", response);
      console.log("Transaction Type ID:", transactionTypeId);
      console.log("Response type:", typeof response);
      console.log("Response is array:", Array.isArray(response));

      if (Array.isArray(response)) {
        setRates(response);
      } else if (response && typeof response === "object") {
        // Handle case where response might be wrapped in an object
        const ratesArray = response.data || response.rates || response;
        setRates(Array.isArray(ratesArray) ? ratesArray : []);
      } else {
        setRates([]);
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
      setRates([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rates on component mount and when dependencies change
  useEffect(() => {
    getRateData();
  }, [transactionTypeId, selectedProvince]);

  // Handle rate selection and save ratE_ID to localStorage
  const handleRateChange = (event) => {
    const selectedRate = event.target.value;
    const selectedRateObj = rates.find(
      (rate) => rate.ratE_DESC === selectedRate
    );
    if (selectedRateObj) {
      localStorage.setItem("selectedRateId", selectedRateObj.ratE_ID);
      console.log(`Selected Rate ID: ${selectedRateObj.ratE_ID}`);
    }
    handleItemChange(index, "rate", selectedRate);
  };

  const showScenarioMessage = !transactionTypeId;
  const showProvinceMessage = !showScenarioMessage && !selectedProvince;

  return (
    <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
      <FormControl fullWidth error={showScenarioMessage || showProvinceMessage}>
        <InputLabel id={`rate-${index}`}>Rate</InputLabel>
        <Select
          labelId={`rate-${index}`}
          value={item.rate || ""}
          label="Rate"
          onChange={handleRateChange}
          disabled={showScenarioMessage || showProvinceMessage || loading}
        >
          {showScenarioMessage ? (
            <MenuItem value="">Please select scenario first</MenuItem>
          ) : showProvinceMessage ? (
            <MenuItem value="">Please select province first</MenuItem>
          ) : loading ? (
            <MenuItem value="">Loading rates...</MenuItem>
          ) : rates.length === 0 ? (
            <MenuItem value="">No rates available</MenuItem>
          ) : (
            rates.map((rate) => (
              <MenuItem key={rate.ratE_ID} value={rate.ratE_DESC}>
                {rate.ratE_DESC}
              </MenuItem>
            ))
          )}
        </Select>
        {showScenarioMessage && (
          <Box sx={{ color: "error.main", fontSize: 13, mt: 0.5, ml: 1 }}>
            Please select scenario first.
          </Box>
        )}
        {showProvinceMessage && (
          <Box sx={{ color: "error.main", fontSize: 13, mt: 0.5, ml: 1 }}>
            Please select province first.
          </Box>
        )}
      </FormControl>
    </Box>
  );
};

export default RateSelector;
