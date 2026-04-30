import React, { useState } from 'react';
// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Button, FormHelperText, Grid, OutlinedInput, Stack, Typography, useMediaQuery } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { useFormik } from 'formik';

// third party
import * as Yup from 'yup';
import AnimateButton from 'ui-component/extended/AnimateButton';

// assets
import AuthWrapper from './components/AuthWrapper';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import CheckIcon from 'ui-component/iconify/CheckIcon';
import Logo from 'ui-component/Logo';
import { useNavigate } from 'react-router-dom';

// ============================|| AUTH - FORGOT PASSWORD ||============================ //

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required')
});

const ForgotPassword = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

  const [sent, setSent] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      submit: null
    },
    validationSchema: validationSchema,

    onSubmit: async (values) => {
      handleSubmission(values);
    }
  });

  const handleSubmission = async (values) => {
    setIsSubmitting(true);
    const Api = Backend.auth + Backend.forgotPassword;

    const headers = {
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      email: values.email,
      frontend_url: window.location.origin
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Server responded with an error:", errorData);

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("data", responseData)
      if (responseData.success) {
        setSent(true);
      } else {
        // Handle cases where the request was successful but the operation was not
        // e.g., user not found. You might get this from responseData.message
      }
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(formik.isSubmitting);

  return (
    <AuthWrapper>
      <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 28px)' }}>
        <Grid item xs={12} sm={12} md={6} lg={4} xl={4} sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
          {sent ? (
            <MainCard>
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ mb: 3 }}>
                  <Logo width={60} height={60} />
                </Box>
                <CheckIcon size={56} color={theme.palette.success.main} />
                <Typography variant="h3" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                  Check Your Email
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                  We've sent a 6-digit verification code to:
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, color: theme.palette.primary.main, fontWeight: 500 }}>
                  {formik.values.email}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/reset-password', { state: { email: formik.values.email } })}
                  fullWidth
                  size="large"
                  sx={{ mb: 2, py: 1.5, borderRadius: 2 }}
                >
                  Enter Verification Code
                </Button>
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => setSent(false)}
                  fullWidth
                >
                  Use Different Email
                </Button>
              </Box>
            </MainCard>
          ) : (
            <MainCard>
              <React.Fragment>
                <Grid container direction="column" justifyContent="center" spacing={2}>
                  <Grid item xs={12} container alignItems="center" justifyContent="center">
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <Logo width={80} height={80} />
                      </Box>
                      <Typography color={theme.palette.primary.main} gutterBottom variant="h2" sx={{ fontWeight: 700 }}>
                        MALD School
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Password Recovery
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="textSecondary">
                        Enter your registered email address. We'll send you a 6-digit verification code to reset your password.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <form noValidate onSubmit={formik.handleSubmit}>
                  <Box
                    sx={{
                      padding: 1.4,
                      minWidth: '90%',
                      borderRadius: 2,
                      marginTop: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <OutlinedInput
                      id="email-number"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      fullWidth
                      placeholder="Enter Email Address"
                      error={formik.touched.email && Boolean(formik.errors.email)}
                    />
                    <Box>
                      <AnimateButton>
                        <Button
                          disableElevation
                          disabled={isSubmitting}
                          type="submit"
                          variant="contained"
                          color="primary"
                          sx={{
                            padding: 1.6,
                            borderRadius: 1.6,
                            fontWeight: 'bold',
                            marginLeft: 1,
                            paddingX: 2
                          }}
                        >
                          {isSubmitting ? <ActivityIndicator size={20} color="primary" /> : 'Submit'}
                        </Button>
                      </AnimateButton>
                    </Box>
                  </Box>

                  {formik.touched.email && formik.errors.email && (
                    <Box sx={{ mt: 1, paddingX: 1.4 }}>
                      <FormHelperText error>{formik.errors.email}</FormHelperText>
                    </Box>
                  )}
                </form>
              </React.Fragment>
            </MainCard>
          )}
        </Grid>
      </Grid>
    </AuthWrapper>
  );
};

export default ForgotPassword;
