import axios from "axios";
import API_CONFIG from "./Api";

const { apiKey } = API_CONFIG;

export const postData = async (endpoint, data) => {
  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const res = await axios.post(`${apiKey}/${endpoint}`, data, config);
    return res.data;
  } catch (error) {
    console.error(error);
  }
};

export const fetchData = async (endpoint) => {
  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const res = await axios.get(`${apiKey}/${endpoint}`, config);
    return res.data;
  } catch (error) {
    console.error(error);
  }
};
