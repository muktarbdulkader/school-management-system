// material-ui
// import logo from 'assets/images/droga.svg';
// import iconLogo from 'assets/images/logo-icon.svg';

import { Typography } from '@mui/material';
import logo from 'assets/images/maleda.svg';
import iconLogo from 'assets/images/maleda.svg';

// ==============================|| LOGO ||============================== //

const Logo = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <img src={logo} alt="SMS" width="100px" height="64px" />
      <Typography variant="h2" sx={{ mt: 2, fontWeight: 600 }}>
        MALD
      </Typography>
    </div>
  );
};

export const IconLogo = () => {
  return <img src={iconLogo} alt="Logo" width="100px" height="40px" />;
};

export default Logo;
