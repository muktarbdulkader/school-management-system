import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Box,
  Typography,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const diagnosisOptions = [
  'Cataract',
  'Glaucoma',
  'Diabetic Retinopathy',
  'Macular Degeneration',
  'Dry Eye Syndrome',
  'Conjunctivitis',
  'Refractive Error',
  'Other',
];

const AddInitialImpressions = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  visit,
}) => {
  const [initialImpressionData, setInitialImpressionData] = useState({
    visit_id: visit.id,
    primary_diagnosis: '',
    plan: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInitialImpressionData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateFields = () => {
    const newErrors = {};
    const requiredFields = ['primary_diagnosis', 'plan'];

    requiredFields.forEach((field) => {
      if (!initialImpressionData[field]) {
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

    onSubmit(initialImpressionData);
  };

  return (
    <DrogaFormModal
      open={open}
      title="Add Initial Impression"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      maxWidth="md"
    >
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Primary Diagnosis
            </Typography>
            <FormControl fullWidth required error={!!errors.primary_diagnosis}>
              <InputLabel>Primary Diagnosis</InputLabel>
              <Select
                name="primary_diagnosis"
                value={initialImpressionData.primary_diagnosis}
                onChange={handleChange}
                label="Primary Diagnosis"
              >
                {diagnosisOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              {errors.primary_diagnosis && (
                <FormHelperText>{errors.primary_diagnosis}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
              Treatment Plan
            </Typography>
            {/* <Divider sx={{ mb: 2 }} /> */}
            <TextField
              fullWidth
              label="Plan"
              name="plan"
              value={initialImpressionData.plan}
              onChange={handleChange}
              required
              error={!!errors.plan}
              helperText={errors.plan}
              multiline
              rows={4}
            />
          </Grid>
        </Grid>
      </Box>
    </DrogaFormModal>
  );
};

AddInitialImpressions.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  visit: PropTypes.object.isRequired,
};

export default AddInitialImpressions;
