import React from 'react';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import { Box, FormControl, FormHelperText, Grid, InputLabel, OutlinedInput, Typography, TextField, useTheme } from '@mui/material';
import { useFormik } from 'formik';
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';

const today = new Date();
const sevenDaysFromNow = new Date();
sevenDaysFromNow.setDate(today.getDate() + 7);

const validationSchema = Yup.object().shape({
  task: Yup.string().required('The sub task name is required').min(3, 'Sub task name expected to be more than 3 letters'),
  description: Yup.string().max(300, 'At maximum description can be 300 letters')
});

const AddSubTask = ({ open, handleCloseModal, task, handleSubmission, submitting }) => {
  const theme = useTheme();

  const formik = useFormik({
    initialValues: {
      task: '',
      description: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission({ ...values }, task?.id);
    }
  });

  return (
    <DrogaFormModal
      open={open}
      title="Add Sub Task"
      handleClose={handleCloseModal}
      onCancel={handleCloseModal}
      onSubmit={formik.handleSubmit}
      submitting={submitting}
      sx={{ width: window.innerWidth / 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Grid container spacing={1} sx={{ display: 'flex', borderBottom: 1, borderColor: theme.palette.divider }}>
        <Grid item xs={12} sm={12} md={6} lg={6} xl={6} sx={{ py: 3, pl: 4 }}>
          <Box>
            <Typography variant="subtitle1">Task name</Typography>
            <Typography variant="subtitle2">{task?.title}</Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="subtitle1">KPI</Typography>
            <Typography variant="subtitle2">{task?.plan?.kpi?.name}</Typography>
          </Box>
        </Grid>
      </Grid>

      <FormControl fullWidth error={formik.touched.task && Boolean(formik.errors.task)} sx={{ marginTop: 3 }}>
        <InputLabel htmlFor="task">Sub Task Name</InputLabel>
        <OutlinedInput id="task" name="task" label="Sub Task Name" value={formik.values.task} onChange={formik.handleChange} fullWidth />
        {formik.touched.task && formik.errors.task && (
          <FormHelperText error id="standard-weight-helper-text-task">
            {formik.errors.task}
          </FormHelperText>
        )}
      </FormControl>

      <FormControl fullWidth error={formik.touched.description && Boolean(formik.errors.description)} sx={{ marginTop: 3 }}>
        <InputLabel htmlFor="description">Sub Task Description (optional)</InputLabel>
        <OutlinedInput
          id="description"
          name="description"
          label="Sub Task Description (optional)"
          multiline
          minRows={3}
          value={formik.values.description}
          onChange={formik.handleChange}
          fullWidth
        />
        {formik.touched.description && formik.errors.description && (
          <FormHelperText error id="standard-weight-helper-text-description">
            {formik.errors.description}
          </FormHelperText>
        )}
      </FormControl>
    </DrogaFormModal>
  );
};

AddSubTask.propTypes = {
  open: PropTypes.bool,
  handleCloseModal: PropTypes.func,
  task: PropTypes.object,
  handleSubmission: PropTypes.func,
  submitting: PropTypes.bool
};

export default AddSubTask;
