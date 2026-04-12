import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack
} from '@mui/material';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const BookCreateForm = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    total_copies: 1,
    location: '',
    publisher: '',
    publication_year: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author || !formData.isbn || !formData.category || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      // add available copies same as total copies
      const payload = {
          ...formData,
          total_copies: parseInt(formData.total_copies) || 1,
          available_copies: parseInt(formData.total_copies) || 1
      };
      
      if (!payload.publication_year) {
          delete payload.publication_year;
      } else {
          payload.publication_year = parseInt(payload.publication_year);
      }
      
      const response = await fetch(`${Backend.api}library/books/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && (data.success || data.id)) {
        toast.success('Book added successfully');
        onSuccess();
        handleClose();
      } else {
        // Extract exact DRF field error if it exists (e.g., {"isbn": ["Book with this ISBN already exists."]})
        let errorMessage = 'Failed to add book';
        if (data.message) {
            errorMessage = data.message;
        } else if (typeof data === 'object') {
            const firstKey = Object.keys(data)[0];
            if (firstKey && Array.isArray(data[firstKey])) {
                errorMessage = `${firstKey.toUpperCase()}: ${data[firstKey][0]}`;
            }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
        title: '',
        author: '',
        isbn: '',
        category: '',
        total_copies: 1,
        location: '',
        publisher: '',
        publication_year: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Book</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="ISBN"
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Location (Shelf)"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              type="number"
              label="Total Copies"
              name="total_copies"
              value={formData.total_copies}
              onChange={handleChange}
              required
              InputProps={{ inputProps: { min: 1 } }}
            />
            <TextField
              fullWidth
              label="Publisher"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              type="number"
              label="Publication Year"
              name="publication_year"
              value={formData.publication_year}
              onChange={handleChange}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Adding...' : 'Add Book'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BookCreateForm;
