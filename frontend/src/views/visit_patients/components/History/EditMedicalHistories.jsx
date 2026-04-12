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
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const EditMedicalHistories = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  medicalHistory,
  visit,
}) => {
  const [medicalHistoryData, setMedicalHistoryData] = useState({
    visit_id: visit.id,
    systemic_conditions: [],
    allergies: [],
    current_systemic_medication: '',
  });

  const [currentSystemicCondition, setCurrentSystemicCondition] = useState('');
  const [currentAllergy, setCurrentAllergy] = useState('');

  // Initialize form with existing data when medicalHistory prop changes
  useEffect(() => {
    if (medicalHistory) {
      setMedicalHistoryData({
        systemic_conditions: medicalHistory.systemic_conditions || [],
        allergies: medicalHistory.allergies || [],
        current_systemic_medication:
          medicalHistory.current_systemic_medication || '',
      });
    }
  }, [medicalHistory]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setMedicalHistoryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSystemicCondition = () => {
    if (!currentSystemicCondition.trim()) {
      toast.error('Please enter a systemic condition');
      return;
    }

    setMedicalHistoryData((prev) => ({
      ...prev,
      systemic_conditions: [
        ...prev.systemic_conditions,
        currentSystemicCondition.trim(),
      ],
    }));
    setCurrentSystemicCondition('');
  };

  const handleRemoveSystemicCondition = (index) => {
    setMedicalHistoryData((prev) => ({
      ...prev,
      systemic_conditions: prev.systemic_conditions.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const handleAddAllergy = () => {
    if (!currentAllergy.trim()) {
      toast.error('Please enter an allergy');
      return;
    }

    setMedicalHistoryData((prev) => ({
      ...prev,
      allergies: [...prev.allergies, currentAllergy.trim()],
    }));
    setCurrentAllergy('');
  };

  const handleRemoveAllergy = (index) => {
    setMedicalHistoryData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(medicalHistoryData);
  };

  return (
    <DrogaFormModal
      open={open}
      title="Edit Medical History"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
    >
      {/* Systemic Conditions Section */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Systemic Conditions
        </Typography>
        <Box display="flex" alignItems="center">
          <TextField
            fullWidth
            label="Add Systemic Condition"
            value={currentSystemicCondition}
            onChange={(e) => setCurrentSystemicCondition(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={handleAddSystemicCondition}
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
          e.g. Diabetes, Hypertension, Asthma
        </Typography>

        {medicalHistoryData.systemic_conditions.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <List dense>
              {medicalHistoryData.systemic_conditions.map((item, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveSystemicCondition(index)}
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

      {/* Allergies Section */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Allergies
        </Typography>
        <Box display="flex" alignItems="center">
          <TextField
            fullWidth
            label="Add Allergy"
            value={currentAllergy}
            onChange={(e) => setCurrentAllergy(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={handleAddAllergy}
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
          e.g. Penicillin, Latex, Pollen
        </Typography>

        {medicalHistoryData.allergies.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <List dense>
              {medicalHistoryData.allergies.map((item, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveAllergy(index)}
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

      {/* Current Systemic Medication */}
      <TextField
        fullWidth
        label="Current Systemic Medication"
        name="current_systemic_medication"
        value={medicalHistoryData.current_systemic_medication}
        onChange={handleChange}
        margin="normal"
        sx={{ mt: 3 }}
        multiline
        rows={3}
      />
    </DrogaFormModal>
  );
};

EditMedicalHistories.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  medicalHistory: PropTypes.shape({
    systemic_conditions: PropTypes.arrayOf(PropTypes.string),
    allergies: PropTypes.arrayOf(PropTypes.string),
    current_systemic_medication: PropTypes.string,
  }),
};

export default EditMedicalHistories;
