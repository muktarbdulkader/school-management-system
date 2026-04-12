import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const ChangePassword = ({ change, onClose, onSubmit, isUpdating }) => {
  // State to manage password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .required('New Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/, 'Password must contain at least one special character'),
    confirmNewPassword: Yup.string()
      .required('Confirm Password is required')
      .oneOf([Yup.ref('newPassword')], 'Passwords must match')
  });

  return (
    <Formik
      initialValues={{
        newPassword: '',
        confirmNewPassword: ''
      }}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        onSubmit(values);
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
        <DrogaFormModal
          open={change}
          title="Change Password"
          handleClose={onClose}
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitting={isUpdating}
        >
          <Form>
            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type={showPassword ? 'text' : 'password'} // Toggle type based on visibility state
              value={values.newPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              margin="normal"
              error={touched.newPassword && Boolean(errors.newPassword)}
              helperText={touched.newPassword && errors.newPassword}
              required
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)} // Toggle visibility
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmNewPassword"
              type={showConfirmPassword ? 'text' : 'password'} 
              value={values.confirmNewPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              margin="normal"
              error={touched.confirmNewPassword && Boolean(errors.confirmNewPassword)}
              helperText={touched.confirmNewPassword && errors.confirmNewPassword}
              required
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowConfirmPassword((prev) => !prev)} 
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
          </Form>
        </DrogaFormModal>
      )}
    </Formik>
  );
};

ChangePassword.propTypes = {
  change: PropTypes.bool.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default ChangePassword;
