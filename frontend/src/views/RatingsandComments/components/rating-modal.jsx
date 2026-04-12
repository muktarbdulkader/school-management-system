import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Avatar,
  IconButton,
  Rating,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

export default function RatingModal({ open, onClose, person, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      alert('Please select a rating before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, feedback, subject);
      setRating(0);
      setFeedback('');
      setSubject('');
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose} // Prevent closing when submitting
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 5,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h3" component="div" fontWeight={600}>
            Rate & Provide Feedback
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'grey.500' }}
            disabled={isSubmitting}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* Person Profile Section */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar src={person.avatar} sx={{ width: 56, height: 56 }}>
            {person.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {person.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {person.title}
            </Typography>
          </Box>
        </Box>

        {/* Rating Section */}
        <Box mb={3}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight="500"
            mb={1}
          >
            Your Rating
          </Typography>
          <Box>
            <Rating
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue || 0);
              }}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': {
                  color: '#ff9800',
                },
                '& .MuiRating-iconEmpty': {
                  color: '#e0e0e0',
                },
              }}
              disabled={isSubmitting}
            />
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Subject
          </Typography>
          <TextField
            multiline
            rows={1}
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#f8f9fa',
              },
            }}
            disabled={isSubmitting}
          />
        </Box>

        {/* Feedback Section */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Your Feedback *
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#f8f9fa',
              },
            }}
            disabled={isSubmitting}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            mt={1}
            display="block"
          >
            Your feedback helps us improve our educational experience.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'grey.600',
            borderColor: 'grey.300',
            '&:hover': {
              borderColor: 'grey.400',
              backgroundColor: 'grey.50',
            },
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            backgroundColor: 'primary',
            '&:hover': {
              backgroundColor: '#1976d2',
            },
            minWidth: 120, // To prevent button from resizing when loading
          }}
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

RatingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  person: PropTypes.shape({
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
};
