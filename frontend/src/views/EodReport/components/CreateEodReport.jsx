import React, { useState } from 'react';
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

const CreateEodReport = ({
  open,
  handleCloseModal,
  handleCoachingSubmission,
  submitting,
}) => {
  const [formData, setFormData] = useState({
    completed: '',
    not_completed: '',
    challenge_faced: '',
    next_action: '',
    satisfaction: 0, // Default to 0 (invalid)
  });

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
    handleCoachingSubmission(formData);
  };

  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            Create EOD Report
            <IconButton onClick={handleCloseModal}>
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
            onClick={handleCloseModal}
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
            {submitting ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

CreateEodReport.propTypes = {
  open: PropTypes.bool.isRequired,
  handleCloseModal: PropTypes.func.isRequired,
  handleCoachingSubmission: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

export default CreateEodReport;
