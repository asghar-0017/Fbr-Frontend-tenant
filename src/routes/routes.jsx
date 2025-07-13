// AppRouter.js
import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import CreateInvoice from "../pages/createInvoiceForm";
import YourInvoices from "../pages/YourInvoices";
import Sidebar from "../component/Sidebar";
import Login from "../pages/login";

const AppRouter = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
  }, [isLoggedIn]);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
  };

  return (
    <BrowserRouter>
      <Routes>
        {!isLoggedIn ? (
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        ) : (
          <Route path="*" element={<Sidebar onLogout={handleLogout} />} />
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
