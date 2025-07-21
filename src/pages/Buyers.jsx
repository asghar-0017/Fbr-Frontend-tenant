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
        toast.success('Buyer updated successfully!');
      } else {
        // Create new buyer
        const response = await api.post('/register-buyer', buyerData);
        setBuyers([...buyers, response.data.user]);
        toast.success('Buyer added successfully!');
      }
    } catch (error) {
      console.error('Error saving buyer:', error);
      toast.error('Error saving buyer.');
    } finally {
      closeModal();
    }
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
          toast.success('Buyer deleted successfully!');
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