import { useState, useEffect } from 'react';
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

const EditInitialImpressions = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [initialImpressionData, setInitialImpressionData] = useState({
    visit_id: '',
    primary_diagnosis: '',
    plan: '',
  });

  const [errors, setErrors] = useState({});

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      setInitialImpressionData({
        visit_id: initialData.visit_id || '',
        primary_diagnosis: initialData.primary_diagnosis || '',
        plan: initialData.plan || '',
      });
    }
  }, [initialData]);

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
      title="Edit Initial Impression"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      maxWidth="md"
    >
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Primary Diagnosis
            </Typography>
            <FormControl
              fullWidth
              margin="normal"
              required
              error={!!errors.primary_diagnosis}
            >
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

          {/* Plan Section */}

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
              Treatment Plan
            </Typography>

            <TextField
              fullWidth
              label="Plan"
              name="plan"
              value={initialImpressionData.plan}
              onChange={handleChange}
              margin="normal"
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

EditInitialImpressions.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object.isRequired,
};

export default EditInitialImpressions;
