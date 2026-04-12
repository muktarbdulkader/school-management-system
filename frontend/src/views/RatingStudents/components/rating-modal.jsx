import { useEffect, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

export default function RatingModal({ open, onClose, person, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState('medium');

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setSubCategory('');
  };

  const handleSubCategoryChange = (event) => {
    setSubCategory(event.target.value);
  };

  const handlePriorityChange = (event) => {
    setPriority(event.target.value);
  };

  const currentSubCategories = category
    ? categories.find((cat) => cat.category_id === category)?.subcategories ||
      []
    : [];

  const STATIC_CATEGORIES = [
    {
      category_id: 'academic',
      category_name: 'Academic Performance',
      subcategories: [
        { id: 'participation', name: 'Participation' },
        { id: 'homework', name: 'Homework Completion' },
        { id: 'test_scores', name: 'Test Scores' },
        { id: 'effort', name: 'Effort' },
      ],
    },
    {
      category_id: 'conduct',
      category_name: 'Conduct',
      subcategories: [
        { id: 'respect', name: 'Respect' },
        { id: 'discipline', name: 'Discipline' },
        { id: 'punctuality', name: 'Punctuality' },
      ],
    },
    {
      category_id: 'social',
      category_name: 'Social Skills',
      subcategories: [
        { id: 'teamwork', name: 'Teamwork' },
        { id: 'communication', name: 'Communication' },
        { id: 'leadership', name: 'Leadership' },
      ],
    },
    {
      category_id: 'emotional',
      category_name: 'Emotional Wellbeing',
      subcategories: [
        { id: 'attitude', name: 'Attitude' },
        { id: 'resilience', name: 'Resilience' },
        { id: 'motivation', name: 'Motivation' },
      ],
    },
  ];

  useEffect(() => {
    if (open) {
      setCategories(STATIC_CATEGORIES);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!rating) {
      alert('Please select a rating before submitting');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(
        rating,
        feedback,
        subject,
        category,
        subCategory,
        priority,
      );
      setRating(0);
      setFeedback('');
      setSubject('');
      setCategory('');
      setSubCategory('');
      setPriority('medium'); // Reset to default
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
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

        {/* Category and SubCategory Dropdowns - Side by Side */}
        {loading ? (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  value={category}
                  onChange={handleCategoryChange}
                  label="Category"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8f9fa',
                    },
                  }}
                  disabled={isSubmitting}
                >
                  <MenuItem value="">
                    <em>Select Category</em>
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel id="subcategory-label">Sub Category</InputLabel>
                <Select
                  labelId="subcategory-label"
                  value={subCategory}
                  onChange={handleSubCategoryChange}
                  label="Sub Category"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8f9fa',
                    },
                  }}
                  disabled={isSubmitting || !category}
                >
                  <MenuItem value="">
                    <em>Select Sub Category</em>
                  </MenuItem>
                  {currentSubCategories.map((subCat) => (
                    <MenuItem key={subCat.id} value={subCat.id}>
                      {subCat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {/* Priority Radio Button Section */}
        <Box mb={2}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1 }}>Priority</FormLabel>
            <RadioGroup
              row
              value={priority}
              onChange={handlePriorityChange}
            >
              <FormControlLabel value="low" control={<Radio />} label="Low" disabled={isSubmitting} />
              <FormControlLabel value="medium" control={<Radio />} label="Medium" disabled={isSubmitting} />
              <FormControlLabel value="high" control={<Radio />} label="High" disabled={isSubmitting} />
              <FormControlLabel value="urgent" control={<Radio />} label="Urgent" disabled={isSubmitting} />
            </RadioGroup>
          </FormControl>
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
          disabled={isSubmitting || loading}
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
