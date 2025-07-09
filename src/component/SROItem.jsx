import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React, { useEffect, useState } from "react";
import { fetchData } from "../API/GetApi";

const SROItem = ({ index, item, handleItemChange, SROId, disabled }) => {
  const [sro, setSro] = useState([]);

  useEffect(() => {
    const getSROItem = async () => {
      if (!SROId) return;

      try {
        const response = await fetchData(
          `pdi/v2/SROItem?date=2025-03-25&sro_id=${SROId}`
        );
        console.log("SRO ITEM RESPONSE", response);
        setSro(response);
      } catch (error) {
        console.error("Error fetching rates:", error);
      }
    };

    getSROItem();
  }, [SROId]);

  const handleSROChange = (event) => {
    const selectedSRO = event.target.value;
    handleItemChange(index, "sroItemSerialNo", selectedSRO);
  };

  // ✅ Early return AFTER hooks
  if (!SROId) {
    return null;
  }

  return (
    <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id={`sro-item-${index}`}>SRO Item No</InputLabel>
        <Select
          labelId={`sro-item-${index}`}
          value={item.sroItemSerialNo || ""}
          label="SRO Item No"
          onChange={handleSROChange}
        >
          {sro.length === 0 ? (
            <MenuItem key="N/A" value="">
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
