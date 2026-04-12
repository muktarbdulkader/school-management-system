import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  Grid,
  Box,
  Chip,
  Button,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const EditPatients = ({
  edit,
  isUpdating,
  patientData = {},
  rooms,
  onClose,
  onSubmit,
}) => {
  const [patientDetails, setPatientDetails] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: {
      wereda: '',
      city: '',
      country: '',
    },
    visit_type: '',
    date_of_birth: '',
    gender: 'Male',
    national_id: '',
    passport_number: '',
    patient_category: 'regular',
    payment_type: 'self_pay',
    medical_history: [],
    allergies: [],
    medical_conditions: [],
    patient_type: 'known',
    room_id: [],
    sub_visit_date: '',
  });

  const [currentMedicalHistory, setCurrentMedicalHistory] = useState('');
  const [currentAllergy, setCurrentAllergy] = useState('');
  const [currentMedicalCondition, setCurrentMedicalCondition] = useState('');

  useEffect(() => {
    if (patientData) {
      setPatientDetails({
        full_name: patientData.full_name || '',
        email: patientData.email || '',
        phone: patientData.phone || '',
        address: {
          wereda: patientData.address?.wereda || '',
          city: patientData.address?.city || '',
          country: patientData.address?.country || '',
        },
        visit_type: patientData.visit_type || '',
        date_of_birth: patientData.date_of_birth || '',
        gender: patientData.gender || 'Male',
        national_id: patientData.national_id || '',
        passport_number: patientData.passport_number || '',
        patient_category: patientData.patient_category || 'regular',
        payment_type: patientData.payment_type || 'self_pay',
        medical_history: patientData.medical_history || [],
        allergies: patientData.allergies || [],
        medical_conditions: patientData.medical_conditions || [],
        patient_type: patientData.patient_type || 'known',
        room_id: patientData.room_id || [],
        sub_visit_date: patientData?.sub_visit_date || '',
      });
    }
  }, [patientData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith('address[')) {
      const field = name.replace('address[', '').replace(']', '');
      setPatientDetails((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setPatientDetails({ ...patientDetails, [name]: value });
    }
  };

  const handleArrayFieldAdd = (field, currentValue, setCurrentValue) => {
    if (currentValue.trim()) {
      setPatientDetails((prev) => ({
        ...prev,
        [field]: [...prev[field], currentValue.trim()],
      }));
      setCurrentValue('');
    }
  };

  const handleArrayFieldRemove = (field, index) => {
    setPatientDetails((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!patientDetails.full_name || !patientDetails.date_of_birth) {
      toast.error('Please fill all required fields.');
      return;
    }
    onSubmit(patientDetails);
  };

  const handleRoomsChange = (event) => {
    const selectedRooms = event.target.value;
    setPatientDetails({ ...patientDetails, room_id: selectedRooms });
  };

  return (
    <DrogaFormModal
      open={edit}
      title="Edit Patient"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isUpdating}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Full Name"
            name="full_name"
            value={patientDetails.full_name}
            onChange={handleChange}
            margin="normal"
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={patientDetails.email}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={patientDetails.phone}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={patientDetails.date_of_birth}
            onChange={handleChange}
            margin="normal"
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={patientDetails.gender}
              onChange={handleChange}
              label="Gender"
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="National ID"
            name="national_id"
            value={patientDetails.national_id}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Passport Number"
            name="passport_number"
            value={patientDetails.passport_number}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Patient Category</InputLabel>
            <Select
              name="patient_category"
              value={patientDetails.patient_category}
              onChange={handleChange}
              label="Patient Category"
            >
              <MenuItem value="regular">Regular</MenuItem>
              <MenuItem value="vip">VIP</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Payment Type</InputLabel>
            <Select
              name="payment_type"
              value={patientDetails.payment_type}
              onChange={handleChange}
              label="Payment Type"
            >
              <MenuItem value="self_pay">Self Pay</MenuItem>
              <MenuItem value="insurance">Insurance</MenuItem>
              <MenuItem value="government">Government</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Patient Type</InputLabel>
            <Select
              name="patient_type"
              value={patientDetails.patient_type}
              onChange={handleChange}
              label="Patient Type"
            >
              <MenuItem value="known">Known</MenuItem>
              <MenuItem value="new">New</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Rooms</InputLabel>
            <Select
              label="Rooms"
              value={patientDetails.room_id}
              onChange={handleRoomsChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {rooms
                    .filter((room) => selected.includes(room.id))
                    .map((room) => (
                      <Chip key={room.id} label={room.name} />
                    ))}
                </Box>
              )}
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  <ListItemText primary={room.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Sub Visit Date"
            name="sub_visit_date"
            type="date"
            value={patientDetails.sub_visit_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Wereda"
            name="address[wereda]"
            value={patientDetails.address.wereda}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="City"
            name="address[city]"
            value={patientDetails.address.city}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Country"
            name="address[country]"
            value={patientDetails.address.country}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Visit Type</InputLabel>
            <Select
              name="visit_type"
              value={patientDetails.visit_type}
              onChange={handleChange}
              label="Visit Type"
            >
              <MenuItem value="Consultation">Consultation</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" alignItems="center">
            <TextField
              fullWidth
              label="Add Medical History"
              value={currentMedicalHistory}
              onChange={(e) => setCurrentMedicalHistory(e.target.value)}
              margin="normal"
            />
            <Button
              variant="contained"
              onClick={() =>
                handleArrayFieldAdd(
                  'medical_history',
                  currentMedicalHistory,
                  setCurrentMedicalHistory,
                )
              }
              sx={{ ml: 2 }}
            >
              Add
            </Button>
          </Box>
          {patientDetails.medical_history.length > 0 && (
            <Box mt={1} mb={2}>
              <strong>Medical History:</strong>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {patientDetails.medical_history.map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    onDelete={() =>
                      handleArrayFieldRemove('medical_history', index)
                    }
                  />
                ))}
              </Box>
            </Box>
          )}
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              fullWidth
              label="Add Allergy"
              value={currentAllergy}
              onChange={(e) => setCurrentAllergy(e.target.value)}
              margin="normal"
            />
            <Button
              variant="contained"
              onClick={() =>
                handleArrayFieldAdd(
                  'allergies',
                  currentAllergy,
                  setCurrentAllergy,
                )
              }
              sx={{ mt: 2, mb: 2 }}
            >
              Add
            </Button>
          </Box>
          {patientDetails.allergies.length > 0 && (
            <Box mt={1} mb={2}>
              <strong>Allergies:</strong>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {patientDetails.allergies.map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    onDelete={() => handleArrayFieldRemove('allergies', index)}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              fullWidth
              label="Add Medical Condition"
              value={currentMedicalCondition}
              onChange={(e) => setCurrentMedicalCondition(e.target.value)}
              margin="normal"
            />
            <Button
              variant="contained"
              onClick={() =>
                handleArrayFieldAdd(
                  'medical_conditions',
                  currentMedicalCondition,
                  setCurrentMedicalCondition,
                )
              }
              sx={{ mt: 2, mb: 2 }}
            >
              Add
            </Button>
          </Box>
          {patientDetails.medical_conditions.length > 0 && (
            <Box mt={1} mb={2}>
              <strong>Medical Conditions:</strong>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {patientDetails.medical_conditions.map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    onDelete={() =>
                      handleArrayFieldRemove('medical_conditions', index)
                    }
                  />
                ))}
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </DrogaFormModal>
  );
};

EditPatients.propTypes = {
  edit: PropTypes.bool.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  patientData: PropTypes.object,
  rooms: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditPatients;
