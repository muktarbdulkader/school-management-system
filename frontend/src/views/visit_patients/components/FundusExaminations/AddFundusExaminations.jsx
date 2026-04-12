import React, { useState } from 'react';
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
} from '@mui/material';
import PropTypes from 'prop-types';

const AddFundusExaminations = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  visit,
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    dilated: {
      value: 'No',
      time: '',
      drops: '',
    },
    optic_disc: {
      od: {
        value: 'Pink & Healthy',
        cupping: '',
        other: '',
      },
      os: {
        value: 'Pink & Healthy',
        cupping: '',
        other: '',
      },
    },
    macula: {
      od: {
        value: 'Flat & Intact',
        other: '',
      },
      os: {
        value: 'Flat & Intact',
        other: '',
      },
    },
    vessels: {
      od: {
        value: 'Normal',
        other: '',
      },
      os: {
        value: 'Normal',
        other: '',
      },
    },
    periphery: {
      od: {
        value: 'Attached',
        other: '',
      },
      os: {
        value: 'Attached',
        other: '',
      },
    },
    visit_id: visit?.id || '',
  });

  const [errors, setErrors] = useState({
    dilation_time: false,
    dilation_drops: false,
  });

  const handleChange = (field, value, subField = null, eye = null) => {
    if (subField && eye) {
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [eye]: {
            ...prev[field][eye],
            [subField]: value,
          },
        },
      }));
    } else if (subField) {
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
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
  };

  const handleSubmit = () => {
    const formattedData = {
      dilated: formData.dilated.value,
      dilation_time:
        formData.dilated.value === 'Yes' ? formData.dilated.time : null,
      dilation_drops_used:
        formData.dilated.value === 'Yes' ? formData.dilated.drops : null,
      optic_disc_od: formData.optic_disc.od.value,
      optic_disc_od_cupping: formData.optic_disc.od.cupping,
      optic_disc_od_other: formData.optic_disc.od.other,
      optic_disc_os: formData.optic_disc.os.value,
      optic_disc_os_cupping: formData.optic_disc.os.cupping,
      optic_disc_os_other: formData.optic_disc.os.other,
      macula_od: formData.macula.od.value,
      macula_od_other: formData.macula.od.other,
      macula_os: formData.macula.os.value,
      macula_os_other: formData.macula.os.other,
      vessels_od: formData.vessels.od.value,
      vessels_od_other: formData.vessels.od.other,
      vessels_os: formData.vessels.os.value,
      vessels_os_other: formData.vessels.os.other,
      periphery_od: formData.periphery.od.value,
      periphery_od_other: formData.periphery.od.other,
      periphery_os: formData.periphery.os.value,
      periphery_os_other: formData.periphery.os.other,
      visit_id: visit.id,
    };

    // Remove empty optional fields
    Object.keys(formattedData).forEach((key) => {
      if (
        formattedData[key] === '' &&
        key !== 'dilated_time' &&
        key !== 'dilated_drops'
      ) {
        delete formattedData[key];
      }
    });

    onSubmit(formattedData);
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
      <DialogTitle>Add Fundus Examination</DialogTitle>
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

        <Typography variant="h6" gutterBottom>
          Optic Disc
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              OD (Right Eye)
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.optic_disc.od.value}
                onChange={(e) =>
                  handleChange('optic_disc', e.target.value, 'value', 'od')
                }
                label="Status"
              >
                {opticDiscOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.optic_disc.od.value === 'Cupping' && (
              <TextField
                fullWidth
                label="Cupping Details"
                value={formData.optic_disc.od.cupping}
                onChange={(e) =>
                  handleChange('optic_disc', e.target.value, 'cupping', 'od')
                }
                sx={{ mb: 2 }}
              />
            )}
            {formData.optic_disc.od.value === 'Other' && (
              <TextField
                fullWidth
                label="Other Details"
                value={formData.optic_disc.od.other}
                onChange={(e) =>
                  handleChange('optic_disc', e.target.value, 'other', 'od')
                }
                sx={{ mb: 2 }}
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              OS (Left Eye)
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.optic_disc.os.value}
                onChange={(e) =>
                  handleChange('optic_disc', e.target.value, 'value', 'os')
                }
                label="Status"
              >
                {opticDiscOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.optic_disc.os.value === 'Cupping' && (
              <TextField
                fullWidth
                label="Cupping Details"
                value={formData.optic_disc.os.cupping}
                onChange={(e) =>
                  handleChange('optic_disc', e.target.value, 'cupping', 'os')
                }
                sx={{ mb: 2 }}
              />
            )}
            {formData.optic_disc.os.value === 'Other' && (
              <TextField
                fullWidth
                label="Other Details"
                value={formData.optic_disc.os.other}
                onChange={(e) =>
                  handleChange('optic_disc', e.target.value, 'other', 'os')
                }
                sx={{ mb: 2 }}
              />
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Macula
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              OD (Right Eye)
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.macula.od.value}
                onChange={(e) =>
                  handleChange('macula', e.target.value, 'value', 'od')
                }
                label="Status"
              >
                {maculaOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.macula.od.value === 'Other' && (
              <TextField
                fullWidth
                label="Other Details"
                value={formData.macula.od.other}
                onChange={(e) =>
                  handleChange('macula', e.target.value, 'other', 'od')
                }
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              OS (Left Eye)
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.macula.os.value}
                onChange={(e) =>
                  handleChange('macula', e.target.value, 'value', 'os')
                }
                label="Status"
              >
                {maculaOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.macula.os.value === 'Other' && (
              <TextField
                fullWidth
                label="Other Details"
                value={formData.macula.os.other}
                onChange={(e) =>
                  handleChange('macula', e.target.value, 'other', 'os')
                }
              />
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Vessels
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              OD (Right Eye)
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.vessels.od.value}
                onChange={(e) =>
                  handleChange('vessels', e.target.value, 'value', 'od')
                }
                label="Status"
              >
                {vesselsOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.vessels.od.value === 'Other' && (
              <TextField
                fullWidth
                label="Other Details"
                value={formData.vessels.od.other}
                onChange={(e) =>
                  handleChange('vessels', e.target.value, 'other', 'od')
                }
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              OS (Left Eye)
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.vessels.os.value}
                onChange={(e) =>
                  handleChange('vessels', e.target.value, 'value', 'os')
                }
                label="Status"
              >
                {vesselsOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.vessels.os.value === 'Other' && (
              <TextField
                fullWidth
                label="Other Details"
                value={formData.vessels.os.other}
                onChange={(e) =>
                  handleChange('vessels', e.target.value, 'other', 'os')
                }
              />
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Periphery
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              OD (Right Eye)
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.periphery.od.value}
                onChange={(e) =>
                  handleChange('periphery', e.target.value, 'value', 'od')
                }
                label="Status"
              >
                {peripheryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.periphery.od.value === 'Other' && (
              <TextField
                fullWidth
                label="Other Details"
                value={formData.periphery.od.other}
                onChange={(e) =>
                  handleChange('periphery', e.target.value, 'other', 'od')
                }
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              OS (Left Eye)
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.periphery.os.value}
                onChange={(e) =>
                  handleChange('periphery', e.target.value, 'value', 'os')
                }
                label="Status"
              >
                {peripheryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.periphery.os.value === 'Other' && (
              <TextField
                fullWidth
                label="Other Details"
                value={formData.periphery.os.other}
                onChange={(e) =>
                  handleChange('periphery', e.target.value, 'other', 'os')
                }
              />
            )}
          </Grid>
        </Grid>
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

AddFundusExaminations.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  visit: PropTypes.object.isRequired,
};

export default AddFundusExaminations;
