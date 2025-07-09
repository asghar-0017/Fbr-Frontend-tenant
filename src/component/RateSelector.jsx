import React, { useState, useEffect } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { fetchData } from "../API/GetApi";

const RateSelector = ({ index, item, handleItemChange,transactionTypeId }) => {
  const [rates, setRates] = useState([]);

  // Function to fetch rate data
  const getRateData = async () => {
    try {
      var transctionId = localStorage.getItem("transactionTypeId");
      const response = await fetchData(
        `pdi/v2/SaleTypeToRate?date=24-Feb-2024&transTypeId=${transctionId}&originationSupplier=8`
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
  }, [transactionTypeId]);

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

  return (
    <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
      <FormControl fullWidth>
        <InputLabel id={`rate-${index}`}>Rate</InputLabel>
        <Select
          labelId={`rate-${index}`}
          value={item.rate || ""}
          label="Rate"
          onChange={handleRateChange}
        >
          {rates.map((rate) => (
            <MenuItem key={rate.ratE_ID} value={rate.ratE_DESC}>
              {rate.ratE_DESC}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default RateSelector;
