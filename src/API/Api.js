import axios from 'axios';

const API_CONFIG = {
  apiKey: import.meta.env.VITE_SERVER_API,
  apiKeyLocal: import.meta.env.VITE_SERVER_API_LOCAL,
  sandBoxTestToken: '63f756ee-69e4-3b5b-a3b7-0b8656624912'
  // sandBoxTestToken: '2ad94ba1-3c8d-34ae-9f28-2f6e7bc86545'
};

const api = axios.create({
  baseURL: API_CONFIG.apiKeyLocal,
  // You can add headers or other config here if needed
});

export { API_CONFIG, api };
