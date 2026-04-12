import { useState } from 'react';
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

const adnexaOptions = {
  lids: [
    'Normal',
    'Ptosis',
    'Ectropion',
    'Entropion',
    'Edema',
    'Erythema',
    'Lesions',
    'Other',
  ],
  lashes: ['Normal', 'Trichiasis', 'Madarosis', 'Blepharitis', 'Other'],
  conjunctiva: [
    'Injected',
    'Follicles',
    'Papillae',
    'Subconjunctival Hemorrhage',
    'Pterygium',
    'Pinguecula',
    'Discharge',
    'Other',
  ],
  sclera: ['White', 'Blue', 'Icteric', 'Other'],
  lacrimal_system: ['Normal', 'Dry', 'Dacryocystitis', 'Epiphora', 'Other'],
};

const AddAdnexaExamination = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  visit,
}) => {
  const [adnexaData, setAdnexaData] = useState({
    visit_id: visit.id,
    lids_od: '',
    lids_od_other: '',
    lids_os: '',
    lids_os_other: '',
    lashes_od: '',
    lashes_od_other: '',
    lashes_os: '',
    lashes_os_other: '',
    conjunctiva_od: '',
    conjunctiva_od_other: '',
    conjunctiva_os: '',
    conjunctiva_os_other: '',
    sclera_od: '',
    sclera_od_other: '',
    sclera_os: '',
    sclera_os_other: '',
    lacrimal_system_od: '',
    lacrimal_system_od_other: '',
    lacrimal_system_os: '',
    lacrimal_system_os_other: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setAdnexaData((prev) => ({
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
      'lids_od',
      'lids_os',
      'lashes_od',
      'lashes_os',
      'conjunctiva_od',
      'conjunctiva_os',
      'sclera_od',
      'sclera_os',
      'lacrimal_system_od',
      'lacrimal_system_os',
    ];

    requiredFields.forEach((field) => {
      if (!adnexaData[field]) {
        newErrors[field] = `The ${field.replace(/_/g, ' ')} field is required.`;
      }
    });

    // Validate "other" fields when "Other" is selected
    Object.keys(adnexaData).forEach((field) => {
      if (field.endsWith('_other') && !adnexaData[field]) {
        const mainField = field.replace('_other', '');
        if (adnexaData[mainField] === 'Other') {
          newErrors[field] = 'Please specify details for "Other" option';
        }
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

    onSubmit(adnexaData);
  };

  const renderAdnexaSection = (title, fieldName) => {
    // Map the fieldName to the correct options key
    const optionsKey =
      fieldName === 'lacrimal_system' ? 'lacrimal_system' : fieldName;
    const options = adnexaOptions[optionsKey] || [];

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" gutterBottom>
              Right Eye (OD)
            </Typography>
            <FormControl
              fullWidth
              margin="normal"
              error={!!errors[`${fieldName}_od`]}
            >
              <InputLabel>{title}</InputLabel>
              <Select
                value={adnexaData[`${fieldName}_od`]}
                label={title}
                onChange={(e) =>
                  handleChange(`${fieldName}_od`, e.target.value)
                }
              >
                {options.map((option) => (
                  <MenuItem key={`${fieldName}_od_${option}`} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              {errors[`${fieldName}_od`] && (
                <FormHelperText>{errors[`${fieldName}_od`]}</FormHelperText>
              )}
            </FormControl>
            {adnexaData[`${fieldName}_od`] === 'Other' && (
              <TextField
                fullWidth
                label={`Specify ${title} (OD)`}
                value={adnexaData[`${fieldName}_od_other`]}
                onChange={(e) =>
                  handleChange(`${fieldName}_od_other`, e.target.value)
                }
                margin="normal"
                error={!!errors[`${fieldName}_od_other`]}
                helperText={errors[`${fieldName}_od_other`]}
              />
            )}
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" gutterBottom>
              Left Eye (OS)
            </Typography>
            <FormControl
              fullWidth
              margin="normal"
              error={!!errors[`${fieldName}_os`]}
            >
              <InputLabel>{title}</InputLabel>
              <Select
                value={adnexaData[`${fieldName}_os`]}
                label={title}
                onChange={(e) =>
                  handleChange(`${fieldName}_os`, e.target.value)
                }
              >
                {options.map((option) => (
                  <MenuItem key={`${fieldName}_os_${option}`} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              {errors[`${fieldName}_os`] && (
                <FormHelperText>{errors[`${fieldName}_os`]}</FormHelperText>
              )}
            </FormControl>
            {adnexaData[`${fieldName}_os`] === 'Other' && (
              <TextField
                fullWidth
                label={`Specify ${title} (OS)`}
                value={adnexaData[`${fieldName}_os_other`]}
                onChange={(e) =>
                  handleChange(`${fieldName}_os_other`, e.target.value)
                }
                margin="normal"
                error={!!errors[`${fieldName}_os_other`]}
                helperText={errors[`${fieldName}_os_other`]}
              />
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <DrogaFormModal
      open={open}
      title="Adnexa Examination"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      maxWidth="md"
    >
      <Box sx={{ mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          Adnexa Examination
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {renderAdnexaSection('Lids', 'lids')}
        {renderAdnexaSection('Lashes', 'lashes')}
        {renderAdnexaSection('Conjunctiva', 'conjunctiva')}
        {renderAdnexaSection('Sclera', 'sclera')}
        {renderAdnexaSection('Lacrimal System', 'lacrimal_system')}
      </Box>
    </DrogaFormModal>
  );
};

AddAdnexaExamination.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  visit: PropTypes.object.isRequired,
};

export default AddAdnexaExamination;
