import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Divider,
  CircularProgress,
  useTheme,
  FormHelperText,
} from '@mui/material';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

const EditFundusExaminations = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  examination,
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    dilated: {
      value: 'No',
      time: '',
      drops: '',
    },
    optic_disc_od: '',
    optic_disc_od_cupping: '',
    optic_disc_od_other: '',
    optic_disc_os: '',
    optic_disc_os_cupping: '',
    optic_disc_os_other: '',
    macula_od: '',
    macula_od_other: '',
    macula_os: '',
    macula_os_other: '',
    vessels_od: '',
    vessels_od_other: '',
    vessels_os: '',
    vessels_os_other: '',
    periphery_od: 'Attached',
    periphery_od_other: '',
    periphery_os: 'Attached',
    periphery_os_other: '',
    visit_id: '',
    id: '',
  });

  const [errors, setErrors] = useState({
    dilation_time: false,
    dilation_drops: false,
  });

  // Transform the nested examination data to flat structure
  useEffect(() => {
    if (examination) {
      setFormData({
        dilated: {
          value: examination.dilated?.value || 'No',
          time: examination.dilated?.time || '',
          drops: examination.dilated?.drops || '',
        },
        optic_disc_od: examination.optic_disc_od || 'Pink & Healthy',
        optic_disc_od_cupping: examination.optic_disc_od_cupping || '',
        optic_disc_od_other: examination.optic_disc_od_other || '',
        optic_disc_os: examination.optic_disc_os || 'Pink & Healthy',
        optic_disc_os_cupping: examination.optic_disc_os_cupping || '',
        optic_disc_os_other: examination.optic_disc_os_other || '',
        macula_od: examination.macula_od || 'Flat & Intact',
        macula_od_other: examination.macula_od_other || '',
        macula_os: examination.macula_os || 'Flat & Intact',
        macula_os_other: examination.macula_os_other || '',
        vessels_od: examination.vessels_od || 'Normal',
        vessels_od_other: examination.vessels_od_other || '',
        vessels_os: examination.vessels_os || 'Normal',
        vessels_os_other: examination.vessels_os_other || '',
        periphery_od: examination.periphery_od || 'Attached',
        periphery_od_other: examination.periphery_od_other || '',
        periphery_os: examination.periphery_os || 'Attached',
        periphery_os_other: examination.periphery_os_other || '',
        visit_id: examination.visit_id || '',
        id: examination.id || '',
      });
    }
  }, [examination]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleDilatedChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      dilated: {
        ...prev.dilated,
        [field]: value,
      },
    }));

    // Clear errors when changing dilation values
    if (field === 'time') {
      setErrors((prev) => ({ ...prev, dilation_time: false }));
    } else if (field === 'drops') {
      setErrors((prev) => ({ ...prev, dilation_drops: false }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      dilation_time: false,
      dilation_drops: false,
    };

    if (formData.dilated.value === 'Yes') {
      if (!formData.dilated.time) {
        newErrors.dilation_time = true;
      }
      if (!formData.dilated.drops) {
        newErrors.dilation_drops = true;
      }
    }

    setErrors(newErrors);
    return !newErrors.dilation_time && !newErrors.dilation_drops;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    // Transform back to nested structure expected by backend
    const formattedData = {
      dilated: {
        value: formData.dilated.value,
        time: formData.dilated.value === 'Yes' ? formData.dilated.time : null,
        drops: formData.dilated.value === 'Yes' ? formData.dilated.drops : null,
      },
      optic_disc: {
        od: {
          status: formData.optic_disc_od,
          cupping: formData.optic_disc_od_cupping || null,
          other: formData.optic_disc_od_other || null,
        },
        os: {
          status: formData.optic_disc_os,
          cupping: formData.optic_disc_os_cupping || null,
          other: formData.optic_disc_os_other || null,
        },
      },
      macula: {
        od: {
          status: formData.macula_od,
          other: formData.macula_od_other || null,
        },
        os: {
          status: formData.macula_os,
          other: formData.macula_os_other || null,
        },
      },
      vessels: {
        od: {
          status: formData.vessels_od,
          other: formData.vessels_od_other || null,
        },
        os: {
          status: formData.vessels_os,
          other: formData.vessels_os_other || null,
        },
      },
      periphery: {
        od: {
          status: formData.periphery_od,
          other: formData.periphery_od_other || null,
        },
        os: {
          status: formData.periphery_os,
          other: formData.periphery_os_other || null,
        },
      },
      visit_id: formData.visit_id,
      id: formData.id,
    };

    onSubmit(formattedData);
  };

  const renderEyeSection = (
    title,
    fieldPrefix,
    options,
    hasOtherField = true,
  ) => {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Grid container spacing={2}>
          {['od', 'os'].map((eye) => (
            <Grid item xs={12} md={6} key={`${fieldPrefix}_${eye}`}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {eye === 'od' ? 'OD (Right Eye)' : 'OS (Left Eye)'}
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData[`${fieldPrefix}_${eye}`]}
                  onChange={(e) =>
                    handleChange(`${fieldPrefix}_${eye}`, e.target.value)
                  }
                  label="Status"
                >
                  {options.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {hasOtherField &&
                formData[`${fieldPrefix}_${eye}`] === 'Other' && (
                  <TextField
                    fullWidth
                    label="Other Details"
                    value={formData[`${fieldPrefix}_${eye}_other`]}
                    onChange={(e) =>
                      handleChange(
                        `${fieldPrefix}_${eye}_other`,
                        e.target.value,
                      )
                    }
                  />
                )}

              {fieldPrefix === 'optic_disc' &&
                formData[`${fieldPrefix}_${eye}`] === 'Cupping' && (
                  <TextField
                    fullWidth
                    label="Cupping Details"
                    value={formData[`${fieldPrefix}_${eye}_cupping`]}
                    onChange={(e) =>
                      handleChange(
                        `${fieldPrefix}_${eye}_cupping`,
                        e.target.value,
                      )
                    }
                    sx={{ mb: 2 }}
                  />
                )}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const opticDiscOptions = [
    'Pink & Healthy',
    'Cupping',
    'Edema',
    'Drusen',
    'Hemorrhage',
    'Pallor (Temporal/Global)',
    'Other',
  ];
  const maculaOptions = [
    'Flat & Intact',
    'Edema',
    'Drusen',
    'Hemorrhage',
    'Pigmentary Changes',
    'Cyst',
    'Hole',
    'Other',
  ];
  const vesselsOptions = [
    'Normal',
    'Attenuated',
    'Tortuosity',
    'Tortuous',
    'A-V Nicking',
    'Sheathing',
    'Exudates',
    'Microaneurysms',
    'Neovascularization',
    'Hemorrhage',
    'Other',
  ];
  const peripheryOptions = ['Attached', 'Detached', 'Degeneration', 'Other'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Fundus Examination</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dilation Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Dilated</InputLabel>
                <Select
                  value={formData.dilated.value}
                  onChange={(e) => handleDilatedChange('value', e.target.value)}
                  label="Dilated"
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.dilated.value === 'Yes' && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Dilation Time *"
                    type="time"
                    value={formData.dilated.time}
                    onChange={(e) =>
                      handleDilatedChange('time', e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    error={errors.dilation_time}
                    helperText={
                      errors.dilation_time ? 'Dilation time is required' : ''
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Drops Used *"
                    value={formData.dilated.drops}
                    onChange={(e) =>
                      handleDilatedChange('drops', e.target.value)
                    }
                    error={errors.dilation_drops}
                    helperText={
                      errors.dilation_drops ? 'Drops used is required' : ''
                    }
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {renderEyeSection('Optic Disc', 'optic_disc', opticDiscOptions)}
        {renderEyeSection('Macula', 'macula', maculaOptions)}
        {renderEyeSection('Vessels', 'vessels', vesselsOptions)}
        {renderEyeSection('Periphery', 'periphery', peripheryOptions)}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditFundusExaminations.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  examination: PropTypes.object.isRequired,
};

export default EditFundusExaminations;
