import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, OutlinedInput, Select, Typography, useTheme } from '@mui/material';
import { useFormik } from 'formik';
import PropTypes from 'prop-types';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  plan_id: Yup.string().required('Please select KPI first'),
  task: Yup.string().required('The task name is required').min(3, 'Task name expected to be more than 3 letters')
});

const CreateTask = ({ open, handleCloseModal, kpi, handleTaskSubmission, submitting }) => {
  const theme = useTheme();
  const formik = useFormik({
    initialValues: {
      plan_id: '',
      task: '',
      description: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleTaskSubmission(values);
    }
  });
  return (
    <DrogaFormModal
      open={open}
      title="Create Task"
      handleClose={handleCloseModal}
      onCancel={handleCloseModal}
      onSubmit={formik.handleSubmit}
      submitting={submitting}
    >
      <FormControl
        sx={{ border: 'none', boxShadow: 'none', p: 0 }}
        error={formik.touched.plan_id && Boolean(formik.errors.plan_id)}
        fullWidth
      >
        <InputLabel htmlFor="task" shrink={!formik.plan_id || formik.touched.plan_id}>
          Select KPI
        </InputLabel>
        <Select id="task" displayEmpty name="plan_id" label="Select KPI" value={formik.values.plan_id} onChange={formik.handleChange}>
          {kpi.length > 0 ? (
            kpi.map((plan, index) => (
              <MenuItem key={index} value={plan.plan_id}>
                <Typography variant="body1" color={theme.palette.text.primary}>
                  {plan?.name}
                </Typography>
              </MenuItem>
            ))
          ) : (
            <Box sx={{ p: 1 }}>
              <Typography variant="body1">There is no KPI assigned</Typography>
            </Box>
          )}
        </Select>

        {formik.touched.plan_id && formik.errors.plan_id && (
          <FormHelperText error id="standard-weight-helper-text-plan_id">
            {formik.errors.plan_id}
          </FormHelperText>
        )}
      </FormControl>

      <FormControl fullWidth error={formik.touched.task && Boolean(formik.errors.task)} sx={{ marginTop: 3 }}>
        <InputLabel htmlFor="task">Task name</InputLabel>
        <OutlinedInput
          id="task"
          name="task"
          label="Task name"
          value={formik.values.task}
          onChange={formik.handleChange}
          fullWidth
          spellCheck
        />
        {formik.touched.task && formik.errors.task && (
          <FormHelperText error id="standard-weight-helper-text-task">
            {formik.errors.task}
          </FormHelperText>
        )}
      </FormControl>

      <FormControl fullWidth error={formik.touched.description && Boolean(formik.errors.description)} sx={{ marginTop: 3 }} spellCheck>
        <InputLabel htmlFor="description">Task description (optional)</InputLabel>
        <OutlinedInput
          id="description"
          name="description"
          label="Task description (optional)"
          multiline
          minRows={3}
          value={formik.values.description}
          onChange={formik.handleChange}
          fullWidth
        />
      </FormControl>
    </DrogaFormModal>
  );
};

CreateTask.propTypes = {
  open: PropTypes.bool,
  handleCloseModal: PropTypes.func,
  kpi: PropTypes.array,
  handleTaskSubmission: PropTypes.func,
  submitting: PropTypes.bool
};

export default CreateTask;
