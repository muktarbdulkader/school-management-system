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
import PropTypes from 'prop-types';

const validationSchema = Yup.object().shape({
  actual_value: Yup.string().required('Evaluation value is required'),
  description: Yup.string()
});

export const EvaluateModal = ({ add, isAdding, unitName, currentValue, onClose, handleSubmission }) => {
  const theme = useTheme();
  const formik = useFormik({
    initialValues: {
      actual_value: '',
      description: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission(values);
    }
  });

  React.useEffect(() => {
    if (currentValue) {
      formik.setValues({
        actual_value: currentValue > 0 ? currentValue : ''
      });
    }
  }, [currentValue]);

  return (
    <React.Fragment>
      <Dialog open={add} onClose={onClose}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 2,
            backgroundColor: theme.palette.grey[50]
          }}
        >
          <DialogTitle variant="h4" color={theme.palette.text.primary}>
            {unitName && unitName + ' Evaluation'}
          </DialogTitle>
          <IconButton onClick={onClose}>
            <IconX size={20} />
          </IconButton>
        </Box>

        <form noValidate onSubmit={formik.handleSubmit}>
          <DialogContent>
            <FormControl fullWidth error={formik.touched.actual_value && Boolean(formik.errors.actual_value)} sx={{ marginTop: 1 }}>
              <InputLabel htmlFor="actual_value">Actual Value</InputLabel>
              <OutlinedInput
                id="actual_value"
                name="actual_value"
                label="Actual Value"
                value={formik.values.actual_value}
                onChange={formik.handleChange}
                fullWidth
              />
              {formik.touched.actual_value && formik.errors.actual_value && (
                <FormHelperText error id="standard-weight-helper-text-actual_value">
                  {formik.errors.actual_value}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={formik.touched.description && Boolean(formik.errors.description)} sx={{ marginTop: 3 }}>
              <InputLabel htmlFor="description">Remark (optional)</InputLabel>
              <OutlinedInput
                id="description"
                name="description"
                label="Remark (optional)"
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
          </DialogContent>
          <DialogActions sx={{ paddingX: 2 }}>
            <Button onClick={onClose} sx={{ marginLeft: 10 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ paddingX: 6, boxShadow: 0, borderRadius: 2 }} disabled={isAdding}>
              {isAdding ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </React.Fragment>
  );
};

EvaluateModal.propTypes = {
  add: PropTypes.bool,
  isAdding: PropTypes.bool,
  unitName: PropTypes.string,
  currentValue: PropTypes.number,
  onClose: PropTypes.func,
  handleSubmission: PropTypes.func
};
