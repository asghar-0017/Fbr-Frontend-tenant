import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CreateInvoice from "../pages/createInvoiceForm";
import YourInvoices from "../pages/YourInvoices";
import Sidebar from "../component/Sidebar";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>
  );
};

export default AppRouter;
