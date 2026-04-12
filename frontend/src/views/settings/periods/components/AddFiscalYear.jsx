import React, { useState } from 'react';
import { Box, FormControl, FormHelperText, InputLabel, OutlinedInput } from '@mui/material';
import { useFormik } from 'formik';
import { add } from 'date-fns';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import DateRangesPicker from './DateRangesPicker';

const validationSchema = Yup.object().shape({
  year: Yup.string().required('The year label is required')
});

const AddFiscalYear = ({ open, handleCloseModal, handleSubmission, submitting }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(add(new Date(), { years: 1 }));

  const formik = useFormik({
    initialValues: {
      year: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission({ ...values, start_date: startDate, end_date: endDate });
    }
  });
  return (
    <DrogaFormModal
      open={open}
      title="Add Fiscal Year"
      handleClose={handleCloseModal}
      onCancel={handleCloseModal}
      onSubmit={formik.handleSubmit}
      submitting={submitting}
    >
      <FormControl fullWidth error={formik.touched.year && Boolean(formik.errors.year)}>
        <InputLabel htmlFor="year">Year Label</InputLabel>
        <OutlinedInput id="year" name="year" label="year name" value={formik.values.year} onChange={formik.handleChange} fullWidth />
        {formik.touched.year && formik.errors.year && (
          <FormHelperText error id="standard-weight-helper-text-year">
            {formik.errors.year}
          </FormHelperText>
        )}
      </FormControl>

      <Box sx={{ marginTop: 4 }}>
        <DateRangesPicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
      </Box>
    </DrogaFormModal>
  );
};

AddFiscalYear.propTypes = {
  open: PropTypes.bool,
  handleCloseModal: PropTypes.func,
  handleTaskSubmission: PropTypes.func,
  submitting: PropTypes.bool
};

export default AddFiscalYear;
