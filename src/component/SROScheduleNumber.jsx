import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React, { useEffect, useState } from "react";
import { fetchData } from "../API/GetApi";

const SROScheduleNumber = ({
  index,
  item,
  handleItemChange,
  RateId,
  disabled,
  selectedProvince,
}) => {
  const [sro, setSro] = useState([]);

  // Function to find province with flexible matching
  const findProvince = (provinceResponse, selectedProvince) => {
    if (!provinceResponse || !Array.isArray(provinceResponse)) {
      return null;
    }

    // First try exact match
    let province = provinceResponse.find(
      (prov) => prov.stateProvinceDesc === selectedProvince
    );

    if (province) {
      return province;
    }

    // Try case-insensitive match
    province = provinceResponse.find(
      (prov) => prov.stateProvinceDesc.toLowerCase() === selectedProvince.toLowerCase()
    );

    if (province) {
      return province;
    }

    // Try partial match (e.g., "SINDH" might match "SINDH PROVINCE")
    province = provinceResponse.find(
      (prov) => 
        prov.stateProvinceDesc.toLowerCase().includes(selectedProvince.toLowerCase()) ||
        selectedProvince.toLowerCase().includes(prov.stateProvinceDesc.toLowerCase())
    );

    if (province) {
      return province;
    }

    // Try common variations
    const variations = {
      'SINDH': ['SINDH PROVINCE', 'SINDH', 'Sindh', 'Sindh Province'],
      'PUNJAB': ['PUNJAB PROVINCE', 'PUNJAB', 'Punjab', 'Punjab Province'],
      'KPK': ['KHYBER PAKHTUNKHWA', 'KPK', 'Khyber Pakhtunkhwa'],
      'BALOCHISTAN': ['BALOCHISTAN PROVINCE', 'BALOCHISTAN', 'Balochistan'],
      'FEDERAL': ['FEDERAL TERRITORY', 'FEDERAL', 'Federal Territory', 'ISLAMABAD'],
      'AJK': ['AZAD JAMMU & KASHMIR', 'AJK', 'Azad Jammu & Kashmir'],
      'GB': ['GILGIT BALTISTAN', 'GB', 'Gilgit Baltistan']
    };

    const selectedProvinceUpper = selectedProvince.toUpperCase();
    if (variations[selectedProvinceUpper]) {
      for (const variation of variations[selectedProvinceUpper]) {
        province = provinceResponse.find(
          (prov) => prov.stateProvinceDesc.toUpperCase() === variation.toUpperCase()
        );
        if (province) {
          return province;
        }
      }
    }

    return null;
  };

  const getSRO = async () => {
    try {
      var RateId = localStorage.getItem("selectedRateId");
      console.log("RateIdRateId", RateId);

      if (!RateId) {
        console.warn("selectedRateId is missing in localStorage");
        return;
      }

      const provinceResponse = JSON.parse(
        localStorage.getItem("provinceResponse") || "[]"
      );
      const selectedProvinceObj = findProvince(provinceResponse, selectedProvince);

      if (!selectedProvinceObj) {
        console.warn(
          `Province not found in provinceResponse: ${selectedProvince}`
        );
        return;
      }

      const stateProvinceCode = selectedProvinceObj?.stateProvinceCode;

      const response = await fetchData(
        `pdi/v1/SroSchedule?rate_id=${RateId}&date=04-Feb-2024&origination_supplier_csv=${stateProvinceCode}`
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
  }, [RateId, selectedProvince]);

  const handleSROChange = (event) => {
    const selectedSRO = event.target.value; // e.g., "18%"
    const selectedSROObj = sro.find((sro) => sro.srO_DESC === selectedSRO);
    if (selectedSROObj) {
      localStorage.setItem("SROId", selectedSROObj.srO_ID);
      console.log(`SAVED SROId: ${selectedSROObj.srO_ID} to localStorage`);
    }
    if (sro.length === 0) {
      localStorage.removeItem("SROId");
    }
    handleItemChange(index, "sroScheduleNo", selectedSRO);
  };
  return (
    <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
      <FormControl fullWidth disabled={disabled}>
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
