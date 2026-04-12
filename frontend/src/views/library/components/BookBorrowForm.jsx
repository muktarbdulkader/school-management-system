import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem
} from '@mui/material';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const BookBorrowForm = ({ open, onClose, onSuccess, books }) => {
  const [formData, setFormData] = useState({
    book: '',
    borrower: '',
    due_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open]);

  const fetchMembers = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}library/members/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMembers(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.book || !formData.due_date || !formData.borrower) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}library/borrowings/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Book borrowed successfully');
        onSuccess();
        handleClose();
      } else {
        toast.error(data.message || 'Failed to borrow book');
      }
    } catch (error) {
      console.error('Error borrowing book:', error);
      toast.error('Failed to borrow book');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ book: '', borrower: '', due_date: '' });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Borrow Book</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              select
              label="Book"
              name="book"
              value={formData.book}
              onChange={handleChange}
              required
            >
              {books.filter(b => b.available_copies > 0).map(book => (
                <MenuItem key={book.id} value={book.id}>
                  {book.title} - {book.author} ({book.available_copies} available)
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Borrower"
              name="borrower"
              value={formData.borrower}
              onChange={handleChange}
              required
            >
              {members.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.user?.full_name} ({member.member_id})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Borrowing...' : 'Borrow'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BookBorrowForm;
