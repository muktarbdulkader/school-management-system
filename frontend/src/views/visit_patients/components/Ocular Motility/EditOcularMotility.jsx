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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const EditOcularMotility = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [ocularMotilityData, setOcularMotilityData] = useState({
    visit_id: '',
    eom: '',
    eom_gaze: '',
    eom_eye: '',
    hirschberg_test: '',
    hirschberg_test_eye: '',
    hirschberg_test_deviation: '',
    cover_uncover_test: '',
    cover_uncover_test_phoria: '',
    cover_uncover_test_tropia: '',
    cover_uncover_test_direction: '',
    cover_uncover_test_distance: '',
    cover_uncover_test_near: '',
    stereopsis: '',
    stereopsis_test: '',
    systemic_conditions: [],
    allergies: [],
    current_systemic_medication: '',
    eye_movement_restriction: '',
    strabismus_type: '',
    deviation_measurements: [],
  });

  const [currentSystemicCondition, setCurrentSystemicCondition] = useState('');
  const [currentAllergy, setCurrentAllergy] = useState('');
  const [currentDeviation, setCurrentDeviation] = useState({
    direction: '',
    measurement: '',
  });

  // Initialize form with initialData
  // In EditOcularMotility.js, update the useEffect that initializes the form data:
  useEffect(() => {
    if (initialData) {
      setOcularMotilityData({
        visit_id: initialData.visit_id || '',
        eom: initialData.eom?.value || '',
        eom_gaze: initialData.eom?.gaze || '',
        eom_eye: initialData.eom?.eye || '',
        hirschberg_test: initialData.hirschberg_test?.value || '',
        hirschberg_test_eye: initialData.hirschberg_test?.eye || '',
        hirschberg_test_deviation: initialData.hirschberg_test?.deviation || '',
        cover_uncover_test: initialData.cover_uncover_test?.value || '',
        cover_uncover_test_phoria: initialData.cover_uncover_test?.phoria || '',
        cover_uncover_test_tropia: initialData.cover_uncover_test?.tropia || '',
        cover_uncover_test_direction:
          initialData.cover_uncover_test?.direction || '',
        cover_uncover_test_distance:
          initialData.cover_uncover_test?.distance || '',
        cover_uncover_test_near: initialData.cover_uncover_test?.near || '',
        stereopsis: initialData.stereopsis?.value || '',
        stereopsis_test: initialData.stereopsis?.test || '',
        systemic_conditions: initialData.systemic_conditions || [],
        allergies: initialData.allergies || [],
        current_systemic_medication:
          initialData.current_systemic_medication || '',
        eye_movement_restriction: initialData.eye_movement_restriction || '',
        strabismus_type: initialData.strabismus_type || '',
        deviation_measurements: initialData.deviation_measurements || [],
      });
    }
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setOcularMotilityData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSystemicCondition = () => {
    if (!currentSystemicCondition.trim()) {
      toast.error('Please enter a systemic condition');
      return;
    }

    setOcularMotilityData((prev) => ({
      ...prev,
      systemic_conditions: [
        ...prev.systemic_conditions,
        currentSystemicCondition.trim(),
      ],
    }));
    setCurrentSystemicCondition('');
  };

  const handleRemoveSystemicCondition = (index) => {
    setOcularMotilityData((prev) => ({
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

    setOcularMotilityData((prev) => ({
      ...prev,
      allergies: [...prev.allergies, currentAllergy.trim()],
    }));
    setCurrentAllergy('');
  };

  const handleRemoveAllergy = (index) => {
    setOcularMotilityData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const handleAddDeviation = () => {
    if (!currentDeviation.direction || !currentDeviation.measurement) {
      toast.error('Please enter both direction and measurement');
      return;
    }

    setOcularMotilityData((prev) => ({
      ...prev,
      deviation_measurements: [
        ...prev.deviation_measurements,
        `${currentDeviation.direction}: ${currentDeviation.measurement} PD`,
      ],
    }));
    setCurrentDeviation({ direction: '', measurement: '' });
  };

  const handleRemoveDeviation = (index) => {
    setOcularMotilityData((prev) => ({
      ...prev,
      deviation_measurements: prev.deviation_measurements.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Validate required fields
    const requiredFields = [
      'eom',
      'eom_gaze',
      'eom_eye',
      'hirschberg_test',
      'hirschberg_test_eye',
      'hirschberg_test_deviation',
      'cover_uncover_test',
      'cover_uncover_test_phoria',
      'cover_uncover_test_tropia',
      'cover_uncover_test_direction',
      'cover_uncover_test_distance',
      'cover_uncover_test_near',
      'stereopsis',
      'stereopsis_test',
    ];

    const missingFields = requiredFields.filter(
      (field) => !ocularMotilityData[field],
    );

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in all required fields: ${missingFields.join(', ')}`,
      );
      return;
    }

    // Transform to nested structure before submitting
    const transformedData = {
      visit_id: ocularMotilityData.visit_id,
      eom: {
        value: ocularMotilityData.eom,
        gaze: ocularMotilityData.eom_gaze,
        eye: ocularMotilityData.eom_eye,
      },
      hirschberg_test: {
        value: ocularMotilityData.hirschberg_test,
        eye: ocularMotilityData.hirschberg_test_eye,
        deviation: ocularMotilityData.hirschberg_test_deviation,
      },
      cover_uncover_test: {
        value: ocularMotilityData.cover_uncover_test,
        phoria: ocularMotilityData.cover_uncover_test_phoria,
        tropia: ocularMotilityData.cover_uncover_test_tropia,
        direction: ocularMotilityData.cover_uncover_test_direction,
        distance: ocularMotilityData.cover_uncover_test_distance,
        near: ocularMotilityData.cover_uncover_test_near,
      },
      stereopsis: {
        value: ocularMotilityData.stereopsis,
        test: ocularMotilityData.stereopsis_test,
      },
      //   systemic_conditions: ocularMotilityData.systemic_conditions,
      //   allergies: ocularMotilityData.allergies,
      //   current_systemic_medication:
      //     ocularMotilityData.current_systemic_medication,
      //   eye_movement_restriction: ocularMotilityData.eye_movement_restriction,
      //   strabismus_type: ocularMotilityData.strabismus_type,
      //   deviation_measurements: ocularMotilityData.deviation_measurements,
    };

    onSubmit(transformedData);
  };

  return (
    <DrogaFormModal
      open={open}
      title="Edit Ocular Motility Examination"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      maxWidth="md"
    >
      <Grid container spacing={3}>
        {/* Extraocular Movements (EOM) Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Extraocular Movements (EOM)
          </Typography>
          <Divider />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>EOM Status</InputLabel>
            <Select
              name="eom"
              value={ocularMotilityData.eom}
              onChange={handleChange}
              label="EOM Status"
            >
              <MenuItem value="Full">Full</MenuItem>
              <MenuItem value="Restricted">Restricted</MenuItem>
              <MenuItem value="Painful">Painful</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>EOM Gaze</InputLabel>
            <Select
              name="eom_gaze"
              value={ocularMotilityData.eom_gaze}
              onChange={handleChange}
              label="EOM Gaze"
            >
              <MenuItem value="Primary">Primary</MenuItem>
              <MenuItem value="Right">Right</MenuItem>
              <MenuItem value="Left">Left</MenuItem>
              <MenuItem value="Up">Up</MenuItem>
              <MenuItem value="Down">Down</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>EOM Eye</InputLabel>
            <Select
              name="eom_eye"
              value={ocularMotilityData.eom_eye}
              onChange={handleChange}
              label="EOM Eye"
            >
              <MenuItem value="OD">Right Eye (OD)</MenuItem>
              <MenuItem value="OS">Left Eye (OS)</MenuItem>
              <MenuItem value="OU">Both Eyes (OU)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Hirschberg Test Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Hirschberg Test
          </Typography>
          <Divider />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Hirschberg Test</InputLabel>
            <Select
              name="hirschberg_test"
              value={ocularMotilityData.hirschberg_test}
              onChange={handleChange}
              label="Hirschberg Test"
            >
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Centered">Centered</MenuItem>
              <MenuItem value="Nasal">Nasal</MenuItem>
              <MenuItem value="Temporal">Nasal</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Eye</InputLabel>
            <Select
              name="hirschberg_test_eye"
              value={ocularMotilityData.hirschberg_test_eye}
              onChange={handleChange}
              label="Eye"
            >
              <MenuItem value="OD">Right Eye </MenuItem>
              <MenuItem value="OS">Left Eye </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Deviation</InputLabel>
            <Select
              name="hirschberg_test_deviation"
              value={ocularMotilityData.hirschberg_test_deviation}
              onChange={handleChange}
              label="Deviation"
            >
              <MenuItem value="None">None</MenuItem>
              <MenuItem value="Esotropia">Esotropia</MenuItem>
              <MenuItem value="Exotropia">Exotropia</MenuItem>
              <MenuItem value="Hypertropia">Hypertropia</MenuItem>
              <MenuItem value="Hypotropia">Hypotropia</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Cover-Uncover Test Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Cover-Uncover Test
          </Typography>
          <Divider />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Test Result</InputLabel>
            <Select
              name="cover_uncover_test"
              value={ocularMotilityData.cover_uncover_test}
              onChange={handleChange}
              label="Test Result"
            >
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Abnormal">Abnormal</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Phoria Type</InputLabel>
            <Select
              name="cover_uncover_test_phoria"
              value={ocularMotilityData.cover_uncover_test_phoria}
              onChange={handleChange}
              label="Phoria Type"
            >
              <MenuItem value="None">None</MenuItem>
              <MenuItem value="Esophoria">Esophoria</MenuItem>
              <MenuItem value="Exophoria">Exophoria</MenuItem>
              <MenuItem value="Hyperphoria">Hyperphoria</MenuItem>
              <MenuItem value="Hypophoria">Hypophoria</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Tropia Type</InputLabel>
            <Select
              name="cover_uncover_test_tropia"
              value={ocularMotilityData.cover_uncover_test_tropia}
              onChange={handleChange}
              label="Tropia Type"
            >
              <MenuItem value="None">None</MenuItem>
              <MenuItem value="Esotropia">Esotropia</MenuItem>
              <MenuItem value="Exotropia">Exotropia</MenuItem>
              <MenuItem value="Hypertropia">Hypertropia</MenuItem>
              <MenuItem value="Hypotropia">Hypotropia</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Direction</InputLabel>
            <Select
              name="cover_uncover_test_direction"
              value={ocularMotilityData.cover_uncover_test_direction}
              onChange={handleChange}
              label="Direction"
            >
              <MenuItem value="None">None</MenuItem>
              <MenuItem value="Right">Right</MenuItem>
              <MenuItem value="Left">Left</MenuItem>
              <MenuItem value="Up">Up</MenuItem>
              <MenuItem value="Down">Down</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Distance</InputLabel>
            <Select
              name="cover_uncover_test_distance"
              value={ocularMotilityData.cover_uncover_test_distance}
              onChange={handleChange}
              label="Distance"
            >
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Increased">Increased</MenuItem>
              <MenuItem value="Decreased">Decreased</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Near</InputLabel>
            <Select
              name="cover_uncover_test_near"
              value={ocularMotilityData.cover_uncover_test_near}
              onChange={handleChange}
              label="Near"
            >
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Increased">Increased</MenuItem>
              <MenuItem value="Decreased">Decreased</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Stereopsis Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Stereopsis
          </Typography>
          <Divider />
        </Grid>

        <Grid item xs={12} md>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Stereopsis</InputLabel>
            <Select
              name="stereopsis"
              value={ocularMotilityData.stereopsis}
              onChange={handleChange}
              label="Stereopsis"
            >
              <MenuItem value="Reduced">Present</MenuItem>
              <MenuItem value="Absent">Absent</MenuItem>
              <MenuItem value="Reduced">Reduced</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Stereopsis Test</InputLabel>
            <Select
              name="stereopsis_test"
              value={ocularMotilityData.stereopsis_test}
              onChange={handleChange}
              label="Stereopsis Test"
            >
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Reduced">Reduced</MenuItem>
              <MenuItem value="Absent">Absent</MenuItem>
              <MenuItem value="Uncooperative">Uncooperative</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Ocular Motility Specific Fields */}
        {/* <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Ocular Motility Details
          </Typography>
          <Divider />
        </Grid> */}

        {/* <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Eye Movement Restriction</InputLabel>
            <Select
              name="eye_movement_restriction"
              value={ocularMotilityData.eye_movement_restriction}
              onChange={handleChange}
              label="Eye Movement Restriction"
            >
              <MenuItem value="None">None</MenuItem>
              <MenuItem value="Mild">Mild</MenuItem>
              <MenuItem value="Moderate">Moderate</MenuItem>
              <MenuItem value="Severe">Severe</MenuItem>
            </Select>
          </FormControl>
        </Grid> */}

        {/* <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Strabismus Type</InputLabel>
            <Select
              name="strabismus_type"
              value={ocularMotilityData.strabismus_type}
              onChange={handleChange}
              label="Strabismus Type"
            >
              <MenuItem value="Esotropia">Esotropia</MenuItem>
              <MenuItem value="Exotropia">Exotropia</MenuItem>
              <MenuItem value="Hypertropia">Hypertropia</MenuItem>
              <MenuItem value="Hypotropia">Hypotropia</MenuItem>
              <MenuItem value="None">None</MenuItem>
            </Select>
          </FormControl>
        </Grid> */}

        {/* Deviation Measurements Section */}
        {/* <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Deviation Measurements (Prism Diopters)
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Direction</InputLabel>
              <Select
                value={currentDeviation.direction}
                onChange={(e) =>
                  setCurrentDeviation({
                    ...currentDeviation,
                    direction: e.target.value,
                  })
                }
                label="Direction"
              >
                <MenuItem value="Right Gaze">Right Gaze</MenuItem>
                <MenuItem value="Left Gaze">Left Gaze</MenuItem>
                <MenuItem value="Up Gaze">Up Gaze</MenuItem>
                <MenuItem value="Down Gaze">Down Gaze</MenuItem>
                <MenuItem value="Primary Position">Primary Position</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Measurement (PD)"
              value={currentDeviation.measurement}
              onChange={(e) =>
                setCurrentDeviation({
                  ...currentDeviation,
                  measurement: e.target.value,
                })
              }
              type="number"
            />
            <Button
              variant="contained"
              onClick={handleAddDeviation}
              sx={{ height: '56px' }}
            >
              Add
            </Button>
          </Box>

          {ocularMotilityData.deviation_measurements.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <List dense>
                {ocularMotilityData.deviation_measurements.map(
                  (item, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveDeviation(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={item} />
                    </ListItem>
                  ),
                )}
              </List>
            </Box>
          )}
        </Grid> */}

        {/* Systemic Conditions Section */}
        {/* <Grid item xs={12}>
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

          {ocularMotilityData.systemic_conditions.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <List dense>
                {ocularMotilityData.systemic_conditions.map((item, index) => (
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
        </Grid> */}

        {/* Allergies Section */}
        {/* <Grid item xs={12}>
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

          {ocularMotilityData.allergies.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <List dense>
                {ocularMotilityData.allergies.map((item, index) => (
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
        </Grid> */}

        {/* Current Systemic Medication */}
        {/* <Grid item xs={12}>
          <TextField
            fullWidth
            label="Current Systemic Medication"
            name="current_systemic_medication"
            value={ocularMotilityData.current_systemic_medication}
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

EditOcularMotility.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object.isRequired,
};

export default EditOcularMotility;
