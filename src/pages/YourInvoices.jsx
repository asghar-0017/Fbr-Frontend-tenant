import axios from "axios";
import React, { useEffect, useState } from "react";

const YourInvoices = () => {
  const [invoices, setInvoices] = useState([]);

  const getMyInvoices = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      "http://localhost:5152/get-invoice-data",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(res.data);
  };

  useEffect(() => {
    getMyInvoices();
  }, []);
  return <div>Your Invoices</div>;
};

export default YourInvoices;
