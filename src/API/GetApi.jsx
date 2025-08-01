import axios from "axios";
import { API_CONFIG } from "./Api";
import Swal from "sweetalert2";

// Don't destructure sandBoxTestToken at import time, use it dynamically
const { apiKey } = API_CONFIG;

export const postData = async (endpoint, data, environment = "sandbox") => {
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
    const res = await axios.post(
      `https://gw.fbr.gov.pk/${endpoint}`,
      data,
      config
    );
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

export const fetchData = async (endpoint, environment = "sandbox") => {
  // Get current token dynamically from context
  const token = API_CONFIG.getCurrentToken(environment);

  console.log(
    `fetchData called for endpoint: ${endpoint}, environment: ${environment}`
  );
  console.log("Token available:", !!token);
  console.log("Token value:", token);

  if (!token) {
    throw new Error(`No ${environment} token found for the selected tenant`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  console.log("Request URL:", `https://gw.fbr.gov.pk/${endpoint}`);
  console.log("Request headers:", config.headers);

  try {
    const res = await axios.get(`https://gw.fbr.gov.pk/${endpoint}`, config);
    console.log(`fetchData success for ${endpoint}:`, {
      status: res.status,
      statusText: res.statusText,
      data: res.data,
      dataType: typeof res.data,
      isArray: Array.isArray(res.data),
      length: Array.isArray(res.data) ? res.data.length : "N/A",
    });
    return res.data;
  } catch (error) {
    console.error(`fetchData error for ${endpoint}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: error.config,
    });
    throw error;
  }
};
