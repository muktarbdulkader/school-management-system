import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { toast } from 'react-toastify';

const AddSlitLampExamination = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  visit,
}) => {
  const [formData, setFormData] = useState({
    cornea_od: '',
    cornea_od_other: '',
    cornea_os: '',
    cornea_os_other: '',
    anterior_chamber_od: '',
    anterior_chamber_od_other: '',
    anterior_chamber_os: '',
    anterior_chamber_os_other: '',
    iris_od: '',
    iris_od_synechiae_type: '',
    iris_od_other: '',
    iris_os: '',
    iris_os_synechiae_type: '',
    iris_os_other: '',
    vitreous_od: '',
    vitreous_od_other: '',
    vitreous_os: '',
    vitreous_os_other: '',
    lens_od: '',
    lens_od_cataract_type: '',
    lens_od_iol_type: '',
    lens_od_other: '',
    lens_os: '',
    lens_os_cataract_type: '',
    lens_os_iol_type: '',
    lens_os_other: '',
    visit_id: visit?.id || '',
  });

  const [errors, setErrors] = useState({
    cornea_od: false,
    cornea_os: false,
    anterior_chamber_od: false,
    anterior_chamber_os: false,
    iris_od: false,
    iris_os: false,
    vitreous_od: false,
    vitreous_os: false,
    lens_od: false,
    lens_os: false,
  });

  const corneaOptions = [
    'Clear',
    'Scar',
    'Edema',
    'Infiltrates',
    'Ulcer',
    'Arcus Senilis',
    'Keratic',
    'Precipitates',
    'Foreign Body',
    'Other',
  ];
  const anteriorChamberOptions = [
    'Deep and Clear',
    'Shallow',
    'Cells & flare',
    'Hyphema',
    'Other',
  ];
  const irisOptions = ['Normal', 'Synechiae', 'Rubeosis', 'Other'];
  const synechiaeTypeOptions = ['Anterior', 'Posterior'];
  const vitreousOptions = ['Clear', 'Floaters', 'Hemorrhage', 'Other'];
  const lensOptions = ['Clear', 'Cataract', 'IOL', 'Other'];
  const cataractTypeOptions = ['Nuclear', 'Cortical', 'PSC', 'Mature'];
  const iolTypeOptions = ['AC', 'PC', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      cornea_od: !formData.cornea_od,
      cornea_os: !formData.cornea_os,
      anterior_chamber_od: !formData.anterior_chamber_od,
      anterior_chamber_os: !formData.anterior_chamber_os,
      iris_od: !formData.iris_od,
      iris_os: !formData.iris_os,
      vitreous_od: !formData.vitreous_od,
      vitreous_os: !formData.vitreous_os,
      lens_od: !formData.lens_od,
      lens_os: !formData.lens_os,
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    // Validate conditional fields
    const conditionalErrors = {};

    if (formData.cornea_od === 'Other' && !formData.cornea_od_other) {
      conditionalErrors.cornea_od_other = true;
    }
    if (formData.cornea_os === 'Other' && !formData.cornea_os_other) {
      conditionalErrors.cornea_os_other = true;
    }
    if (
      formData.anterior_chamber_od === 'Other' &&
      !formData.anterior_chamber_od_other
    ) {
      conditionalErrors.anterior_chamber_od_other = true;
    }
    if (
      formData.anterior_chamber_os === 'Other' &&
      !formData.anterior_chamber_os_other
    ) {
      conditionalErrors.anterior_chamber_os_other = true;
    }
    if (formData.iris_od === 'Synechiae' && !formData.iris_od_synechiae_type) {
      conditionalErrors.iris_od_synechiae_type = true;
    }
    if (formData.iris_od === 'Other' && !formData.iris_od_other) {
      conditionalErrors.iris_od_other = true;
    }
    if (formData.iris_os === 'Synechiae' && !formData.iris_os_synechiae_type) {
      conditionalErrors.iris_os_synechiae_type = true;
    }
    if (formData.iris_os === 'Other' && !formData.iris_os_other) {
      conditionalErrors.iris_os_other = true;
    }
    if (formData.vitreous_od === 'Other' && !formData.vitreous_od_other) {
      conditionalErrors.vitreous_od_other = true;
    }
    if (formData.vitreous_os === 'Other' && !formData.vitreous_os_other) {
      conditionalErrors.vitreous_os_other = true;
    }
    if (formData.lens_od === 'Cataract' && !formData.lens_od_cataract_type) {
      conditionalErrors.lens_od_cataract_type = true;
    }
    if (formData.lens_od === 'IOL' && !formData.lens_od_iol_type) {
      conditionalErrors.lens_od_iol_type = true;
    }
    if (formData.lens_od === 'Other' && !formData.lens_od_other) {
      conditionalErrors.lens_od_other = true;
    }
    if (formData.lens_os === 'Cataract' && !formData.lens_os_cataract_type) {
      conditionalErrors.lens_os_cataract_type = true;
    }
    if (formData.lens_os === 'IOL' && !formData.lens_os_iol_type) {
      conditionalErrors.lens_os_iol_type = true;
    }
    if (formData.lens_os === 'Other' && !formData.lens_os_other) {
      conditionalErrors.lens_os_other = true;
    }

    if (Object.keys(conditionalErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...conditionalErrors }));
      toast.error('Please fill all required conditional fields');
      return;
    }

    // Prepare the data for submission in the format your backend expects
    const submissionData = {
      cornea_od: formData.cornea_od,
      ...(formData.cornea_od === 'Other' && {
        cornea_od_other: formData.cornea_od_other,
      }),
      cornea_os: formData.cornea_os,
      ...(formData.cornea_os === 'Other' && {
        cornea_os_other: formData.cornea_os_other,
      }),
      anterior_chamber_od: formData.anterior_chamber_od,
      ...(formData.anterior_chamber_od === 'Other' && {
        anterior_chamber_od_other: formData.anterior_chamber_od_other,
      }),
      anterior_chamber_os: formData.anterior_chamber_os,
      ...(formData.anterior_chamber_os === 'Other' && {
        anterior_chamber_os_other: formData.anterior_chamber_os_other,
      }),
      iris_od: formData.iris_od,
      ...(formData.iris_od === 'Synechiae' && {
        iris_od_synechiae_type: formData.iris_od_synechiae_type,
      }),
      ...(formData.iris_od === 'Other' && {
        iris_od_other: formData.iris_od_other,
      }),
      iris_os: formData.iris_os,
      ...(formData.iris_os === 'Synechiae' && {
        iris_os_synechiae_type: formData.iris_os_synechiae_type,
      }),
      ...(formData.iris_os === 'Other' && {
        iris_os_other: formData.iris_os_other,
      }),
      vitreous_od: formData.vitreous_od,
      ...(formData.vitreous_od === 'Other' && {
        vitreous_od_other: formData.vitreous_od_other,
      }),
      vitreous_os: formData.vitreous_os,
      ...(formData.vitreous_os === 'Other' && {
        vitreous_os_other: formData.vitreous_os_other,
      }),
      lens_od: formData.lens_od,
      ...(formData.lens_od === 'Cataract' && {
        lens_od_cataract_type: formData.lens_od_cataract_type,
      }),
      ...(formData.lens_od === 'IOL' && {
        lens_od_iol_type: formData.lens_od_iol_type,
      }),
      ...(formData.lens_od === 'Other' && {
        lens_od_other: formData.lens_od_other,
      }),
      lens_os: formData.lens_os,
      ...(formData.lens_os === 'Cataract' && {
        lens_os_cataract_type: formData.lens_os_cataract_type,
      }),
      ...(formData.lens_os === 'IOL' && {
        lens_os_iol_type: formData.lens_os_iol_type,
      }),
      ...(formData.lens_os === 'Other' && {
        lens_os_other: formData.lens_os_other,
      }),
      visit_id: formData.visit_id,
    };

    onSubmit(submissionData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Slit Lamp Examination</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Cornea Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Cornea
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.cornea_od}>
                <InputLabel>OD (Right Eye)</InputLabel>
                <Select
                  name="cornea_od"
                  value={formData.cornea_od}
                  onChange={handleChange}
                  label="OD (Right Eye)"
                  required
                >
                  {corneaOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cornea_od && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.cornea_od === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="cornea_od_other"
                  label="Specify Other"
                  value={formData.cornea_od_other}
                  onChange={handleChange}
                  required
                  error={errors.cornea_od_other}
                  helperText={errors.cornea_od_other ? 'Please specify' : ''}
                />
              )}
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.cornea_os}>
                <InputLabel>OS (Left Eye)</InputLabel>
                <Select
                  name="cornea_os"
                  value={formData.cornea_os}
                  onChange={handleChange}
                  label="OS (Left Eye)"
                  required
                >
                  {corneaOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cornea_os && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.cornea_os === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="cornea_os_other"
                  label="Specify Other"
                  value={formData.cornea_os_other}
                  onChange={handleChange}
                  required
                  error={errors.cornea_os_other}
                  helperText={errors.cornea_os_other ? 'Please specify' : ''}
                />
              )}
            </Grid>

            {/* Anterior Chamber Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Anterior Chamber
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.anterior_chamber_od}>
                <InputLabel>OD (Right Eye)</InputLabel>
                <Select
                  name="anterior_chamber_od"
                  value={formData.anterior_chamber_od}
                  onChange={handleChange}
                  label="OD (Right Eye)"
                  required
                >
                  {anteriorChamberOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.anterior_chamber_od && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.anterior_chamber_od === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="anterior_chamber_od_other"
                  label="Specify Other"
                  value={formData.anterior_chamber_od_other}
                  onChange={handleChange}
                  required
                  error={errors.anterior_chamber_od_other}
                  helperText={
                    errors.anterior_chamber_od_other ? 'Please specify' : ''
                  }
                />
              )}
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.anterior_chamber_os}>
                <InputLabel>OS (Left Eye)</InputLabel>
                <Select
                  name="anterior_chamber_os"
                  value={formData.anterior_chamber_os}
                  onChange={handleChange}
                  label="OS (Left Eye)"
                  required
                >
                  {anteriorChamberOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.anterior_chamber_os && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.anterior_chamber_os === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="anterior_chamber_os_other"
                  label="Specify Other"
                  value={formData.anterior_chamber_os_other}
                  onChange={handleChange}
                  required
                  error={errors.anterior_chamber_os_other}
                  helperText={
                    errors.anterior_chamber_os_other ? 'Please specify' : ''
                  }
                />
              )}
            </Grid>

            {/* Iris Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Iris
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.iris_od}>
                <InputLabel>OD (Right Eye)</InputLabel>
                <Select
                  name="iris_od"
                  value={formData.iris_od}
                  onChange={handleChange}
                  label="OD (Right Eye)"
                  required
                >
                  {irisOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.iris_od && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.iris_od === 'Synechiae' && (
                <FormControl
                  fullWidth
                  margin="normal"
                  error={errors.iris_od_synechiae_type}
                >
                  <InputLabel>Synechiae Type</InputLabel>
                  <Select
                    name="iris_od_synechiae_type"
                    value={formData.iris_od_synechiae_type}
                    onChange={handleChange}
                    label="Synechiae Type"
                    required
                  >
                    {synechiaeTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.iris_od_synechiae_type && (
                    <FormHelperText>This field is required</FormHelperText>
                  )}
                </FormControl>
              )}
              {formData.iris_od === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="iris_od_other"
                  label="Specify Other"
                  value={formData.iris_od_other}
                  onChange={handleChange}
                  required
                  error={errors.iris_od_other}
                  helperText={errors.iris_od_other ? 'Please specify' : ''}
                />
              )}
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.iris_os}>
                <InputLabel>OS (Left Eye)</InputLabel>
                <Select
                  name="iris_os"
                  value={formData.iris_os}
                  onChange={handleChange}
                  label="OS (Left Eye)"
                  required
                >
                  {irisOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.iris_os && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.iris_os === 'Synechiae' && (
                <FormControl
                  fullWidth
                  margin="normal"
                  error={errors.iris_os_synechiae_type}
                >
                  <InputLabel>Synechiae Type</InputLabel>
                  <Select
                    name="iris_os_synechiae_type"
                    value={formData.iris_os_synechiae_type}
                    onChange={handleChange}
                    label="Synechiae Type"
                    required
                  >
                    {synechiaeTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.iris_os_synechiae_type && (
                    <FormHelperText>This field is required</FormHelperText>
                  )}
                </FormControl>
              )}
              {formData.iris_os === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="iris_os_other"
                  label="Specify Other"
                  value={formData.iris_os_other}
                  onChange={handleChange}
                  required
                  error={errors.iris_os_other}
                  helperText={errors.iris_os_other ? 'Please specify' : ''}
                />
              )}
            </Grid>

            {/* Lens Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Lens
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.lens_od}>
                <InputLabel>OD (Right Eye)</InputLabel>
                <Select
                  name="lens_od"
                  value={formData.lens_od}
                  onChange={handleChange}
                  label="OD (Right Eye)"
                  required
                >
                  {lensOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.lens_od && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.lens_od === 'Cataract' && (
                <FormControl
                  fullWidth
                  margin="normal"
                  error={errors.lens_od_cataract_type}
                >
                  <InputLabel>Cataract Type</InputLabel>
                  <Select
                    name="lens_od_cataract_type"
                    value={formData.lens_od_cataract_type}
                    onChange={handleChange}
                    label="Cataract Type"
                    required
                  >
                    {cataractTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.lens_od_cataract_type && (
                    <FormHelperText>This field is required</FormHelperText>
                  )}
                </FormControl>
              )}
              {formData.lens_od === 'IOL' && (
                <FormControl
                  fullWidth
                  margin="normal"
                  error={errors.lens_od_iol_type}
                >
                  <InputLabel>IOL Type</InputLabel>
                  <Select
                    name="lens_od_iol_type"
                    value={formData.lens_od_iol_type}
                    onChange={handleChange}
                    label="IOL Type"
                    required
                  >
                    {iolTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.lens_od_iol_type && (
                    <FormHelperText>This field is required</FormHelperText>
                  )}
                </FormControl>
              )}
              {formData.lens_od === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="lens_od_other"
                  label="Specify Other"
                  value={formData.lens_od_other}
                  onChange={handleChange}
                  required
                  error={errors.lens_od_other}
                  helperText={errors.lens_od_other ? 'Please specify' : ''}
                />
              )}
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.lens_os}>
                <InputLabel>OS (Left Eye)</InputLabel>
                <Select
                  name="lens_os"
                  value={formData.lens_os}
                  onChange={handleChange}
                  label="OS (Left Eye)"
                  required
                >
                  {lensOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.lens_os && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.lens_os === 'Cataract' && (
                <FormControl
                  fullWidth
                  margin="normal"
                  error={errors.lens_os_cataract_type}
                >
                  <InputLabel>Cataract Type</InputLabel>
                  <Select
                    name="lens_os_cataract_type"
                    value={formData.lens_os_cataract_type}
                    onChange={handleChange}
                    label="Cataract Type"
                    required
                  >
                    {cataractTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.lens_os_cataract_type && (
                    <FormHelperText>This field is required</FormHelperText>
                  )}
                </FormControl>
              )}
              {formData.lens_os === 'IOL' && (
                <FormControl
                  fullWidth
                  margin="normal"
                  error={errors.lens_os_iol_type}
                >
                  <InputLabel>IOL Type</InputLabel>
                  <Select
                    name="lens_os_iol_type"
                    value={formData.lens_os_iol_type}
                    onChange={handleChange}
                    label="IOL Type"
                    required
                  >
                    {iolTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.lens_os_iol_type && (
                    <FormHelperText>This field is required</FormHelperText>
                  )}
                </FormControl>
              )}
              {formData.lens_os === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="lens_os_other"
                  label="Specify Other"
                  value={formData.lens_os_other}
                  onChange={handleChange}
                  required
                  error={errors.lens_os_other}
                  helperText={errors.lens_os_other ? 'Please specify' : ''}
                />
              )}
            </Grid>

            {/* Vitreous Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Vitreous
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.vitreous_od}>
                <InputLabel>OD (Right Eye)</InputLabel>
                <Select
                  name="vitreous_od"
                  value={formData.vitreous_od}
                  onChange={handleChange}
                  label="OD (Right Eye)"
                  required
                >
                  {vitreousOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.vitreous_od && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.vitreous_od === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="vitreous_od_other"
                  label="Specify Other"
                  value={formData.vitreous_od_other}
                  onChange={handleChange}
                  required
                  error={errors.vitreous_od_other}
                  helperText={errors.vitreous_od_other ? 'Please specify' : ''}
                />
              )}
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth error={errors.vitreous_os}>
                <InputLabel>OS (Left Eye)</InputLabel>
                <Select
                  name="vitreous_os"
                  value={formData.vitreous_os}
                  onChange={handleChange}
                  label="OS (Left Eye)"
                  required
                >
                  {vitreousOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.vitreous_os && (
                  <FormHelperText>This field is required</FormHelperText>
                )}
              </FormControl>
              {formData.vitreous_os === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="vitreous_os_other"
                  label="Specify Other"
                  value={formData.vitreous_os_other}
                  onChange={handleChange}
                  required
                  error={errors.vitreous_os_other}
                  helperText={errors.vitreous_os_other ? 'Please specify' : ''}
                />
              )}
            </Grid>
          </Grid>
        </Box>
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
          {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSlitLampExamination;
