import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Box,
  Typography,
  Grid,
  Divider,
  FormHelperText,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const AddVisualAcuity = ({ open, isSubmitting, onClose, onSubmit, visit }) => {
  const [acuityData, setAcuityData] = useState({
    visit_id: visit.id,
    distance_od_ucva: '',
    distance_od_scva: '',
    distance_od_bcva: '',
    distance_os_ucva: '',
    distance_os_scva: '',
    distance_os_bcva: '',
    near_od_ucva: '',
    near_od_scva: '',
    near_od_bcva: '',
    near_os_ucva: '',
    near_os_scva: '',
    near_os_bcva: '',
    pupil_reaction_od_ucva: '',
    pupil_reaction_od_scva: '',
    pupil_reaction_od_bcva: '',
    pupil_reaction_os_ucva: '',
    pupil_reaction_os_scva: '',
    pupil_reaction_os_bcva: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setAcuityData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateFields = () => {
    const newErrors = {};
    const requiredFields = [
      'distance_od_ucva',
      'distance_od_scva',
      'distance_od_bcva',
      'distance_os_ucva',
      'distance_os_scva',
      'distance_os_bcva',
      'near_od_ucva',
      'near_od_scva',
      'near_od_bcva',
      'near_os_ucva',
      'near_os_scva',
      'near_os_bcva',
      'pupil_reaction_od_ucva',
      'pupil_reaction_od_scva',
      'pupil_reaction_od_bcva',
      'pupil_reaction_os_ucva',
      'pupil_reaction_os_scva',
      'pupil_reaction_os_bcva',
    ];

    requiredFields.forEach((field) => {
      if (!acuityData[field]) {
        newErrors[field] = `The ${field.replace(/_/g, ' ')} field is required.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateFields()) {
      toast.error('Please fill all required fields');
      return;
    }

    onSubmit(acuityData);
  };

  const renderAcuityInputs = (title, prefix) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {['ucva', 'scva', 'bcva'].map((type) => {
          const fieldName = `${prefix}_${type}`;
          return (
            <Grid item xs={4} key={fieldName}>
              <TextField
                fullWidth
                label={type.toUpperCase()}
                value={acuityData[fieldName]}
                onChange={(e) => {
                  const value = e.target.value;
                  const validFormat = /^\d{0,3}\s*\/?\s*\d{0,3}$/.test(value);
                  if (validFormat) {
                    handleChange(fieldName, value);
                  }
                }}
                margin="normal"
                placeholder="e.g. 525 / 442"
                error={!!errors[fieldName]}
                inputProps={{
                  inputMode: 'text',
                }}
              />
              {errors[fieldName] && (
                <FormHelperText error>{errors[fieldName]}</FormHelperText>
              )}
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  return (
    <DrogaFormModal
      open={open}
      title="Add Visual Acuity"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      maxWidth="md"
    >
      <Box sx={{ mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          Distance Vision (Snellen Chart - 20 feet/6 meters)
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Right Eye (OD)
        </Typography>
        {renderAcuityInputs('', 'distance_od')}

        <Typography variant="subtitle2" gutterBottom>
          Left Eye (OS)
        </Typography>
        {renderAcuityInputs('', 'distance_os')}

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          Near (Jaeger/Reduced Snellen - 14 inches/35 cm)
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Right Eye (OD)
        </Typography>
        {renderAcuityInputs('', 'near_od')}

        <Typography variant="subtitle2" gutterBottom>
          Left Eye (OS)
        </Typography>
        {renderAcuityInputs('', 'near_os')}

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          Pupil Reaction
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Right Eye (OD)
        </Typography>
        {renderAcuityInputs('', 'pupil_reaction_od')}

        <Typography variant="subtitle2" gutterBottom>
          Left Eye (OS)
        </Typography>
        {renderAcuityInputs('', 'pupil_reaction_os')}
      </Box>
    </DrogaFormModal>
  );
};

AddVisualAcuity.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  visit: PropTypes.object.isRequired,
};

export default AddVisualAcuity;
