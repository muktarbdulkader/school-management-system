import React from 'react';
import { FormControl, FormHelperText, InputLabel, OutlinedInput } from '@mui/material';
import { useFormik } from 'formik';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  description: Yup.string().required('Description is required')
});

const CreateWorkflow = ({ open, handleClose, onSubmit, submitting }) => {
  const formik = useFormik({
    initialValues: { name: '', description: '' },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  return (
    <DrogaFormModal
      open={open}
      title="Add Workflow"
      handleClose={handleClose}
      onCancel={handleClose}
      onSubmit={formik.handleSubmit}
      submitting={submitting}
    >
      <FormControl fullWidth error={formik.touched.name && Boolean(formik.errors.name)} sx={{ marginTop: 1 }}>
        <InputLabel htmlFor="name">Worflow name</InputLabel>
        <OutlinedInput id="name" name="name" label="Workflow name" value={formik.values.name} onChange={formik.handleChange} fullWidth />
        {formik.touched.name && formik.errors.name && (
          <FormHelperText error id="standard-weight-helper-text-name">
            {formik.errors.name}
          </FormHelperText>
        )}
      </FormControl>

      <FormControl
        fullWidth
        error={formik.touched.description && Boolean(formik.errors.description)}
        sx={{ marginTop: 3, marginBottom: 2 }}
      >
        <InputLabel htmlfor="description">Description</InputLabel>
        <OutlinedInput
          id="description"
          name="description"
          label="Description"
          value={formik.values.description}
          onChange={formik.handleChange}
          fullWidth
          multiline
          rows={4}
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

export default CreateWorkflow;
