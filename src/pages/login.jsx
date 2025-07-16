import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useAuth } from "../Context/AuthProvider";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, login } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login(username, password);
    } catch (error) {
      setError(`Login failed. ${error.message || "Please try again."}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        background: "linear-gradient(to right, #2193b0, #6dd5ed)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          width: 350,
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img src={'/images/innovative.png'} alt="Logo" style={{ maxWidth: 90, maxHeight: 90, borderRadius: 8 }} />
        </Box>
        {/* <Avatar sx={{ bgcolor: "#2193b0", margin: "0 auto 10px" }}>
          {/* <LockIcon /> */}
        {/* </Avatar>  */}
        {/* <Typography variant="h5" gutterBottom>
          User Login
        </Typography> */}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2, backgroundColor: "#2193b0" }}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <Button
              onClick={() => navigate("/forgot-password")}
              style={{
                color: "#62CBE4", // MUI primary color
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: "bold",
              }}
            >
              Forgot Password?
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
