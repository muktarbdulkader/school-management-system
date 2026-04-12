import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputBase,
  InputLabel,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { IconKey } from '@tabler/icons-react';
import { useFormik } from 'formik';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { toast, ToastContainer } from 'react-toastify';
import * as Yup from 'yup';
import Backend from 'services/backend';

const validationSchema = Yup.object().shape({
  oldPassword: Yup.string().max(255).required('Old password is required'),
  newPassword: Yup.string().max(255).required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'The passwords are not match')
    .max(255)
    .required('Please confirm new password'),
});

const ChangePassword = () => {
  const theme = useTheme();

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleClickShowOldPassword = () => {
    setShowOldPassword(!showOldPassword);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const formik = useFormik({
    initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: validationSchema,
    onSubmit: (value) => {
      handlePasswordChange(value);
    },
  });

  const handlePasswordChange = (value) => {
    setIsChanging(true);
    const token = localStorage.getItem('token');
    const Api = Backend.auth + Backend.changePassword + "/";
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      current_password: value?.oldPassword,
      new_password: value?.newPassword,
      confirm_password: value?.confirmPassword,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        const text = await res.text(); // get raw text
        try {
          return JSON.parse(text); // try to parse JSON
        } catch {
          throw new Error(text); // if not JSON, throw the raw text
        }
      })
      .then((response) => {
        if (response.success) {
          setIsChanging(false);
          formik.resetForm();
          toast.success(response.message || 'Password changed successfully');
        } else {
          setIsChanging(false);
          console.log(response);
          toast.error(response?.message || 'Password change failed');
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
        setIsChanging(false);
        console.error(error);
        toast.error(error.message || 'Unexpected error');
      });
  };

  return (
    <Grid
      container
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 1,
      }}
    >
      <Grid item xs={12} md={12}>
        <DrogaCard sx={{ padding: 3, marginTop: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: theme.palette.primary.light,
                marginRight: 2,
                padding: 1,
              }}
            >
              <IconKey stroke={1.8} size="1.6rem" />
            </Box>
            <Typography variant="h4">Change Password</Typography>
          </Box>

          <form noValidate onSubmit={formik.handleSubmit}>
            <FormControl
              sx={{ display: 'flex', marginTop: 5 }}
              error={Boolean(
                formik.touched.oldPassword && formik.errors.oldPassword,
              )}
            >
              <InputLabel htmlFor="outlined-adornment-password-login">
                Old Password
              </InputLabel>
              <InputBase
                id="oldPassword"
                name="oldPassword"
                type={showOldPassword ? 'text' : 'password'}
                label="Old Password"
                value={formik.values.oldPassword}
                onChange={formik.handleChange}
                fullWidth
                sx={{
                  padding: 1,
                  border: 1,
                  borderColor: theme.palette.divider,
                  borderRadius: theme.shape.borderRadius,
                }}
                error={
                  formik.touched.oldPassword &&
                  Boolean(formik.errors.oldPassword)
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowOldPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      size="large"
                    >
                      {showOldPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              {formik.touched.oldPassword && formik.errors.oldPassword && (
                <FormHelperText
                  error
                  id="standard-weight-helper-text-oldPassword"
                >
                  {formik.errors.oldPassword}
                </FormHelperText>
              )}
            </FormControl>

            <Grid
              container
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 1,
              }}
            >
              <Grid item xs={12} md={5.8}>
                <FormControl
                  sx={{ display: 'flex', marginTop: 3 }}
                  error={Boolean(
                    formik.touched.newPassword && formik.errors.newPassword,
                  )}
                >
                  <InputLabel htmlFor="outlined-adornment-password-login">
                    New Password
                  </InputLabel>
                  <InputBase
                    id="outlined-adornment-password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={formik.values.newPassword}
                    name="newPassword"
                    onChange={formik.handleChange}
                    label="New Password"
                    color="primary"
                    sx={{
                      padding: 1,
                      border: 1,
                      borderColor: theme.palette.divider,
                      borderRadius: theme.shape.borderRadius,
                    }}
                  />
                  {formik.touched.newPassword && formik.errors.newPassword && (
                    <FormHelperText
                      error
                      id="standard-weight-helper-text-password-login"
                    >
                      {formik.errors.newPassword}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={5.8}>
                <FormControl
                  sx={{ display: 'flex', marginTop: 3 }}
                  error={Boolean(
                    formik.touched.confirmPassword &&
                      formik.errors.confirmPassword,
                  )}
                >
                  <InputLabel htmlFor="outlined-adornment-password-login">
                    Confirm Password
                  </InputLabel>
                  <InputBase
                    id="outlined-adornment-password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={formik.values.confirmPassword}
                    name="confirmPassword"
                    onChange={formik.handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          size="large"
                        >
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Confirm Password"
                    color="primary"
                    sx={{
                      padding: 1,
                      border: 1,
                      borderColor: theme.palette.divider,
                      borderRadius: theme.shape.borderRadius,
                    }}
                  />
                  {formik.touched.confirmPassword &&
                    formik.errors.confirmPassword && (
                      <FormHelperText
                        error
                        id="standard-weight-helper-text-password-login"
                      >
                        {formik.errors.confirmPassword}
                      </FormHelperText>
                    )}
                </FormControl>
              </Grid>
            </Grid>

            <Grid
              container
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <Grid item xs={12} md={2.8}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{
                    marginTop: 4,
                    boxShadow: 0,
                    paddingX: 4,
                    paddingY: 1.3,
                    borderRadius: 2,
                  }}
                >
                  {isChanging ? (
                    <CircularProgress size={18} sx={{ color: 'white' }} />
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        </DrogaCard>
      </Grid>
      <ToastContainer />
    </Grid>
  );
};

export default ChangePassword;
