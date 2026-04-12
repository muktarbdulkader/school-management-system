import React, { useState, useEffect } from 'react';
import { Modal, TextField, Button, Box } from '@mui/material';
import Backend from 'services/backend';
import { toast } from 'react-toastify';

const EditUnitType = ({ open, unitType, onClose, onUpdate }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (unitType) {
      setName(unitType.name);
    }
  }, [unitType]);

  const handleUpdate = async () => {
    if (!unitType?.id) {
      toast.error('Unit type ID is undefined.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    const Api = `${Backend.api}unit-types/${unitType.id}`; 

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = { name};

    try {
      const response = await fetch(Api, {
        method: 'PATCH',
        headers: header,
        body: JSON.stringify(data)
      });

      const result = await response.json();


      if (response.ok) {
        onUpdate({ ...unitType, name });
        toast.success('Unit type updated successfully');
        onClose();
      } else {
        toast.error(result.message || 'Failed to update unit type');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}  
    sx={ {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        }}>
      <Box
        sx={{
          width: 300,
          margin: 'auto',
          marginTop: '20%',
          padding: 2,
          backgroundColor: 'white',
          borderRadius: 2
        }}
      >
        <TextField
          fullWidth
          label="Unit Type"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ marginBottom: 2 }}
          disabled={loading}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdate}
          disabled={loading || !name.trim()}
        >
          {loading ? 'Updating...' : 'Update'}
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ marginLeft: 1 }}
          disabled={loading}
        >
          Cancel
        </Button>
      </Box>
    </Modal>
  );
};

export default EditUnitType;
