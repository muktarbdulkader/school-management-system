import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Rating,
  Typography,
  Box
} from '@mui/material';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const PerformanceRatingForm = ({ open, onClose, onSuccess, teacher }) => {
  const [formData, setFormData] = useState({
    category: 'teaching_quality',
    rating: 3,
    comment: ''
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'teaching_quality', label: 'Teaching Quality' },
    { value: 'punctuality', label: 'Punctuality' },
    { value: 'communication', label: 'Communication' },
    { value: 'classroom_management', label: 'Classroom Management' },
    { value: 'student_engagement', label: 'Student Engagement' },
    { value: 'professionalism', label: 'Professionalism' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'innovation', label: 'Innovation' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.comment.trim()) {
      toast.error('Please provide a comment');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.teacherRatings}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          teacher: teacher.id
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Rating submitted successfully');
        onSuccess();
        handleClose();
      } else {
        toast.error(data.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ category: 'teaching_quality', rating: 3, comment: '' });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Rate Teacher Performance</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Teacher: {teacher?.user?.full_name || teacher?.user_details?.full_name || 'N/A'}
              </Typography>
            </Box>

            <TextField
              fullWidth
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Rating (1-5 stars)
              </Typography>
              <Rating
                name="rating"
                value={formData.rating}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ ...prev, rating: newValue }));
                }}
                size="large"
              />
            </Box>

            <TextField
              fullWidth
              label="Comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              multiline
              rows={4}
              required
              placeholder="Provide detailed feedback about this category..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PerformanceRatingForm;
