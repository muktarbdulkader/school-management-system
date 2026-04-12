import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const validationSchema = Yup.object().shape({
  perspectiveName: Yup.string().required('Perspective name is required'),
  weight: Yup.number().required('Perspective weight is required').max(100, 'Perspective weight can not be more than 100')
});

const EditPerspectives = ({ open, selected, handleClose, handleSubmission, submitting }) => {
  const formik = useFormik({
    initialValues: {
      perspectiveName: selected ? selected?.name : '',
      weight: selected ? selected?.weight : ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission(values);
    }
  });
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle variant="h4">Edit Perspective</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit}>
          <TextField
            autoFocus
            margin="dense"
            id="perspectiveName"
            name="perspectiveName"
            label="Perspective Name"
            type="text"
            fullWidth
            value={formik.values.perspectiveName}
            onChange={formik.handleChange}
            error={formik.touched.perspectiveName && Boolean(formik.errors.perspectiveName)}
            helperText={formik.touched.perspectiveName && formik.errors.perspectiveName}
          />

          <TextField
            autoFocus
            margin="dense"
            id="perspective-weight"
            name="weight"
            label="Weight"
            type="text"
            fullWidth
            value={formik.values.weight}
            onChange={formik.handleChange}
            error={formik.touched.weight && Boolean(formik.errors.weight)}
            helperText={formik.touched.weight && formik.errors.weight}
          />

          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>

            <DrogaButton title={submitting ? <ActivityIndicator size={18} sx={{ color: 'white' }} /> : 'Submit'} type="submit" />
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EditPerspectives;
