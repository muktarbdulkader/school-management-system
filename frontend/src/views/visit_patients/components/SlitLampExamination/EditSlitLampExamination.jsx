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

const slitLampOptions = {
  cornea: ['Clear', 'Scar', 'Edema', 'Opacity', 'Vascularization', 'Other'],
  anterior_chamber: [
    'Deep and Clear',
    'Shallow',
    'Cells & Flare',
    'Hyphema',
    'Other',
  ],
  iris: ['Normal', 'Synechiae', 'Atrophy', 'Neovascularization', 'Other'],
  lens: ['Clear', 'Cataract', 'IOL', 'Subluxation', 'Other'],
  vitreous: ['Clear', 'Floaters', 'Hemorrhage', 'Inflammation', 'Other'],
};

const cataractTypes = [
  'NS',
  'Cortical',
  'PSC',
  'Nuclear',
  'Mature',
  'Hypermature',
];
const iolTypes = ['AC', 'PC', 'Other'];
const synechiaeTypes = ['Anterior', 'Posterior', 'Both'];

const EditSlitLampExamination = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [slitLampData, setSlitLampData] = useState({
    visit_id: '',
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
    lens_od: '',
    lens_od_cataract_type: '',
    lens_od_iol_type: '',
    lens_od_other: '',
    lens_os: '',
    lens_os_cataract_type: '',
    lens_os_iol_type: '',
    lens_os_other: '',
    vitreous_od: '',
    vitreous_od_other: '',
    vitreous_os: '',
    vitreous_os_other: '',
  });

  const [errors, setErrors] = useState({});

  // Transform the nested initialData to flat structure
  useEffect(() => {
    if (initialData) {
      setSlitLampData({
        visit_id: initialData.visit_id || '',
        cornea_od: initialData.cornea?.od?.value || '',
        cornea_od_other: initialData.cornea?.od?.other || '',
        cornea_os: initialData.cornea?.os?.value || '',
        cornea_os_other: initialData.cornea?.os?.other || '',
        anterior_chamber_od: initialData.anterior_chamber?.od?.value || '',
        anterior_chamber_od_other:
          initialData.anterior_chamber?.od?.other || '',
        anterior_chamber_os: initialData.anterior_chamber?.os?.value || '',
        anterior_chamber_os_other:
          initialData.anterior_chamber?.os?.other || '',
        iris_od: initialData.iris?.od?.value || '',
        iris_od_synechiae_type: initialData.iris?.od?.synechiae_type || '',
        iris_od_other: initialData.iris?.od?.other || '',
        iris_os: initialData.iris?.os?.value || '',
        iris_os_synechiae_type: initialData.iris?.os?.synechiae_type || '',
        iris_os_other: initialData.iris?.os?.other || '',
        lens_od: initialData.lens?.od?.value || '',
        lens_od_cataract_type: initialData.lens?.od?.cataract_type || '',
        lens_od_iol_type: initialData.lens?.od?.iol_type || '',
        lens_od_other: initialData.lens?.od?.other || '',
        lens_os: initialData.lens?.os?.value || '',
        lens_os_cataract_type: initialData.lens?.os?.cataract_type || '',
        lens_os_iol_type: initialData.lens?.os?.iol_type || '',
        lens_os_other: initialData.lens?.os?.other || '',
        vitreous_od: initialData.vitreous?.od?.value || '',
        vitreous_od_other: initialData.vitreous?.od?.other || '',
        vitreous_os: initialData.vitreous?.os?.value || '',
        vitreous_os_other: initialData.vitreous?.os?.other || '',
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setSlitLampData((prev) => ({
      ...prev,
      [field]: value,
    }));

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
      'cornea_od',
      'cornea_os',
      'anterior_chamber_od',
      'anterior_chamber_os',
      'iris_od',
      'iris_os',
      'lens_od',
      'lens_os',
      'vitreous_od',
      'vitreous_os',
    ];

    requiredFields.forEach((field) => {
      if (!slitLampData[field]) {
        newErrors[field] = `The ${field.replace(/_/g, ' ')} field is required.`;
      }
    });

    Object.keys(slitLampData).forEach((field) => {
      if (field.endsWith('_other') && !slitLampData[field]) {
        const mainField = field.replace('_other', '');
        if (slitLampData[mainField] === 'Other') {
          newErrors[field] = 'Please specify details for "Other" option';
        }
      }
    });

    // Validate specific type fields
    if (
      slitLampData.iris_od === 'Synechiae' &&
      !slitLampData.iris_od_synechiae_type
    ) {
      newErrors.iris_od_synechiae_type = 'Synechiae type is required';
    }
    if (
      slitLampData.iris_os === 'Synechiae' &&
      !slitLampData.iris_os_synechiae_type
    ) {
      newErrors.iris_os_synechiae_type = 'Synechiae type is required';
    }
    if (
      slitLampData.lens_od === 'Cataract' &&
      !slitLampData.lens_od_cataract_type
    ) {
      newErrors.lens_od_cataract_type = 'Cataract type is required';
    }
    if (slitLampData.lens_od === 'IOL' && !slitLampData.lens_od_iol_type) {
      newErrors.lens_od_iol_type = 'IOL type is required';
    }
    if (
      slitLampData.lens_os === 'Cataract' &&
      !slitLampData.lens_os_cataract_type
    ) {
      newErrors.lens_os_cataract_type = 'Cataract type is required';
    }
    if (slitLampData.lens_os === 'IOL' && !slitLampData.lens_os_iol_type) {
      newErrors.lens_os_iol_type = 'IOL type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateFields()) {
      toast.error('Please fill all required fields');
      return;
    }

    // Transform back to nested structure before submitting
    const transformedData = {
      visit_id: slitLampData.visit_id,
      cornea: {
        od: {
          value: slitLampData.cornea_od,
          other: slitLampData.cornea_od_other,
        },
        os: {
          value: slitLampData.cornea_os,
          other: slitLampData.cornea_os_other,
        },
      },
      anterior_chamber: {
        od: {
          value: slitLampData.anterior_chamber_od,
          other: slitLampData.anterior_chamber_od_other,
        },
        os: {
          value: slitLampData.anterior_chamber_os,
          other: slitLampData.anterior_chamber_os_other,
        },
      },
      iris: {
        od: {
          value: slitLampData.iris_od,
          synechiae_type: slitLampData.iris_od_synechiae_type,
          other: slitLampData.iris_od_other,
        },
        os: {
          value: slitLampData.iris_os,
          synechiae_type: slitLampData.iris_os_synechiae_type,
          other: slitLampData.iris_os_other,
        },
      },
      lens: {
        od: {
          value: slitLampData.lens_od,
          cataract_type: slitLampData.lens_od_cataract_type,
          iol_type: slitLampData.lens_od_iol_type,
          other: slitLampData.lens_od_other,
        },
        os: {
          value: slitLampData.lens_os,
          cataract_type: slitLampData.lens_os_cataract_type,
          iol_type: slitLampData.lens_os_iol_type,
          other: slitLampData.lens_os_other,
        },
      },
      vitreous: {
        od: {
          value: slitLampData.vitreous_od,
          other: slitLampData.vitreous_od_other,
        },
        os: {
          value: slitLampData.vitreous_os,
          other: slitLampData.vitreous_os_other,
        },
      },
    };

    onSubmit(transformedData);
  };

  const renderSlitLampSection = (title, fieldName) => {
    const options = slitLampOptions[fieldName] || [];

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <Grid container spacing={2}>
          {['od', 'os'].map((eye) => (
            <Grid item xs={6} key={`${fieldName}_${eye}`}>
              <Typography variant="subtitle2" gutterBottom>
                {eye === 'od' ? 'Right Eye (OD)' : 'Left Eye (OS)'}
              </Typography>
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors[`${fieldName}_${eye}`]}
              >
                <InputLabel>{title}</InputLabel>
                <Select
                  value={slitLampData[`${fieldName}_${eye}`]}
                  label={title}
                  onChange={(e) =>
                    handleChange(`${fieldName}_${eye}`, e.target.value)
                  }
                >
                  {options.map((option) => (
                    <MenuItem
                      key={`${fieldName}_${eye}_${option}`}
                      value={option}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors[`${fieldName}_${eye}`] && (
                  <FormHelperText>
                    {errors[`${fieldName}_${eye}`]}
                  </FormHelperText>
                )}
              </FormControl>

              {/* Special fields for iris */}
              {fieldName === 'iris' &&
                slitLampData[`${fieldName}_${eye}`] === 'Synechiae' && (
                  <FormControl
                    fullWidth
                    margin="normal"
                    error={!!errors[`${fieldName}_${eye}_synechiae_type`]}
                  >
                    <InputLabel>Synechiae Type</InputLabel>
                    <Select
                      value={slitLampData[`${fieldName}_${eye}_synechiae_type`]}
                      label="Synechiae Type"
                      onChange={(e) =>
                        handleChange(
                          `${fieldName}_${eye}_synechiae_type`,
                          e.target.value,
                        )
                      }
                    >
                      {synechiaeTypes.map((type) => (
                        <MenuItem
                          key={`${fieldName}_${eye}_synechiae_${type}`}
                          value={type}
                        >
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors[`${fieldName}_${eye}_synechiae_type`] && (
                      <FormHelperText>
                        {errors[`${fieldName}_${eye}_synechiae_type`]}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}

              {/* Special fields for lens */}
              {fieldName === 'lens' &&
                slitLampData[`${fieldName}_${eye}`] === 'Cataract' && (
                  <FormControl
                    fullWidth
                    margin="normal"
                    error={!!errors[`${fieldName}_${eye}_cataract_type`]}
                  >
                    <InputLabel>Cataract Type</InputLabel>
                    <Select
                      value={slitLampData[`${fieldName}_${eye}_cataract_type`]}
                      label="Cataract Type"
                      onChange={(e) =>
                        handleChange(
                          `${fieldName}_${eye}_cataract_type`,
                          e.target.value,
                        )
                      }
                    >
                      {cataractTypes.map((type) => (
                        <MenuItem
                          key={`${fieldName}_${eye}_cataract_${type}`}
                          value={type}
                        >
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors[`${fieldName}_${eye}_cataract_type`] && (
                      <FormHelperText>
                        {errors[`${fieldName}_${eye}_cataract_type`]}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}

              {fieldName === 'lens' &&
                slitLampData[`${fieldName}_${eye}`] === 'IOL' && (
                  <FormControl
                    fullWidth
                    margin="normal"
                    error={!!errors[`${fieldName}_${eye}_iol_type`]}
                  >
                    <InputLabel>IOL Type</InputLabel>
                    <Select
                      value={slitLampData[`${fieldName}_${eye}_iol_type`]}
                      label="IOL Type"
                      onChange={(e) =>
                        handleChange(
                          `${fieldName}_${eye}_iol_type`,
                          e.target.value,
                        )
                      }
                    >
                      {iolTypes.map((type) => (
                        <MenuItem
                          key={`${fieldName}_${eye}_iol_${type}`}
                          value={type}
                        >
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors[`${fieldName}_${eye}_iol_type`] && (
                      <FormHelperText>
                        {errors[`${fieldName}_${eye}_iol_type`]}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}

              {slitLampData[`${fieldName}_${eye}`] === 'Other' && (
                <TextField
                  fullWidth
                  label={`Specify ${title} (${eye === 'od' ? 'OD' : 'OS'})`}
                  value={slitLampData[`${fieldName}_${eye}_other`]}
                  onChange={(e) =>
                    handleChange(`${fieldName}_${eye}_other`, e.target.value)
                  }
                  margin="normal"
                  error={!!errors[`${fieldName}_${eye}_other`]}
                  helperText={errors[`${fieldName}_${eye}_other`]}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <DrogaFormModal
      open={open}
      title="Edit Slit Lamp Examination"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      maxWidth="md"
    >
      <Box sx={{ mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          Edit Slit Lamp Examination
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {renderSlitLampSection('Cornea', 'cornea')}
        {renderSlitLampSection('Anterior Chamber', 'anterior_chamber')}
        {renderSlitLampSection('Iris', 'iris')}
        {renderSlitLampSection('Lens', 'lens')}
        {renderSlitLampSection('Vitreous', 'vitreous')}
      </Box>
    </DrogaFormModal>
  );
};

EditSlitLampExamination.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object.isRequired,
};

export default EditSlitLampExamination;
