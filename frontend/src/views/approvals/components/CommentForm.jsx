import React, { useState } from 'react';
import { useFormik } from 'formik';
import { FormControl, FormHelperText, Grid, InputLabel, OutlinedInput, useTheme } from '@mui/material';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import * as Yup from 'yup';
import PropTypes from 'prop-types';

const validationSchema = Yup.object().shape({
  remark: Yup.string().required('Please write something').min(4, 'minimum combination of 4 letters')
});

const CommentForm = ({ handleSubmission, submitting }) => {
  const theme = useTheme();

  const formik = useFormik({
    initialValues: {
      remark: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission(values);
    }
  });

  return (
    <Grid container sx={{ borderBottom: 1, borderColor: theme.palette.divider, marginBottom: 1 }}>
      <Grid item xs={12} component="form" onSubmit={formik.handleSubmit}>
        <FormControl fullWidth error={formik.touched.remark && Boolean(formik.errors.remark)}>
          <InputLabel htmlFor="remark">Comment here</InputLabel>
          <OutlinedInput
            id="remark"
            name="remark"
            label="Comment here"
            value={formik.values.remark}
            onChange={formik.handleChange}
            multiline
            rows={3}
            fullWidth
          />
          {formik.touched.remark && formik.errors.remark && (
            <FormHelperText error id="standard-weight-helper-text-remark">
              {formik.errors.remark}
            </FormHelperText>
          )}

          <DrogaButton
            type="submit"
            title={submitting ? <ActivityIndicator size={16} sx={{ color: 'white' }} /> : 'Submit'}
            fullWidth
            variant="contained"
            sx={{ boxShadow: 0, alignItems: 'center', marginY: 1.6 }}
            disabled={submitting}
          />
        </FormControl>
      </Grid>
    </Grid>
  );
};

CommentForm.propTypes = {
  handleSubmission: PropTypes.func,
  submitting: PropTypes.bool
};

export default CommentForm;
