import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
  useTheme,
} from '@mui/material';
import { useFormik } from 'formik';
import PropTypes from 'prop-types';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  id: Yup.string().required('Please select KPI first'),

  strength: Yup.string()
    .required('Strength is required')
    .min(3, 'Strength expected to be more than 3 letters'),
  area_of_improvement: Yup.string()
    .required('Area of Improvement is required')
    .min(3, 'Area of Improvement expected to be more than 3 letters'),
  weakness: Yup.string()
    .required('Area of weakness is required')
    .min(3, 'Area of weakness expected to be more than 3 letters'),

  recommendation: Yup.string()
    .required('Recommendation is required')
    .min(3, 'Recommendation expected to be more than 3 letters'),
});

const EditFeedBack = ({
  openEdit,
  handleCloseModal,
  frequency,
  handleEditSubtask,
  submitting,
}) => {
  const theme = useTheme();
  const formik = useFormik({
    initialValues: {
      id: '',
      strength: '',
      area_of_improvement: '',
      weakness: '',
      recommendation: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values, { resetForm }) => {
      console.log('submit', values);
      handleEditSubtask(values);
      resetForm();
    },
  });

  return (
    <DrogaFormModal
      openEdit={open}
      title="Edit Feedback"
      handleClose={handleCloseModal}
      onCancel={handleCloseModal}
      onSubmit={formik.handleSubmit}
      submitting={submitting}
    >
      <FormControl
        sx={{ border: 'none', boxShadow: 'none', p: 0 }}
        error={formik.touched.id && Boolean(formik.errors.id)}
        fullWidth
      >
        <InputLabel htmlFor="feedback" shrink={!formik.id || formik.touched.id}>
          Select Frequency
        </InputLabel>
        <Select
          id="feedback"
          displayEmpty
          name="id"
          label="Select KPI"
          value={formik.values.id}
          onChange={formik.handleChange}
        >
          {frequency.length > 0 ? (
            frequency.map((freq, index) => (
              <MenuItem key={index} value={freq.id}>
                <Typography variant="body1" color={theme.palette.text.primary}>
                  {freq?.name}
                </Typography>
              </MenuItem>
            ))
          ) : (
            <Box sx={{ p: 1 }}>
              <Typography variant="body1">There is no frequency</Typography>
            </Box>
          )}
        </Select>

        {formik.touched.id && formik.errors.id && (
          <FormHelperText error id="standard-weight-helper-text-id">
            {formik.errors.id}
          </FormHelperText>
        )}
      </FormControl>
      <FormControl
        fullWidth
        error={formik.touched.strength && Boolean(formik.errors.strength)}
        sx={{ marginTop: 3 }}
      >
        <InputLabel htmlFor="strength">Strength </InputLabel>
        <OutlinedInput
          id="strength"
          name="strength"
          label="strength"
          multiline
          minRows={3}
          value={formik.values.strength}
          onChange={formik.handleChange}
          fullWidth
        />
        {formik.touched.strength && formik.errors.strength && (
          <FormHelperText error id="standard-weight-helper-text-strength">
            {formik.errors.strength}
          </FormHelperText>
        )}
      </FormControl>

      <FormControl
        fullWidth
        error={
          formik.touched.area_of_improvement &&
          Boolean(formik.errors.area_of_improvement)
        }
        sx={{ marginTop: 3 }}
      >
        <InputLabel htmlFor="area_of_improvement">
          Area of Improvement
        </InputLabel>
        <OutlinedInput
          id="area_of_improvement"
          name="area_of_improvement"
          label="Area of Improvement"
          multiline
          minRows={3}
          value={formik.values.area_of_improvement}
          onChange={formik.handleChange}
          fullWidth
        />
      </FormControl>

      <FormControl
        fullWidth
        error={formik.touched.weakness && Boolean(formik.errors.weakness)}
        sx={{ marginTop: 3 }}
      >
        <InputLabel htmlFor="weakness">weakness</InputLabel>
        <OutlinedInput
          id="weakness"
          name="weakness"
          label="weakness"
          multiline
          minRows={3}
          value={formik.values.weakness}
          onChange={formik.handleChange}
          fullWidth
        />
      </FormControl>
      <FormControl
        fullWidth
        error={
          formik.touched.recommendation && Boolean(formik.errors.recommendation)
        }
        sx={{ marginTop: 3 }}
      >
        <InputLabel htmlFor="recommendation">Recommendation</InputLabel>
        <OutlinedInput
          id="recommendation"
          name="recommendation"
          label="Recommendation"
          multiline
          minRows={3}
          value={formik.values.recommendation}
          onChange={formik.handleChange}
          fullWidth
        />
      </FormControl>
    </DrogaFormModal>
  );
};

EditFeedBack.propTypes = {
  openEdit: PropTypes.bool,
  handleCloseModal: PropTypes.func,
  kpi: PropTypes.array,
  frequency: PropTypes.array,
  handleFeedbackSubmission: PropTypes.func,
  submitting: PropTypes.bool,
};

export default EditFeedBack;
