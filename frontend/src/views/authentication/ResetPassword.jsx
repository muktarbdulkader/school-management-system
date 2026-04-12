import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconCircleCheck, IconEye, IconEyeClosed } from '@tabler/icons-react';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toast, ToastContainer } from 'react-toastify';
import AnimateButton from 'ui-component/extended/AnimateButton';
import MainCard from 'ui-component/cards/MainCard';
import Backend from 'services/backend';
import AuthWrapper from './components/AuthWrapper';
import { motion } from 'framer-motion';

const AnimatedSuccess = motion(Box);
const AnimateIcon = motion(IconCircleCheck);

const validationSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(255, 'Password cannot exceed 255 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/\d/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Please confirm password')
});

const ResetPassword = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useLocation();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

  const [logSpinner, setLogSpinner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const redirectToSignin = () => {
    navigate('/');
  };

  const handleSettingNewPassword = async (values) => {
    setLogSpinner(true);
    const Api = Backend.auth + Backend.setPassword;
    const headers = {
      Authorization: `Bearer ${state.token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      password: values.newPassword,
      confirm_password: values.confirmPassword
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.data.message);
        setPasswordSet(true);
      } else {
        toast.error(result.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLogSpinner(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: (values) => {
      handleSettingNewPassword(values);
    }
  });

  return (
    <AuthWrapper>
      <Grid container direction="column" justifyContent="flex-end" sx={{ minHeight: '100vh' }}>
        <Grid item xs={12}>
          <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 28px)' }}>
            <Grid item sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
              <MainCard>
                {passwordSet ? (
                  <AnimatedSuccess
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    sx={{ textAlign: 'center' }}
                  >
                    <AnimateIcon
                      initial={{ y: -100 }}
                      animate={{ y: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 20,
                        mass: 1,
                        duration: 0.6
                      }}
                      size={68}
                      color="green"
                    />

                    <Typography variant="body2" className="text-center">
                      New password is set successfully, you can sign in now.
                    </Typography>
                  </AnimatedSuccess>
                ) : (
                  <>
                    <Grid container direction="column" justifyContent="center" spacing={2}>
                      <Grid item xs={12} container alignItems="center" justifyContent="center">
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h3" textAlign="center" color="primary">
                            Set New Password
                          </Typography>
                          <Typography variant="subtitle1" textAlign={matchDownSM ? 'center' : 'inherit'}>
                            Enter and confirm new password
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <form noValidate onSubmit={formik.handleSubmit}>
                      <FormControl
                        fullWidth
                        error={Boolean(formik.touched.newPassword && formik.errors.newPassword)}
                        sx={{ ...theme.typography.customInput }}
                      >
                        <InputLabel htmlFor="new-password">New Password</InputLabel>
                        <OutlinedInput
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          {...formik.getFieldProps('newPassword')}
                          label="New Password"
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showPassword ? <IconEye size="1.3rem" /> : <IconEyeClosed size="1.3rem" />}
                              </IconButton>
                            </InputAdornment>
                          }
                        />
                        {formik.touched.newPassword && formik.errors.newPassword && (
                          <FormHelperText error>{formik.errors.newPassword}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl
                        fullWidth
                        error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                        sx={{ ...theme.typography.customInput }}
                      >
                        <InputLabel htmlFor="confirm-password">Confirm Password</InputLabel>
                        <OutlinedInput
                          id="confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          {...formik.getFieldProps('confirmPassword')}
                          label="Confirm Password"
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showPassword ? <IconEye size="1.3rem" /> : <IconEyeClosed size="1.3rem" />}
                              </IconButton>
                            </InputAdornment>
                          }
                        />
                        {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                          <FormHelperText error>{formik.errors.confirmPassword}</FormHelperText>
                        )}
                      </FormControl>

                      <Box sx={{ mt: 4 }}>
                        <AnimateButton>
                          <Button
                            disableElevation
                            disabled={logSpinner}
                            fullWidth
                            size="large"
                            type="submit"
                            variant="contained"
                            color="primary"
                          >
                            {logSpinner ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
                          </Button>
                        </AnimateButton>
                      </Box>
                    </form>
                  </>
                )}
                <Button
                  type="button"
                  variant="text"
                  color="primary"
                  fullWidth
                  size="large"
                  sx={{ marginTop: 1 }}
                  onClick={redirectToSignin}
                >
                  Sign In
                </Button>
              </MainCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <ToastContainer />
    </AuthWrapper>
  );
};

export default ResetPassword;
