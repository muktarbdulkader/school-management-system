import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// project imports
import NotificationSection from './NotificationSection';
import ProfileSection from './ProfileSection';

// assets
import { IconMenu2 } from '@tabler/icons-react';
import { IconButton, useMediaQuery } from '@mui/material';
// import { useSelector } from 'react-redux';
import LogoSection from '../LogoSection';
import FiscalYearMenu from './FiscalYear';
import IsEmployee from 'utils/is-employee';

// ==============================|| MAIN NAVBAR HEADER ||============================== //

const Header = ({ handleLeftDrawerToggle, drawerOpen }) => {
  const theme = useTheme();
  const bigDevice = useMediaQuery(theme.breakpoints.up('md'));
  const isEmployee = IsEmployee();
  // const user = useSelector((state) => state.user.user);
  // const isSuperAdmin =
  //   user?.roles?.length === 1 &&
  //   user.roles[0].name.toLowerCase() === 'super_admin';

  return (
    <>
      {/* logo & toggler button */}
      <Box
        sx={{
          display: 'flex',
          zIndex: 10,
        }}
      >
        {!isEmployee ? (
          <IconButton variant="rounded" onClick={handleLeftDrawerToggle}>
            <IconMenu2
              stroke={1.5}
              size="1.6rem"
              color={theme.palette.text.primary}
            />
          </IconButton>
        ) : bigDevice ? (
          <IconButton variant="rounded" onClick={handleLeftDrawerToggle}>
            <IconMenu2
              stroke={1.5}
              size="1.6rem"
              color={theme.palette.text.primary}
            />
          </IconButton>
        ) : null}

        <Box sx={{ marginLeft: !isEmployee || (bigDevice && 2.4) }}>
          {!bigDevice ? <LogoSection /> : !drawerOpen ? <LogoSection /> : null}
        </Box>
      </Box>
      {/* {!isSuperAdmin && <FiscalYearMenu />} */}
      {/* {<FiscalYearMenu />} */}
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ flexGrow: 1 }} />
      {/* <NotificationSection /> */}
      <ProfileSection />
    </>
  );
};

Header.propTypes = {
  handleLeftDrawerToggle: PropTypes.func,
  drawerOpen: PropTypes.bool,
};

export default Header;
