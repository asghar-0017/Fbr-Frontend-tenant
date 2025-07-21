import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Pagination,
  MenuItem,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import { green, red } from '@mui/material/colors';

export default function BuyerTable({ buyers, loading, onEdit, onDelete, onAdd }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter buyers by search (all main fields)
  const filteredBuyers = buyers.filter(buyer => {
    const searchLower = search.trim().toLowerCase();
    return (
      (buyer.buyerNTNCNIC || "").toLowerCase().includes(searchLower) ||
      (buyer.buyerBusinessName || "").toLowerCase().includes(searchLower) ||
      (buyer.buyerProvince || "").toLowerCase().includes(searchLower) ||
      (buyer.buyerAddress || "").toLowerCase().includes(searchLower) ||
      (buyer.buyerRegistrationType || "").toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBuyers.length / rowsPerPage);
  const paginatedBuyers = filteredBuyers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => { setPage(1); }, [search, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between', // Align items to have space between them
          gap: 2,
          mb: 3,
          p: 2,
          borderRadius: 3,
          background: 'linear-gradient(90deg, #e3f2fd 0%, #f8fafc 100%)',
          boxShadow: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PeopleIcon sx={{ fontSize: 40, color: '#1976d2' }} />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: '#1976d2',
              letterSpacing: 1,
              textShadow: '0 2px 8px #e3e3e3',
            }}
          >
            Buyer Management
          </Typography>
        </Box>
        <Button variant="contained" color="primary" onClick={() => onAdd()}>
          Add Buyer
        </Button>
      </Box>
      {/* Search and Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by any field"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
        />
        <TextField
          select
          label="Rows per page"
          size="small"
          value={rowsPerPage}
          onChange={e => setRowsPerPage(Number(e.target.value))}
          sx={{ minWidth: 120 }}
        >
          {[5, 10, 20, 50].map(num => (
            <MenuItem key={num} value={num}>{num}</MenuItem>
          ))}
        </TextField>
      </Box>
      {/* Table */}
      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, overflow: "hidden", boxShadow: 4 }}>
        <Table sx={{ minWidth: 650 }} aria-label="buyer table">
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)' }}>
              {["NTN/CNIC", "Business Name", "Province", "Address", "Registration Type", "Actions"].map((heading) => (
                <TableCell
                  key={heading}
                  align={heading === "NTN/CNIC" ? "left" : "right"}
                  sx={{ color: '#fff', fontWeight: "bold", fontSize: 16, letterSpacing: 0.5 }}
                >
                  {heading}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedBuyers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No buyers found
                </TableCell>
              </TableRow>
            ) : (
              paginatedBuyers.map((buyer, index) => (
                <TableRow
                  key={buyer._id || index}
                  sx={{
                    backgroundColor: index % 2 === 0 ? '#f5fafd' : '#e3f2fd',
                    '&:hover': { backgroundColor: '#bbdefb', transition: 'background-color 0.3s' },
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 15 }}>
                    {buyer.buyerNTNCNIC}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {buyer.buyerBusinessName}
                  </TableCell>
                  <TableCell align="right">
                    {buyer.buyerProvince}
                  </TableCell>
                  <TableCell align="right">
                    {buyer.buyerAddress}
                  </TableCell>
                  <TableCell align="right">
                    {buyer.buyerRegistrationType}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      onClick={() => onEdit(buyer)}
                      variant="outlined"
                      size="small"
                      sx={{ color: green[700], borderColor: green[700], mr: 1, '&:hover': { backgroundColor: green[700], color: 'white', borderColor: green[700] } }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => onDelete(buyer._id)}
                      variant="outlined"
                      size="small"
                      sx={{ color: red[700], borderColor: red[700], '&:hover': { backgroundColor: red[700], color: 'white', borderColor: red[700] } }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Pagination Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
} 