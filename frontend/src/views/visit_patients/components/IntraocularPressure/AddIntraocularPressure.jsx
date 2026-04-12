import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Button,
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

const AddIntraocularPressure = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'method_value') {
      setPressureData((prev) => ({
        ...prev,
        method: {
          ...prev.method,
          value,
          other: value === 'other' ? prev.method.other : null,
        },
      }));
    } else if (name === 'method_other') {
      setPressureData((prev) => ({
        ...prev,
        method: {
          ...prev.method,
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
      !pressureData.method.other.trim()
    ) {
      toast.error('Please specify the measurement method');
      return;
    }

    // Prepare data for submission
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
      title="Add Intraocular Pressure Measurement"
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
              value={pressureData.method.other}
              onChange={handleChange}
              margin="normal"
              required
            />
          </Grid>
        )}

        {/* <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={pressureData.notes}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
          />
        </Grid> */}
      </Grid>
    </DrogaFormModal>
  );
};

AddIntraocularPressure.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  visit: PropTypes.object.isRequired,
};

export default AddIntraocularPressure;
