import React, { useEffect, useState } from 'react';
import { api } from '../API/Api';
import BuyerModal from '../component/BuyerModal';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import BuyerTable from '../component/BuyerTable';
import { Button } from '@mui/material';

const Buyers = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [filter, setFilter] = useState('All'); 

  const openModal = (buyer = null) => {
    setSelectedBuyer(buyer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBuyer(null);
    setIsModalOpen(false);
  };

  const handleSave = async (buyerData) => {
    try {
      if (selectedBuyer) {
        // Update existing buyer
        await api.put(`/update-buyer/${selectedBuyer._id}`, buyerData);
        setBuyers(buyers.map(b => b._id === selectedBuyer._id ? buyerData : b));
        toast.success('Buyer updated successfully! The changes have been saved.');
      } else {
        // Create new buyer
        const response = await api.post('/register-buyer', buyerData);
        setBuyers([...buyers, response.data.user]);
        toast.success('Buyer added successfully! The buyer has been added to your system.');
      }
    } catch (error) {
      console.error('Error saving buyer:', error);
      
      // Handle specific error cases with human-readable messages
      let errorMessage = 'Error saving buyer.';
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          if (data.message && data.message.includes("already exists")) {
            errorMessage = "A buyer with this NTN/CNIC already exists. Please use a different NTN/CNIC.";
          } else if (data.message && data.message.includes("validation")) {
            errorMessage = "Please check your input data. Some fields may be invalid or missing.";
          } else {
            errorMessage = data.message || "Invalid data provided. Please check all fields.";
          }
        } else if (status === 409) {
          errorMessage = "This buyer already exists in our system.";
        } else if (status === 500) {
          errorMessage = "Server error occurred. Please try again later.";
        } else {
          errorMessage = data.message || "An error occurred while saving the buyer.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error but don't close modal - let user fix the issue
      toast.error(errorMessage);
      return; // Don't close modal on error
    }
    
    // Only close modal on success
    closeModal();
  };

  const handleDelete = async (buyerId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/delete-buyer/${buyerId}`);
          setBuyers(buyers.filter(b => b._id !== buyerId));
          toast.success('Buyer deleted successfully! The buyer has been removed from your system.');
        } catch (error) {
          console.error('Error deleting buyer:', error);
          toast.error('Error deleting buyer.');
        }
      }
    });
  };

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const response = await api.get('/get-buyers');
        setBuyers(response.data.users);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching buyers:', error);
        setLoading(false);
      }
    };

    fetchBuyers();
  }, []);

  const filteredBuyers = filter === 'All' ? buyers : buyers.filter(b => b.buyerRegistrationType === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
       
      </div>
      <BuyerTable
        buyers={filteredBuyers}
        loading={loading}
        onEdit={openModal}
        onDelete={handleDelete}
        onAdd={openModal} 
      />
      <BuyerModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} buyer={selectedBuyer} />
    </div>
  );
};

export default Buyers; 