import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const EditComplaint = ({
  open = false,
  isSubmitting = false,
  onClose = () => {},
  onSubmit = () => {},
  complaint = null,
}) => {
  const [complaintData, setComplaintData] = useState({
    primary_complaint: '',
  });

  // Initialize form with existing complaint data
  useEffect(() => {
    if (complaint && open) {
      setComplaintData({
        primary_complaint: complaint.primary_complaint || '',
      });
    }
  }, [complaint, open]);

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
    onSubmit({
      ...complaintData,
    });
  };

  return (
    <DrogaFormModal
      open={open}
      title="Edit Complaint"
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

EditComplaint.propTypes = {
  open: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  complaint: PropTypes.shape({
    id: PropTypes.string,
    primary_complaint: PropTypes.string,
  }),
};

export default EditComplaint;
