import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  CircularProgress,
  Slider,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

const EditEodReport = ({
  open,
  item,
  onClose,
  handleEditSubmission,
  submitting,
}) => {
  const [formData, setFormData] = useState({
    completed: '',
    not_completed: '',
    challenge_faced: '',
    next_action: '',
    satisfaction: 0,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        completed: item.completed || '',
        not_completed: item.not_completed || '',
        challenge_faced: item.challenge_faced || '',
        next_action: item.next_action || '',
        satisfaction: Number(item.satisfaction) || 0,
      });
    }
  }, [item]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSliderChange = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      satisfaction: newValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleEditSubmission(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            Edit EOD Report
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3} py={2}>
            <TextField
              label="Completed Tasks"
              name="completed"
              value={formData.completed}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              required
            />

            <TextField
              label="Not Completed Tasks"
              name="not_completed"
              value={formData.not_completed}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              required
            />

            <TextField
              label="Challenges Faced"
              name="challenge_faced"
              value={formData.challenge_faced}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              required
            />

            <TextField
              label="Next Actions"
              name="next_action"
              value={formData.next_action}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              required
            />

            <Box>
              <Typography gutterBottom>
                Satisfaction Level: {formData.satisfaction}
              </Typography>
              <Slider
                value={formData.satisfaction}
                onChange={handleSliderChange}
                aria-labelledby="satisfaction-slider"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={0}
                max={5}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onClose}
            startIcon={<CloseIcon />}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={submitting || formData.satisfaction === 0}
          >
            {submitting ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

EditEodReport.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  handleEditSubmission: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  item: PropTypes.object,
};

export default EditEodReport;
