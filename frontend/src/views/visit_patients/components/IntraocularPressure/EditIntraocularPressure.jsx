import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const EditIntraocularPressure = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  pressure,
  visit,
}) => {
  const [pressureData, setPressureData] = useState({
    visit_id: visit.id,
    left_eye: '',
    right_eye: '',
    time_of_measurement: '',
    method: {
      value: 'Applanation',
      other: null,
    },
  });

  // Initialize form with existing pressure data
  useEffect(() => {
    if (pressure) {
      let method = {
        value: 'Applanation',
        other: null,
      };

      // Parse the method field
      if (pressure.method) {
        try {
          const parsedMethod =
            typeof pressure.method === 'string'
              ? JSON.parse(pressure.method)
              : pressure.method;

          if (parsedMethod.value && typeof parsedMethod.value === 'object') {
            method.value = parsedMethod.value.value || 'Applanation';
            method.other = parsedMethod.value.other || null;
          } else {
            method.value = parsedMethod.value || 'Applanation';
            method.other = parsedMethod.other || null;
          }
        } catch (e) {
          console.error('Error parsing method:', e);
        }
      }

      setPressureData({
        visit_id: visit.id,
        left_eye: pressure.left_eye || '',
        right_eye: pressure.right_eye || '',
        time_of_measurement: pressure.time_of_measurement || '',
        method: method,
      });
    }
  }, [pressure, visit.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'method_value') {
      setPressureData((prev) => ({
        ...prev,
        method: {
          value,
          // Reset other to empty string when switching to "other",
          // or null when switching to another method
          other: value === 'other' ? prev.method.other || '' : null,
        },
      }));
    } else if (name === 'method_other') {
      setPressureData((prev) => ({
        ...prev,
        method: {
          ...prev.method,
          // Ensure value remains "other" when updating the other field
          value: 'other', // This is the key fix!
          other: value,
        },
      }));
    } else {
      setPressureData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Validate required fields
    if (
      !pressureData.left_eye ||
      !pressureData.right_eye ||
      !pressureData.time_of_measurement
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    // Validate numerical values
    if (isNaN(pressureData.left_eye) || isNaN(pressureData.right_eye)) {
      toast.error('Pressure values must be numbers');
      return;
    }

    // Validate "other" method specification
    if (
      pressureData.method.value === 'other' &&
      !pressureData.method.other?.trim()
    ) {
      toast.error('Please specify the measurement method');
      return;
    }

    // Prepare data for submission - matching the add format
    const submissionData = {
      ...pressureData,
      method: {
        value: pressureData.method.value,
        other:
          pressureData.method.value === 'other'
            ? pressureData.method.other
            : null,
      },
    };

    onSubmit(submissionData);
  };

  return (
    <DrogaFormModal
      open={open}
      title="Edit Intraocular Pressure Measurement"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Left Eye Pressure (mmHg)"
            name="left_eye"
            value={pressureData.left_eye}
            onChange={handleChange}
            margin="normal"
            required
            type="number"
            inputProps={{ step: '0.1' }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Right Eye Pressure (mmHg)"
            name="right_eye"
            value={pressureData.right_eye}
            onChange={handleChange}
            margin="normal"
            required
            type="number"
            inputProps={{ step: '0.1' }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Time of Measurement"
            name="time_of_measurement"
            value={pressureData.time_of_measurement}
            onChange={handleChange}
            margin="normal"
            required
            type="time"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Measurement Method</InputLabel>
            <Select
              name="method_value"
              value={pressureData.method.value}
              onChange={handleChange}
              label="Measurement Method"
            >
              <MenuItem value="Applanation">Applanation</MenuItem>
              <MenuItem value="Non-contact">Non-contact</MenuItem>
              <MenuItem value="Rebound">Rebound</MenuItem>
              <MenuItem value="Digital">Digital palpation</MenuItem>
              <MenuItem value="other">Other (specify)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {pressureData.method.value === 'other' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Specify Method"
              name="method_other"
              value={pressureData.method.other || ''}
              onChange={handleChange}
              margin="normal"
              required
            />
          </Grid>
        )}
      </Grid>
    </DrogaFormModal>
  );
};

EditIntraocularPressure.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  pressure: PropTypes.object,
  visit: PropTypes.object.isRequired,
};

export default EditIntraocularPressure;
