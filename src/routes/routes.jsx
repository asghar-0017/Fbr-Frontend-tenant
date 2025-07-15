// AppRouter.js
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import Login from "../pages/login";
import { AuthProvider, useAuth } from "../Context/AuthProvider"; // <-- useAuth import karein
import ProtectedRoute from "../Context/ProtectedRoute";
import CreateInvoice from "../pages/createInvoiceForm";
import YourInvoices from "../pages/YourInvoices";
import EmailVerification from "../pages/EmailVerification";
import OTP from "../pages/OTP";
import ResetPassword from "../pages/ResetPassword";

const SidebarWithLogout = () => {
  const { logout } = useAuth();
  return <Sidebar onLogout={logout} />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<EmailVerification />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SidebarWithLogout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CreateInvoice />} />
            <Route path="your-invoices" element={<YourInvoices />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
