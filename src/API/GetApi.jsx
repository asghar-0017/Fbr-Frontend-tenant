import axios from "axios";
import { API_CONFIG } from "./Api";
import Swal from "sweetalert2";

// Don't destructure sandBoxTestToken at import time, use it dynamically
const { apiKey } = API_CONFIG;

export const postData = async (endpoint, data, environment = 'sandbox') => {
  // Get current token dynamically from context
  const token = API_CONFIG.getCurrentToken(environment);

  if (!token) {
    throw new Error(`No ${environment} token found for the selected tenant`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const res = await axios.post(`https://gw.fbr.gov.pk/${endpoint}`, data, config);
    console.log("Actual Response:", res);
    console.log("Request Data:", JSON.stringify(data, null, 2));
    console.log("Response Status:", res.status);
    console.log("Response Data:", JSON.stringify(res.data, null, 2));

    if (!res.data.validationResponse) {
      throw new Error("Invalid response: missing validationResponse");
    }
    return res;
  } catch (error) {
    console.error("API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data, // Log full error response
    });
    if (error.response?.status === 401) {
      Swal.fire({
        icon: "error",
        title: "Unauthorized",
        text: `Authentication failed for ${environment} environment. Please check your token or contact FBR support.`,
        confirmButtonColor: "#d33",
      });
    }
    throw error;
  }
};

export const fetchData = async (endpoint, environment = 'sandbox') => {
  // Get current token dynamically from context
  const token = API_CONFIG.getCurrentToken(environment);

  if (!token) {
    throw new Error(`No ${environment} token found for the selected tenant`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const res = await axios.get(`https://gw.fbr.gov.pk/${endpoint}`, config);
    return res.data;
  } catch (error) {
    console.error("API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};
