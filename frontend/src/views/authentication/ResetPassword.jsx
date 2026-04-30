import { useState, useEffect } from 'react';
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
  useMediaQuery,
  Stack,
  Link
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconCircleCheck, IconEye, IconEyeClosed, IconMail, IconLock, IconLockCheck } from '@tabler/icons-react';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toast, ToastContainer } from 'react-toastify';
import AnimateButton from 'ui-component/extended/AnimateButton';
import MainCard from 'ui-component/cards/MainCard';
import Backend from 'services/backend';
import AuthWrapper from './components/AuthWrapper';
import Logo from 'ui-component/Logo';
import { motion } from 'framer-motion';

const AnimatedSuccess = motion(Box);
const AnimateIcon = motion(IconCircleCheck);

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  code: Yup.string()
    .length(6, 'Code must be 6 digits')
    .matches(/^\d{6}$/, 'Code must be 6 digits')
    .required('Reset code is required'),
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
  const location = useLocation();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

  const initialEmail = location.state?.email || '';

  const [step, setStep] = useState(2); // Step 2: OTP (Email is step 1, done in forgot-password)
  const [logSpinner, setLogSpinner] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const redirectToSignin = () => {
    navigate('/');
  };

  const handleVerifyCode = async (values) => {
    setLogSpinner(true);
    // Verify the code with backend before allowing to proceed
    const Api = Backend.auth + 'verify-reset-code/';
    const headers = {
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      email: values.email,
      code: values.code
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        setStep(3);
        toast.success('Code verified! Please set your new password.');
      } else {
        toast.error(result.message || 'Invalid verification code. Please check and try again.');
      }
    } catch (error) {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLogSpinner(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setResendLoading(true);
    const Api = Backend.auth + 'forgot-password/';
    const headers = {
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      email: formikStep2.values.email,
      frontend_url: window.location.origin
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('New verification code sent! Check your email.');
        setCanResend(false);
        setCountdown(60);
        // Clear the code input
        formikStep2.setFieldValue('code', '');
      } else {
        toast.error(result.message || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSettingNewPassword = async (values) => {
    setLogSpinner(true);
    const Api = Backend.auth + 'reset-password/';
    const headers = {
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      token: values.code,
      email: values.email,
      new_password: values.newPassword
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setPasswordSet(true);
      } else {
        toast.error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLogSpinner(false);
    }
  };

  const formikStep2 = useFormik({
    initialValues: {
      email: initialEmail,
      code: ''
    },
    validationSchema: Yup.object().shape({
      email: Yup.string().email('Invalid email').required('Email is required'),
      code: Yup.string()
        .length(6, 'Code must be 6 digits')
        .matches(/^\d{6}$/, 'Code must be 6 digits')
        .required('Reset code is required')
    }),
    onSubmit: (values) => {
      handleVerifyCode(values);
    }
  });

  const formikStep3 = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object().shape({
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
    }),
    onSubmit: (values) => {
      const fullValues = {
        email: formikStep2.values.email,
        code: formikStep2.values.code,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      };
      handleSettingNewPassword(fullValues);
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
                    sx={{ textAlign: 'center', p: 3 }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Logo width={60} height={60} />
                    </Box>
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
                    <Typography variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                      Password Reset Complete!
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary }}>
                      Your password has been successfully updated. You can now sign in with your new password.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={redirectToSignin}
                      fullWidth
                      size="large"
                      sx={{ py: 1.5, borderRadius: 2 }}
                    >
                      Sign In Now
                    </Button>
                  </AnimatedSuccess>
                ) : (
                  // Step 2 (OTP) or Step 3 (Password) with Stepper
                  <>
                    {/* Stepper */}
                    <Box sx={{ mb: 4 }}>
                      <Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
                        {/* Step 1 - Email (Completed) */}
                        <Box sx={{ textAlign: 'center' }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.success.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            mb: 0.5
                          }}>
                            <IconCircleCheck size={24} />
                          </Box>
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                            Email
                          </Typography>
                        </Box>

                        {/* Line */}
                        <Box sx={{
                          width: 40,
                          height: 2,
                          backgroundColor: step >= 3 ? theme.palette.success.main : theme.palette.primary.main
                        }} />

                        {/* Step 2 - OTP */}
                        <Box sx={{ textAlign: 'center' }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: step === 2 ? theme.palette.primary.main : theme.palette.success.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            mb: 0.5,
                            border: step === 2 ? `3px solid ${theme.palette.primary.light}` : 'none'
                          }}>
                            <IconLock size={24} />
                          </Box>
                          <Typography variant="caption" color={step === 2 ? 'primary' : 'success.main'} sx={{ fontWeight: 500 }}>
                            OTP
                          </Typography>
                        </Box>

                        {/* Line */}
                        <Box sx={{
                          width: 40,
                          height: 2,
                          backgroundColor: step >= 3 ? theme.palette.primary.main : theme.palette.grey[300]
                        }} />

                        {/* Step 3 - Password */}
                        <Box sx={{ textAlign: 'center' }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: step >= 3 ? theme.palette.primary.main : theme.palette.grey[300],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: step >= 3 ? 'white' : theme.palette.grey[600],
                            mb: 0.5
                          }}>
                            <IconLockCheck size={24} />
                          </Box>
                          <Typography variant="caption" color={step >= 3 ? 'primary' : 'textSecondary'} sx={{ fontWeight: 500 }}>
                            Password
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {step === 2 ? (
                      // Step 2: Enter OTP
                      <>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                          <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.primary.light,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            mb: 2
                          }}>
                            <IconMail size={40} color={theme.palette.primary.main} />
                          </Box>
                          <Typography variant="h4" textAlign="center" sx={{ mb: 1, fontWeight: 600 }}>
                            Enter OTP
                          </Typography>
                          <Typography variant="body1" textAlign="center" color="textSecondary" sx={{ mb: 2 }}>
                            Enter the 6-digit code sent to
                          </Typography>
                          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 500 }}>
                            {formikStep2.values.email}
                          </Typography>
                        </Box>

                        <form noValidate onSubmit={formikStep2.handleSubmit}>
                          <FormControl
                            fullWidth
                            error={Boolean(formikStep2.touched.code && formikStep2.errors.code)}
                            sx={{ mb: 3 }}
                          >
                            <InputLabel htmlFor="code">6-Digit Code</InputLabel>
                            <OutlinedInput
                              id="code"
                              type="text"
                              {...formikStep2.getFieldProps('code')}
                              label="6-Digit Code"
                              placeholder="------"
                              inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
                              sx={{
                                textAlign: 'center',
                                letterSpacing: '0.5em',
                                fontSize: '1.5rem',
                                '& input': {
                                  textAlign: 'center',
                                  letterSpacing: '0.3em'
                                }
                              }}
                            />
                            {formikStep2.touched.code && formikStep2.errors.code && (
                              <FormHelperText error>{formikStep2.errors.code}</FormHelperText>
                            )}
                          </FormControl>

                          <Box sx={{ mb: 3, textAlign: 'center' }}>
                            <Link
                              component="button"
                              type="button"
                              disabled={!canResend || resendLoading}
                              onClick={handleResendCode}
                              sx={{
                                color: canResend ? theme.palette.primary.main : theme.palette.grey[400],
                                cursor: canResend ? 'pointer' : 'not-allowed',
                                textDecoration: 'none',
                                fontWeight: 500,
                                '&:hover': {
                                  textDecoration: canResend ? 'underline' : 'none'
                                }
                              }}
                            >
                              {resendLoading ? (
                                <CircularProgress size={16} />
                              ) : canResend ? (
                                'Resend OTP'
                              ) : (
                                `Resend OTP in ${countdown}s`
                              )}
                            </Link>
                          </Box>

                          <Box sx={{ mt: 2 }}>
                            <AnimateButton>
                              <Button
                                disableElevation
                                disabled={logSpinner}
                                fullWidth
                                size="large"
                                type="submit"
                                variant="contained"
                                color="primary"
                                sx={{
                                  py: 1.5,
                                  borderRadius: 3,
                                  fontWeight: 600,
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                                }}
                              >
                                {logSpinner ? <CircularProgress size={20} color="inherit" /> : 'Verify OTP'}
                              </Button>
                            </AnimateButton>
                          </Box>
                        </form>

                        <Button
                          type="button"
                          variant="text"
                          color="primary"
                          fullWidth
                          size="large"
                          sx={{ marginTop: 2 }}
                          onClick={() => navigate('/forgot-password')}
                        >
                          Change Email
                        </Button>
                      </>
                    ) : (
                      // Step 3: Create New Password
                      <>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          <Typography variant="h4" textAlign="center" sx={{ mb: 1, fontWeight: 600 }}>
                            Create New Password
                          </Typography>
                          <Typography variant="body1" textAlign="center" color="textSecondary">
                            Set a strong password for your account
                          </Typography>
                        </Box>

                        <form noValidate onSubmit={formikStep3.handleSubmit}>
                          <FormControl
                            fullWidth
                            error={Boolean(formikStep3.touched.newPassword && formikStep3.errors.newPassword)}
                            sx={{ ...theme.typography.customInput, mb: 2 }}
                          >
                            <InputLabel htmlFor="new-password">New Password</InputLabel>
                            <OutlinedInput
                              id="new-password"
                              type={showPassword ? 'text' : 'password'}
                              {...formikStep3.getFieldProps('newPassword')}
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
                            {formikStep3.touched.newPassword && formikStep3.errors.newPassword && (
                              <FormHelperText error>{formikStep3.errors.newPassword}</FormHelperText>
                            )}
                          </FormControl>

                          <FormControl
                            fullWidth
                            error={Boolean(formikStep3.touched.confirmPassword && formikStep3.errors.confirmPassword)}
                            sx={{ ...theme.typography.customInput, mb: 2 }}
                          >
                            <InputLabel htmlFor="confirm-password">Confirm Password</InputLabel>
                            <OutlinedInput
                              id="confirm-password"
                              type={showPassword ? 'text' : 'password'}
                              {...formikStep3.getFieldProps('confirmPassword')}
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
                            {formikStep3.touched.confirmPassword && formikStep3.errors.confirmPassword && (
                              <FormHelperText error>{formikStep3.errors.confirmPassword}</FormHelperText>
                            )}
                          </FormControl>

                          <Box sx={{ mt: 3 }}>
                            <AnimateButton>
                              <Button
                                disableElevation
                                disabled={logSpinner}
                                fullWidth
                                size="large"
                                type="submit"
                                variant="contained"
                                color="primary"
                                sx={{
                                  py: 1.5,
                                  borderRadius: 3,
                                  fontWeight: 600,
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                                }}
                              >
                                {logSpinner ? <CircularProgress size={20} color="inherit" /> : 'Reset Password'}
                              </Button>
                            </AnimateButton>
                          </Box>
                        </form>

                        <Button
                          type="button"
                          variant="text"
                          color="primary"
                          fullWidth
                          size="large"
                          sx={{ marginTop: 2 }}
                          onClick={() => setStep(2)}
                        >
                          Back to Verify Code
                        </Button>
                      </>
                    )}
                  </>
                )}
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
