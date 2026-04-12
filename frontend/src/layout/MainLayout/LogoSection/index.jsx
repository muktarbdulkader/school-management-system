import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';

// project imports
import config from 'config';
import Logo, { IconLogo } from 'ui-component/Logo';
import { MENU_OPEN } from 'store/actions/actions';
import { useMediaQuery, useTheme } from '@mui/material';

// ==============================|| MAIN LOGO ||============================== //

const LogoSection = () => {
  const defaultId = useSelector((state) => state.customization.defaultId);
  const dispatch = useDispatch();
  const theme = useTheme();
  const smallDevice = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <ButtonBase
      disableRipple
      onClick={() => dispatch({ type: MENU_OPEN, id: defaultId })}
      component={Link}
      to={config.defaultPath}
    >
      {smallDevice ? <IconLogo /> : <Logo />}
    </ButtonBase>
  );
};

export default LogoSection;
