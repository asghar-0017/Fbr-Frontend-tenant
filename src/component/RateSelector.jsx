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

  // Function to fetch rate data
  const getRateData = async () => {
    if (!transactionTypeId) {
      return null;
    }
    try {
      var transctionId = localStorage.getItem("transactionTypeId");
      const provinceResponse = JSON.parse(
        localStorage.getItem("provinceResponse")
      );
      const selectedProvinceObj = provinceResponse.find(
        (prov) => prov.stateProvinceDesc === selectedProvince
      );

      if (!selectedProvinceObj) {
        console.warn(
          `Province not found in provinceResponse: ${selectedProvince}`
        );
        return;
      }
      const stateProvinceCode = selectedProvinceObj?.stateProvinceCode;

      const response = await fetchData(
        `pdi/v2/SaleTypeToRate?date=24-Feb-2024&transTypeId=${transctionId}&originationSupplier=${stateProvinceCode}`
      );
      console.log(
        "responseresponseresponseresponseresponseresponseresponseresponseresponseresponse",
        response
      );
      setRates(response);
      return response;
    } catch (error) {
      console.error("Error fetching rates:", error);
      return [];
    }
  };

  // Fetch rates on component mount
  useEffect(() => {
    getRateData();
  }, [transactionTypeId, selectedProvince]);

  // Handle rate selection and save ratE_ID to localStorage
  const handleRateChange = (event) => {
    const selectedRate = event.target.value; // e.g., "18%"
    const selectedRateObj = rates.find(
      (rate) => rate.ratE_DESC === selectedRate
    );
    if (selectedRateObj) {
      localStorage.setItem("selectedRateId", selectedRateObj.ratE_ID);
      console.log(`Saved ratE_ID: ${selectedRateObj.ratE_ID} to localStorage`);
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
          disabled={showScenarioMessage || showProvinceMessage}
        >
          {showScenarioMessage ? (
            <MenuItem value="">
              Please select scenario first
            </MenuItem>
          ) : showProvinceMessage ? (
            <MenuItem value="">
              Please select province first
            </MenuItem>
          ) : (
            rates.map((rate) => (
              <MenuItem key={rate.ratE_ID} value={rate.ratE_DESC}>
                {rate.ratE_DESC}
              </MenuItem>
            ))
          )}
        </Select>
        {showScenarioMessage && (
          <Box sx={{ color: 'error.main', fontSize: 13, mt: 0.5, ml: 1 }}>
            Please select scenario first.
          </Box>
        )}
        {showProvinceMessage && (
          <Box sx={{ color: 'error.main', fontSize: 13, mt: 0.5, ml: 1 }}>
            Please select province first.
          </Box>
        )}
      </FormControl>
    </Box>
  );
};

export default RateSelector;
