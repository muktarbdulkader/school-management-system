import React from 'react';
import { useFormik } from 'formik';
import { Box, FormControl, FormHelperText, Grid, InputLabel, OutlinedInput } from '@mui/material';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { IconSend } from '@tabler/icons-react';

const validationSchema = Yup.object().shape({
  remark: Yup.string().required('Please write something').min(4, 'minimum combination of 4 letters')
});

const CommentForm = ({ handleSubmission, submitting }) => {
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
    <Grid container>
      <Grid item xs={12} component="form" onSubmit={formik.handleSubmit}>
        <FormControl fullWidth error={formik.touched.remark && Boolean(formik.errors.remark)}>
          <InputLabel htmlFor="remark">Write here</InputLabel>
          <OutlinedInput
            id="remark"
            name="remark"
            label="Write here"
            value={formik.values.remark}
            onChange={formik.handleChange}
            multiline
            rows={4}
            fullWidth
            endAdornment={
              <DrogaButton
                type="submit"
                icon={<IconSend size="1.6rem" stroke="1.4" />}
                title={''}
                fullWidth
                variant="text"
                sx={{ boxShadow: 0, alignItems: 'center', marginY: 1.6 }}
                disabled={submitting}
              />
            }
          />
          {formik.touched.remark && formik.errors.remark && (
            <FormHelperText error id="standard-remark-helper-text">
              {formik.errors.remark}
            </FormHelperText>
          )}
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
