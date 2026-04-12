import { useState, useEffect } from 'react';

import { Box, useTheme, Typography } from '@mui/material';
import { WelcomeSlideData } from 'data/welcome';
import authCover from '../../assets/images/auth1_cover.png';

// ----------------------------------------------------------------------

const WelcomeSlide = () => {
  const theme = useTheme();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActive((prevStep) => (prevStep + 1) % WelcomeSlideData.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        padding: 6,
        backgroundImage: `url(${authCover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box
        style={{
          width: '100%',
          height: '30%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* <img
          src={WelcomeSlideData[active].image}
          alt={WelcomeSlideData[active].title}
          width="100%"
          height="100%"
          style={{
            aspectRatio: 1,
            objectFit: 'scale-down',
          }}
        /> */}
      </Box>

      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <Typography variant="h3" color="white">
          {WelcomeSlideData[active].title}
        </Typography>
        <Typography
          variant="body2"
          color="white"
          marginTop={3}
          textAlign="center"
        >
          {WelcomeSlideData[active].description}
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'fixed',
          bottom: 30,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {WelcomeSlideData?.map((_, index) => (
          <Box
            key={index}
            onClick={() => setActive(index)}
            sx={{
              width: 24,
              height: 8,
              borderRadius: 2,
              backgroundColor:
                active === index
                  ? theme.palette.secondary.main
                  : theme.palette.primary.contrastText,
              cursor: 'pointer',
              margin: 1,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default WelcomeSlide;
