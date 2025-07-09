import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React, { useEffect, useState } from "react";
import { fetchData } from "../API/GetApi";

const SROItem = ({ index, item, handleItemChange, SROId }) => {
  const [sro, setSro] = useState([]);

  const getSROItem = async () => {
    try {
      var SROId = localStorage.getItem("SROId");
      console.log("SROIdSROId: ", SROId);
      const response = await fetchData(
        `pdi/v2/SROItem?date=2025-03-25&sro_id=${SROId}`
      );
      console.log("SROSROSROITEMRESPONSE", response);
      setSro(response);
      return response;
    } catch (error) {
      console.error("Error fetching rates:", error);
      return [];
    }
  };

  // Fetch rates on component mount
  useEffect(() => {
    getSROItem();
  }, [SROId]);

  const handleSROChange = (event) => {
    const selectedSRO = event.target.value;
    const selectedSROObj = sro.find((sro) => sro.srO_ITEM_DESC === selectedSRO);
    handleItemChange(index, "sroItemSerialNo", selectedSRO);
  };
  return (
    <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
      <FormControl fullWidth>
        <InputLabel id={`sro-item-${index}`}>SRO Schedule No</InputLabel>
        <Select
          labelId={`sro-item-${index}`}
          value={item.sroItemSerialNo || "N/A"}
          label="SRO Item No"
          onChange={handleSROChange}
        >
          {sro.length === 0 ? (
            <MenuItem key="N/A" value="N/A">
              N/A
            </MenuItem>
          ) : (
            sro.map((curElem) => (
              <MenuItem key={curElem.srO_ITEM_ID} value={curElem.srO_ITEM_DESC}>
                {curElem.srO_ITEM_DESC}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SROItem;
