import React, { useState } from 'react';
// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Button, FormHelperText, Grid, OutlinedInput, Stack, Typography, useMediaQuery } from '@mui/material';
import { useFormik } from 'formik';

// third party
import * as Yup from 'yup';
import AnimateButton from 'ui-component/extended/AnimateButton';

// assets
import AuthWrapper from './components/AuthWrapper';
import MainCard from 'ui-component/cards/MainCard';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import CheckIcon from 'ui-component/iconify/CheckIcon';
import { motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
import EmailSendingConfirmation from './components/EmailSendingConfirmation';
import Verification from './components/verifyOTP';
import EmailVerification from './components/verifyEmail';

// ============================|| AUTH - FORGOT PASSWORD ||============================ //

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required')
});

const ForgotPassword = () => {
  const theme = useTheme();
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
    const Api = Backend.auth + Backend.resetPassword + '/';

    const headers = {
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ email: values.email })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Server responded with an error:", errorData);

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("data", data)
      if (data.success) {
        setSent(true);
      } else {
        // Handle cases where the request was successful but the operation was not
        // e.g., user not found. You might get this from data.message
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
            <EmailVerification email={formik.values.email} onClose={() => setSent(false)} />
          ) : (
            <MainCard>
              <React.Fragment>
                <Grid container direction="column" justifyContent="center" spacing={2}>
                  <Grid item xs={12} container alignItems="center" justifyContent="center">
                    <Grid
                      container
                      direction={matchDownSM ? 'column-reverse' : 'row'}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ marginBottom: 2 }}
                    >
                      <Grid item>
                        <Stack alignItems="center" justifyContent="center" spacing={1}>
                          <Typography color={theme.palette.primary.main} gutterBottom variant={matchDownSM ? 'h3' : 'h2'}>
                            Forgot Password
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" textAlign={matchDownSM ? 'center' : 'inherit'}>
                        Enter email address associated with your account
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
