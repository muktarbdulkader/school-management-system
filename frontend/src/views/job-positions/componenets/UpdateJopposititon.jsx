import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Box, CircularProgress, FormControl, FormHelperText, IconButton, InputLabel, OutlinedInput, useTheme } from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useFormik } from 'formik';

import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Full name is required')
});

const UpdateJobPosititon = ({ update, isUpdating, onClose, JopPositionData, handleSubmission }) => {
  const theme = useTheme();

  const formik = useFormik({
    initialValues: {
      name: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission(values);
    }
  });

  const setFormInitialValues = () => {
    formik.setValues({
      ...formik.values,
      name: JopPositionData?.name
    });
  };

  React.useEffect(() => {
    setFormInitialValues();

    return () => {};
  }, [update]);

  return (
    <React.Fragment>
      <Dialog open={update} onClose={onClose}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 2,
            paddingY: 0.6,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <DialogTitle variant="h4" color={theme.palette.text.primary}>
            Edit Job Position
          </DialogTitle>
          <IconButton onClick={onClose}>
            <IconX size={20} color={theme.palette.text.primary} />
          </IconButton>
        </Box>

        <form noValidate onSubmit={formik.handleSubmit}>
          <DialogContent>
            <FormControl fullWidth error={formik.touched.name && Boolean(formik.errors.name)}>
              <InputLabel htmlFor="name">Job Position</InputLabel>
              <OutlinedInput id="name" name="name" label="Full name" value={formik.values.name} onChange={formik.handleChange} fullWidth />
              {formik.touched.name && formik.errors.name && (
                <FormHelperText error id="standard-weight-helper-text-name">
                  {formik.errors.name}
                </FormHelperText>
              )}
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ paddingX: 2, marginBottom: 2 }}>
            <Button onClick={onClose} sx={{ marginLeft: 10 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ paddingX: 6, boxShadow: 0 }} disabled={isUpdating}>
              {isUpdating ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Done'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </React.Fragment>
  );
};

export default UpdateJobPosititon;
