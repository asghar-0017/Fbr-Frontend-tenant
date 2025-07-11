import axios from "axios";
import API_CONFIG from "./Api";
import Swal from "sweetalert2";

const { apiKey } = API_CONFIG;

// export const postData = async (endpoint, data) => {
//   const token = localStorage.getItem("token");
//   if (!token) {
//     throw new Error("No authentication token found");
//   }

//   const config = {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   };

//   try {
//     const res = await axios.post(`https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata`, data, config);
//     console.log("Actual Response:", res);
//     console.log("Request Data:", JSON.stringify(data, null, 2));
//     console.log("Response Status:", res.status);
//     console.log("Response Data:", JSON.stringify(res.data, null, 2));

//     if (!res.data.validationResponse) {
//       throw new Error("Invalid response: missing validationResponse");
//     }
//     return res;
//   } catch (error) {
//     console.error("API Error:", {
//       message: error.message,
//       status: error.response?.status,
//       data: error.response?.data,
//     });
//     throw error;
//   }
// };
export const postData = async (endpoint, data) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
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
        text: "Authentication failed. Please check your token or contact FBR support.",
        confirmButtonColor: "#d33",
      });
    }
    throw error;
  }
};

export const fetchData = async (endpoint) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const res = await axios.get(`${apiKey}/${endpoint}`, config);
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
