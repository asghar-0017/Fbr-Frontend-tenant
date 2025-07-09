import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React, { useEffect, useState } from "react";
import { fetchData } from "../API/GetApi";

const SROScheduleNumber = ({ index, item, handleItemChange, RateId }) => {
  const [sro, setSro] = useState([]);

  const getSRO = async () => {
    try {
      var RateId = localStorage.getItem("selectedRateId");
      console.log("RateIdRateId", RateId);
      const response = await fetchData(
        `pdi/v1/SroSchedule?rate_id=${RateId}&date=04-Feb-2024&origination_supplier_csv=8`
      );
      console.log("SROSROSRO", response);
      setSro(response);
      return response;
    } catch (error) {
      console.error("Error fetching rates:", error);
      return [];
    }
  };

  // Fetch rates on component mount
  useEffect(() => {
    getSRO();
  }, [RateId]);

  const handleSROChange = (event) => {
    const selectedSRO = event.target.value; // e.g., "18%"
    const selectedSROObj = sro.find((sro) => sro.srO_DESC === selectedSRO);
    if (selectedSROObj) {
      localStorage.setItem("SROId", selectedSROObj.srO_ID);
      console.log(`SAVED SROId: ${selectedSROObj.srO_ID} to localStorage`);
    }
    handleItemChange(index, "sroScheduleNo", selectedSRO);
  };
  return (
    <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
      <FormControl fullWidth>
        <InputLabel id={`sro-schedule-${index}`}>SRO Schedule No</InputLabel>
        <Select
          labelId={`sro-schedule-${index}`}
          value={item.sroScheduleNo || "N/A"}
          label="SRO Schedule No"
          onChange={handleSROChange}
        >
          {sro.length === 0 ? (
            <MenuItem value="N/A">N/A</MenuItem>
          ) : (
            sro.map((curElem) => (
              <MenuItem key={curElem.srO_ID} value={curElem.srO_DESC}>
                {curElem.srO_DESC}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SROScheduleNumber;
