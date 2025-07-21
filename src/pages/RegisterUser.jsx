import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
  Stack,
  MenuItem,
} from "@mui/material";
import {API_CONFIG} from "../API/Api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const { apiKeyLocal } = API_CONFIG;

const RegisterUser = () => {
  const [form, setForm] = useState({
    buyerNTNCNIC: "",
    buyerBusinessName: "",
    buyerProvince: "",
    buyerAddress: "",
    buyerRegistrationType: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showError = (message) => {
    MySwal.fire({
      icon: "error",
      title: "Error",
      text: message,
      confirmButtonColor: "#d32f2f",
    });
  };

  const showSuccess = (message) => {
    MySwal.fire({
      icon: "success",
      title: "Success",
      text: message,
      confirmButtonColor: "#388e3c",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if any field is empty (basic validation)
      for (const key in form) {
        if (!form[key]) {
          throw new Error(
            `Please fill in the '${key
              .replace(/buyer/, "")
              .replace(/([A-Z])/g, " $1")
              .trim()}' field.`
          );
        }
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${apiKeyLocal}/register-buyer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || "Registration failed. Please try again."
        );
      }

      showSuccess("User registered successfully!");
      setForm({
        buyerNTNCNIC: "",
        buyerBusinessName: "",
        buyerProvince: "",
        buyerAddress: "",
        buyerRegistrationType: "",
      });
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f6f9fc 0%, #e0e7ff 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: { xs: 2, sm: 4 },
          width: { xs: "100%", sm: 400 },
          borderRadius: 4,
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          boxShadow: "0 8px 32px rgba(31, 38, 135, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          align="center"
          gutterBottom
          sx={{ color: "#3f51b5" }}
        >
          Register New Buyer
        </Typography>

        <Divider sx={{ width: "100%", mb: 3, borderColor: "#3f51b5" }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <Stack spacing={2}>
            <TextField
              label="NTN/CNIC"
              name="buyerNTNCNIC"
              value={form.buyerNTNCNIC}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
            />
            <TextField
              label="Business Name"
              name="buyerBusinessName"
              value={form.buyerBusinessName}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
            />
            <TextField
              label="Province"
              name="buyerProvince"
              value={form.buyerProvince}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
            />
            <TextField
              label="Address"
              name="buyerAddress"
              value={form.buyerAddress}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
            />
            <TextField
              label="Registration Type"
              select
              name="buyerRegistrationType"
              value={form.buyerRegistrationType}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
            >
              <MenuItem value="Registered">Registered</MenuItem>
              <MenuItem value="Unregistered">Unregistered</MenuItem>
            </TextField>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                py: 1.2,
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(63, 81, 181, 0.3)",
              }}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterUser;
