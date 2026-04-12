import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import OTPCodes from './OTPCodes';
import PropTypes from 'prop-types';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { IconX } from '@tabler/icons-react';

const Verification = ({ phone, onWrong, onResend, isResending, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [seconds, setSeconds] = useState(59);
  const [resend, setResend] = useState(true);
  const [code, setCode] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleSavingUserToken = (token) => {
    localStorage.setItem('token', token);
    navigate('/reset-password');
  };

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
      phone: '251' + phone,
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
          setIsSubmitting(false);
          handleSavingUserToken(response.data.access_token);
          toast.success(response.data.message);
        } else {
          setIsSubmitting(false);
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        setIsSubmitting(false);
        toast.success(error.message);
      });
  };

  useEffect(() => {
    if (seconds > 0) {
      const interval = setInterval(() => {
        setSeconds(seconds - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setResend(false);
    }
  }, [seconds]);

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          textAlign: 'center',
          padding: 2,
          marginBottom: 2,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: -2,
            right: -1,
            color: theme.palette.primary.main,
          }}
        >
          <IconX size={22} />
        </IconButton>
        <Typography variant="h3" sx={{ marginTop: 1 }}>
          Phone Verification
        </Typography>
        <Typography variant="subtitle2" sx={{ marginTop: 1 }}>
          Enter a six digit code sent to <b>+251{phone}</b>
        </Typography>
        <Typography variant="subtitle1">
          00:{seconds > 9 ? seconds : '0' + seconds}
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
        sx={{ padding: 1.2, marginTop: 1, borderRadius: 2 }}
        disabled={!code || code[5] === '' || isSubmitting}
        fullWidth
        onClick={() => VerifyCode()}
      >
        {isSubmitting ? (
          <CircularProgress
            size={22}
            sx={{ color: theme.palette.background.default }}
          />
        ) : (
          'Verify'
        )}
      </Button>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingY: 1,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ cursor: 'pointer', color: theme.palette.grey[500] }}
          onClick={onWrong}
        >
          Wrong number
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingY: 2,
          }}
        >
          <Typography variant="subtitle2">Didn't get the code?</Typography>
          <Button
            variant="text"
            color="primary"
            sx={{ marginLeft: 0.3 }}
            disabled={resend}
            onClick={onResend}
          >
            {isResending ? (
              <CircularProgress
                size={18}
                sx={{ color: theme.palette.primary.main }}
              />
            ) : (
              'Resend'
            )}
          </Button>
        </Box>
      </Box>
      <ToastContainer />
    </>
  );
};

Verification.propTypes = {
  phone: PropTypes.number,
  onWrong: PropTypes.func,
  onResend: PropTypes.func,
  isResending: PropTypes.bool,
};

export default Verification;
