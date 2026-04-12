import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  CircularProgress,
  Box,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

const AddComplaint = ({ open, isSubmitting, onClose, onSubmit, visit }) => {
  const [complaintData, setComplaintData] = useState({
    visit_id: visit.id,
    primary_complaint: '',
  });
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [visitError, setVisitError] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setComplaintData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!complaintData.primary_complaint) {
      toast.error('Please fill all required fields.');
      return;
    }
    onSubmit(complaintData);
    setComplaintData({
      visit_id: visit.id,
      primary_complaint: '',
    });
  };

  return (
    <DrogaFormModal
      open={open}
      title="Add Complaint"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
    >
      <TextField
        fullWidth
        label="Primary Complaint"
        name="primary_complaint"
        value={complaintData.primary_complaint}
        onChange={handleChange}
        margin="normal"
        required
        multiline
        rows={4}
      />
    </DrogaFormModal>
  );
};

AddComplaint.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default AddComplaint;
