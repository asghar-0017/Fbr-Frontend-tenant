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
  const [error, setError] = useState(null);

  // Function to fetch rate data
  const getRateData = async () => {
    console.log("RateSelector - getRateData called with:", {
      transactionTypeId,
      selectedProvince,
      index
    });

    if (!transactionTypeId) {
      console.warn("RateSelector: transactionTypeId is missing");
      setRates([]);
      setError("Transaction Type ID is required");
      return;
    }

    if (!selectedProvince) {
      console.warn("RateSelector: selectedProvince is missing");
      setRates([]);
      setError("Province selection is required");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const provinceResponse = JSON.parse(
        localStorage.getItem("provinceResponse") || "[]"
      );
      const selectedProvinceObj = provinceResponse.find(
        (prov) => prov.stateProvinceDesc === selectedProvince
      );

      if (!selectedProvinceObj) {
        console.warn(
          `Province not found in provinceResponse: ${selectedProvince}`
        );
        setRates([]);
        setError(`Province not found: ${selectedProvince}`);
        return;
      }
      
      const stateProvinceCode = selectedProvinceObj?.stateProvinceCode;
      console.log("RateSelector - API call parameters:", {
        transactionTypeId,
        stateProvinceCode,
        date: "24-Feb-2024"
      });

      const response = await fetchData(
        `pdi/v2/SaleTypeToRate?date=24-Feb-2024&transTypeId=${transactionTypeId}&originationSupplier=${stateProvinceCode}`
      );
      
      console.log("RateSelector - API Response:", response);
      console.log("RateSelector - Transaction Type ID:", transactionTypeId);
      
      if (Array.isArray(response)) {
        setRates(response);
        console.log(`RateSelector - Loaded ${response.length} rates`);
      } else {
        console.warn("RateSelector - API response is not an array:", response);
        setRates([]);
        setError("Invalid response format from API");
      }
    } catch (error) {
      console.error("RateSelector - Error fetching rates:", error);
      setRates([]);
      setError(`Failed to load rates: ${error.message}`);
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
      console.log(`RateSelector - Selected Rate ID: ${selectedRateObj.ratE_ID}`);
    }
    handleItemChange(index, "rate", selectedRate);
  };

  const showScenarioMessage = !transactionTypeId;
  const showProvinceMessage = !showScenarioMessage && !selectedProvince;
  const showError = error && !showScenarioMessage && !showProvinceMessage;

  return (
    <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
      <FormControl fullWidth error={showScenarioMessage || showProvinceMessage || showError}>
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
          ) : showError ? (
            <MenuItem value="">Error loading rates</MenuItem>
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
        {showError && (
          <Box sx={{ color: "error.main", fontSize: 13, mt: 0.5, ml: 1 }}>
            {error}
          </Box>
        )}
      </FormControl>
    </Box>
  );
};

export default RateSelector;
