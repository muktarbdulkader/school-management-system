import { useState, useEffect } from 'react';
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

const EditVisualAcuity = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  visualAcuity,
  visit,
}) => {
  const [acuityData, setAcuityData] = useState({
    visit_id: '',
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

  // Initialize form with existing visual acuity data
  useEffect(() => {
    if (visualAcuity && open) {
      setAcuityData({
        visit_id: visualAcuity.visit_id || '',
        distance_od_ucva: visualAcuity.distance_od?.ucva || '',
        distance_od_scva: visualAcuity.distance_od?.scva || '',
        distance_od_bcva: visualAcuity.distance_od?.bcva || '',
        distance_os_ucva: visualAcuity.distance_os?.ucva || '',
        distance_os_scva: visualAcuity.distance_os?.scva || '',
        distance_os_bcva: visualAcuity.distance_os?.bcva || '',
        near_od_ucva: visualAcuity.near_od?.ucva || '',
        near_od_scva: visualAcuity.near_od?.scva || '',
        near_od_bcva: visualAcuity.near_od?.bcva || '',
        near_os_ucva: visualAcuity.near_os?.ucva || '',
        near_os_scva: visualAcuity.near_os?.scva || '',
        near_os_bcva: visualAcuity.near_os?.bcva || '',
        pupil_reaction_od_ucva: visualAcuity.pupil_reaction_od?.ucva || '',
        pupil_reaction_od_scva: visualAcuity.pupil_reaction_od?.scva || '',
        pupil_reaction_od_bcva: visualAcuity.pupil_reaction_od?.bcva || '',
        pupil_reaction_os_ucva: visualAcuity.pupil_reaction_os?.ucva || '',
        pupil_reaction_os_scva: visualAcuity.pupil_reaction_os?.scva || '',
        pupil_reaction_os_bcva: visualAcuity.pupil_reaction_os?.bcva || '',
      });
    }
  }, [visualAcuity, open]);

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

    // Send the flat structure directly (same as AddVisualAcuity)
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
                onChange={(e) => handleChange(fieldName, e.target.value)}
                margin="normal"
                placeholder="e.g. 20/20"
                error={!!errors[fieldName]}
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
      title="Edit Visual Acuity"
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

EditVisualAcuity.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  visualAcuity: PropTypes.shape({
    visit_id: PropTypes.string,
    distance_od: PropTypes.shape({
      ucva: PropTypes.string,
      scva: PropTypes.string,
      bcva: PropTypes.string,
    }),
    distance_os: PropTypes.shape({
      ucva: PropTypes.string,
      scva: PropTypes.string,
      bcva: PropTypes.string,
    }),
    near_od: PropTypes.shape({
      ucva: PropTypes.string,
      scva: PropTypes.string,
      bcva: PropTypes.string,
    }),
    near_os: PropTypes.shape({
      ucva: PropTypes.string,
      scva: PropTypes.string,
      bcva: PropTypes.string,
    }),
    pupil_reaction_od: PropTypes.shape({
      ucva: PropTypes.string,
      scva: PropTypes.string,
      bcva: PropTypes.string,
    }),
    pupil_reaction_os: PropTypes.shape({
      ucva: PropTypes.string,
      scva: PropTypes.string,
      bcva: PropTypes.string,
    }),
  }),
};

EditVisualAcuity.defaultProps = {
  visualAcuity: null,
};

export default EditVisualAcuity;
