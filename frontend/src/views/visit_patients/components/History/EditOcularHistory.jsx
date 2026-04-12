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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const EditOcularHistory = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  ocularHistory,
}) => {
  const [ocularHistoryData, setOcularHistoryData] = useState({
    current_oscular_medication: '',
    current_contact_lense_use: false,
    lens_type: '',
    family_history: [],
  });
  const [currentFamilyHistory, setCurrentFamilyHistory] = useState('');

  useEffect(() => {
    if (ocularHistory) {
      setOcularHistoryData({
        current_oscular_medication:
          ocularHistory.current_oscular_medication || '',
        current_contact_lense_use:
          ocularHistory.current_contact_lense_use || false,
        lens_type: ocularHistory.lens_type || '',
        family_history: ocularHistory.family_history || [],
      });
    }
  }, [ocularHistory]);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(ocularHistoryData);
  };

  return (
    <DrogaFormModal
      open={open}
      title="Edit Ocular History"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
    >
      <TextField
        fullWidth
        label="Current Ocular Medication"
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
          label="Currently using contact lenses"
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
            label="Add Family History"
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

EditOcularHistory.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  ocularHistory: PropTypes.shape({
    current_oscular_medication: PropTypes.string,
    current_contact_lense_use: PropTypes.bool,
    lens_type: PropTypes.string,
    family_history: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default EditOcularHistory;
