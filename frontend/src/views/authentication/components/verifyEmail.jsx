import { useState } from 'react';
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material';
import OTPCodes from './OTPCodes';
import PropTypes from 'prop-types';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { IconCircleCheck, IconX } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const AnimatedSuccess = motion(Box);
const AnimateIcon = motion(IconCircleCheck);

const EmailVerification = ({ email, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [code, setCode] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [verified, setVerified] = useState(false);

  const EnteredCode = (entered) => {
    setCode(entered);
  };

  const VerifyCode = () => {
    setIsSubmitting(true);
    const Api = Backend.auth + Backend.verifyOtp;
    const headers = {
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    let otp = code.join('');

    const data = {
      email: email,
      otp: otp,
    };

    fetch(Api, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data.message);
          navigate('/reset-password', {
            state: { token: response.data?.access_token },
          });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.success(error.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <DrogaCard sx={{ position: 'relative', p: 4 }}>
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 3,
          right: 3,
          color: theme.palette.primary.main,
        }}
      >
        <IconX size={22} />
      </IconButton>

      {verified ? (
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
              duration: 0.6,
            }}
            size={68}
            color="green"
          />

          <Typography variant="subtitle1" className="text-center" mt={1}>
            New password is set successfully, you can sign in now.
          </Typography>
        </AnimatedSuccess>
      ) : (
        <>
          <Box
            sx={{
              position: 'relative',
              textAlign: 'center',
              padding: 2,
              marginBottom: 2,
            }}
          >
            <Typography variant="h3" sx={{ marginTop: 1 }}>
              OTP Verification
            </Typography>
            <Typography variant="subtitle2" sx={{ marginTop: 1 }}>
              Enter a six digit code sent to your email
            </Typography>
          </Box>

          <OTPCodes optcode={(code) => EnteredCode(code)} />
          <Typography
            variant="subtitle2"
            color={theme.palette.error.light}
            sx={{ marginTop: 3 }}
          >
            {prompt}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ padding: 1.2, marginY: 1, borderRadius: 2 }}
            disabled={!code || code[5] === '' || isSubmitting}
            fullWidth
            onClick={() => VerifyCode()}
          >
            {isSubmitting ? (
              <ActivityIndicator
                size={22}
                sx={{ color: theme.palette.background.default }}
              />
            ) : (
              'Verify'
            )}
          </Button>
        </>
      )}

      <ToastContainer />
    </DrogaCard>
  );
};

EmailVerification.propTypes = {
  email: PropTypes.string,
  onWrong: PropTypes.func,
  onResend: PropTypes.func,
  isResending: PropTypes.bool,
};

export default EmailVerification;
