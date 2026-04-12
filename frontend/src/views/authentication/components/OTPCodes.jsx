import { useState } from 'react';
import { Grid, OutlinedInput } from '@mui/material';
import PropTypes from 'prop-types';

const numDigits = 6;

function OTPCodes({ optcode }) {
  const [otp, setOtp] = useState(new Array(numDigits).fill(''));

  const handleOtpChange = (event, index) => {
    const newOtp = [...otp];
    // Restrict the input to only 1 character
    newOtp[index] = event.target.value.slice(0, 1);

    if (newOtp[index] && index < numDigits - 1) {
      const nextIndex = index + 1;
      const nextInput = document.getElementById(`otp-input-${nextIndex}`);
      if (nextInput) {
        nextInput.focus();
      }
    }

    if (index > 0 && newOtp[index] === '') {
      const nextIndex = index - 1;
      const nextInput = document.getElementById(`otp-input-${nextIndex}`);
      if (nextInput) {
        nextInput.focus();
      }
    }

    setOtp(newOtp);

    if (otp.length === numDigits) {
      optcode(newOtp);
    }
  };

  return (
    <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {Array.from({ length: numDigits }).map((_, index) => (
        <OutlinedInput
          key={index}
          id={`otp-input-${index}`}
          type="tel"
          maxLength={1}
          value={otp[index]}
          onChange={(event) => handleOtpChange(event, index)}
          sx={{ fontSize: 16, marginLeft: 1.6, textAlign: 'center' }}
        />
      ))}
    </Grid>
  );
}

OTPCodes.propTypes = {
  optcode: PropTypes.func
};

export default OTPCodes;
