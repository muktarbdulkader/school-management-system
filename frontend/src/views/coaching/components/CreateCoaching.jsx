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
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

const CreateCoaching = ({
  open,
  handleCloseModal,
  handleCoachingSubmission,
  submitting,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    status: 0,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
            Create New Coaching Session
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3} py={2}>
            <TextField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              required
            />

            <TextField
              label="Body"
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              required
            />

            {/* <TextField
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              select
              fullWidth
              variant="outlined"
              SelectProps={{ native: true }}
            >
              <option value={0}>Pending</option>
              <option value={1}>In Progress</option>
              <option value={2}>Completed</option>
            </TextField> */}
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
            disabled={submitting || !formData.title || !formData.body}
          >
            {submitting ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

CreateCoaching.propTypes = {
  open: PropTypes.bool.isRequired,
  handleCloseModal: PropTypes.func.isRequired,
  handleCoachingSubmission: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

export default CreateCoaching;
