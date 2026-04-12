import { useState } from 'react';
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

const AddPatients = ({ add, isAdding, onClose, onSubmit, rooms }) => {
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

  const handleSubmit = (event) => {
    event.preventDefault();
    if (
      !patientDetails.full_name ||
      // !patientDetails.email ||
      !patientDetails.date_of_birth
    ) {
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
      open={add}
      title="Add Patient"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isAdding}
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
              {/* <MenuItem value="government">Government</MenuItem> */}
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
              {/* <MenuItem value="Follow-up">Follow-up</MenuItem>
              <MenuItem value="Emergency">Emergency</MenuItem>
              <MenuItem value="Routine Checkup">Routine Checkup</MenuItem> */}
              {/* Add other valid visit types as needed */}
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
            <div>
              <strong>Medical History:</strong>
              <ul>
                {patientDetails.medical_history.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
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
            <div>
              <strong>Allergies:</strong>
              <ul>
                {patientDetails.allergies.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
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
            <div>
              <strong>Medical Conditions:</strong>
              <ul>
                {patientDetails.medical_conditions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </Grid>
      </Grid>
    </DrogaFormModal>
  );
};

AddPatients.propTypes = {
  add: PropTypes.bool.isRequired,
  isAdding: PropTypes.bool.isRequired,
  rooms: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default AddPatients;
