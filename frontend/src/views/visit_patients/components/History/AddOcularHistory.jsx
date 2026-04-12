import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const AddOcularHistory = ({ open, isSubmitting, onClose, onSubmit, visit }) => {
  // Initial form state
  const initialFormState = {
    visit_id: visit.id,
    current_oscular_medication: '',
    current_contact_lense_use: false,
    lens_type: '',
    family_history: [],
  };

  const [ocularHistoryData, setOcularHistoryData] = useState(initialFormState);
  const [currentFamilyHistory, setCurrentFamilyHistory] = useState('');

  // Reset form function
  const resetForm = () => {
    setOcularHistoryData(initialFormState);
    setCurrentFamilyHistory('');
  };

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setOcularHistoryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setOcularHistoryData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAddFamilyHistory = () => {
    if (!currentFamilyHistory.trim()) {
      toast.error('Please enter a family history item');
      return;
    }

    setOcularHistoryData((prev) => ({
      ...prev,
      family_history: [...prev.family_history, currentFamilyHistory.trim()],
    }));
    setCurrentFamilyHistory('');
  };

  const handleRemoveFamilyHistory = (index) => {
    setOcularHistoryData((prev) => ({
      ...prev,
      family_history: prev.family_history.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (ocularHistoryData.family_history.length === 0) {
      toast.error('Please add at least one family history item');
      return;
    }

    try {
      await onSubmit(ocularHistoryData);
      resetForm(); // Clear form after successful submission
    } catch (error) {
      console.error('Submission error:', error);
      // Error handling is typically done in the parent component
    }
  };

  return (
    <DrogaFormModal
      open={open}
      title="Add Ocular History"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
    >
      <TextField
        fullWidth
        label="Current Ocular Medications"
        name="current_oscular_medication"
        value={ocularHistoryData.current_oscular_medication}
        onChange={handleChange}
        margin="normal"
      />

      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              name="current_contact_lense_use"
              checked={ocularHistoryData.current_contact_lense_use}
              onChange={handleCheckboxChange}
            />
          }
          label="Current Spectacle/Contact Lens Use"
        />
      </FormGroup>

      {ocularHistoryData.current_contact_lense_use && (
        <TextField
          fullWidth
          label="Lens Type"
          name="lens_type"
          value={ocularHistoryData.lens_type}
          onChange={handleChange}
          margin="normal"
        />
      )}

      <Box sx={{ mt: 2 }}>
        <Box display="flex" alignItems="center">
          <TextField
            fullWidth
            label="Family History of Ocular Diseases"
            value={currentFamilyHistory}
            onChange={(e) => setCurrentFamilyHistory(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={handleAddFamilyHistory}
            sx={{ ml: 2, height: '56px' }}
          >
            Add
          </Button>
        </Box>

        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mt: 1, ml: 0.5 }}
        >
          e.g. glaucoma, macular degeneration, strabismus, significant
          refractive error
        </Typography>

        {ocularHistoryData.family_history.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <strong>Family History:</strong>
            <List dense>
              {ocularHistoryData.family_history.map((item, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFamilyHistory(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </DrogaFormModal>
  );
};

AddOcularHistory.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  visit: PropTypes.object.isRequired,
};

export default AddOcularHistory;
