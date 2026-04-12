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

const adnexaOptions = {
  lids: [
    'Normal',
    'Ptosis',
    'Ectropion',
    'Entropion',
    'Edema',
    'Erythema',
    'Other',
  ],
  lashes: ['Normal', 'Trichiasis', 'Madarosis', 'Poliosis', 'Other'],
  conjunctiva: [
    'Normal',
    'Injected',
    'Pale',
    'Chemosis',
    'Follicles',
    'Papillae',
    'Other',
  ],
  sclera: ['Normal', 'Blue', 'Yellow', 'Red', 'Other'],
  lacrimal_system: ['Normal', 'Swelling', 'Discharge', 'Tenderness', 'Other'],
};

const EditAdnexaExamination = ({
  open,
  isSubmitting,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [adnexaData, setAdnexaData] = useState({
    visit_id: '',
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

  // Transform the nested initialData to flat structure
  useEffect(() => {
    if (initialData) {
      setAdnexaData({
        visit_id: initialData.visit_id || '',
        lids_od: initialData.lids?.od?.value || '',
        lids_od_other: initialData.lids?.od?.other || '',
        lids_os: initialData.lids?.os?.value || '',
        lids_os_other: initialData.lids?.os?.other || '',
        lashes_od: initialData.lashes?.od?.value || '',
        lashes_od_other: initialData.lashes?.od?.other || '',
        lashes_os: initialData.lashes?.os?.value || '',
        lashes_os_other: initialData.lashes?.os?.other || '',
        conjunctiva_od: initialData.conjunctiva?.od?.value || '',
        conjunctiva_od_other: initialData.conjunctiva?.od?.other || '',
        conjunctiva_os: initialData.conjunctiva?.os?.value || '',
        conjunctiva_os_other: initialData.conjunctiva?.os?.other || '',
        sclera_od: initialData.sclera?.od?.value || '',
        sclera_od_other: initialData.sclera?.od?.other || '',
        sclera_os: initialData.sclera?.os?.value || '',
        sclera_os_other: initialData.sclera?.os?.other || '',
        lacrimal_system_od: initialData.lacrimal_system?.od?.value || '',
        lacrimal_system_od_other: initialData.lacrimal_system?.od?.other || '',
        lacrimal_system_os: initialData.lacrimal_system?.os?.value || '',
        lacrimal_system_os_other: initialData.lacrimal_system?.os?.other || '',
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setAdnexaData((prev) => ({
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

    // Transform back to nested structure before submitting
    const transformedData = {
      visit_id: adnexaData.visit_id,
      lids: {
        od: {
          value: adnexaData.lids_od,
          other: adnexaData.lids_od_other,
        },
        os: {
          value: adnexaData.lids_os,
          other: adnexaData.lids_os_other,
        },
      },
      lashes: {
        od: {
          value: adnexaData.lashes_od,
          other: adnexaData.lashes_od_other,
        },
        os: {
          value: adnexaData.lashes_os,
          other: adnexaData.lashes_os_other,
        },
      },
      conjunctiva: {
        od: {
          value: adnexaData.conjunctiva_od,
          other: adnexaData.conjunctiva_od_other,
        },
        os: {
          value: adnexaData.conjunctiva_os,
          other: adnexaData.conjunctiva_os_other,
        },
      },
      sclera: {
        od: {
          value: adnexaData.sclera_od,
          other: adnexaData.sclera_od_other,
        },
        os: {
          value: adnexaData.sclera_os,
          other: adnexaData.sclera_os_other,
        },
      },
      lacrimal_system: {
        od: {
          value: adnexaData.lacrimal_system_od,
          other: adnexaData.lacrimal_system_od_other,
        },
        os: {
          value: adnexaData.lacrimal_system_os,
          other: adnexaData.lacrimal_system_os_other,
        },
      },
    };

    onSubmit(transformedData);
    console.log('first', transformedData);
  };

  const renderAdnexaSection = (title, fieldName) => {
    const options = adnexaOptions[fieldName] || [];

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
                  value={adnexaData[`${fieldName}_${eye}`]}
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
              {adnexaData[`${fieldName}_${eye}`] === 'Other' && (
                <TextField
                  fullWidth
                  label={`Specify ${title} (${eye === 'od' ? 'OD' : 'OS'})`}
                  value={adnexaData[`${fieldName}_${eye}_other`]}
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
      title="Edit Adnexa Examination"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      maxWidth="md"
    >
      <Box sx={{ mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          Edit Adnexa Examination
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

EditAdnexaExamination.propTypes = {
  open: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object.isRequired,
};

export default EditAdnexaExamination;
