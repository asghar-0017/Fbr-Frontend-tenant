import { createContext, useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_CONFIG from "../API/Api";

const { apiKeyLocal } = API_CONFIG;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${apiKeyLocal}/login`, {
        email,
        password,
      });

      setIsAuthenticated(true);
      console.log("TOKENNNNNNNN", response?.data?.data?.token);
     

      console.log("awfeagrsgsygshgserhsh", response);
      localStorage.setItem("token", response?.data?.data?.token);
    

      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
    }
  };
  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.get(`${apiKeyLocal}/logout`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Logout API error:", err);
    }
    setIsAuthenticated(false);
    localStorage.clear();
    console.log("Logout called, isAuthenticated should be false now");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setAuthLoading(false); // <-- Add this line
    } else {
      setIsAuthenticated(true);
      setAuthLoading(false); // <-- Add this line
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, authLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
