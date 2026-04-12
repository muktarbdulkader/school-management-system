import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Formik } from 'formik';
import { decodeToken } from '../../../../store/permissionUtils';
import { SET_USER, setUser, SIGN_IN } from '../../../../store/actions/actions';
import { Storage } from 'configration/storage';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import AnimateButton from 'ui-component/extended/AnimateButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import * as Yup from 'yup';
import { handleGettingManagerUnits } from 'utils/multiple-unit-manager';
import StoreUserUnit from 'utils/set-user-unit';
import { fetchUserPermissions } from '../../../../utils/auth/getFetchPermissions'

const AuthLogin = ({ ...others }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const customization = useSelector((state) => state.customization);

  const [showPassword, setShowPassword] = useState(false);
  const [signing, setSigning] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleSettingUpReduxState = async (user) => {
    dispatch(setUser({ type: SET_USER, user: user }));
    dispatch(StoreUserUnit());
    dispatch({ type: SIGN_IN, signed: true });
  };

  const handleSettingUpUserAccount = async (user) => {
    await handleGettingManagerUnits(dispatch);
    await handleSettingUpReduxState(user);
  };

  const handleLogin = async (
    values,
    { setErrors, setStatus, setSubmitting },
  ) => {
    try {
      setSigning(true);
      const Api = Backend.auth + Backend.login;

      const data = {
        email: values.email,
        password: values.password,
      };

      // POST login
      const response = await fetch(Api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      const body = await response.json();

      if (!body.success) {
        setStatus({ success: false });
        // Extract user-friendly error message
        const errorMessage = body.message || body.detail || 'Login failed. Please check your credentials.';
        setErrors({ submit: errorMessage });
        setSubmitting(false);
        return;
      }

      const { access_token, user, refresh_token } = body.data;

      if (typeof access_token !== 'string') {
        throw new Error('Invalid token format');
      }

      if (!refresh_token) {
        console.warn('No refresh token received from backend');
      }

      const decodedToken = decodeToken(access_token);
      console.log('Decoded token:', decodedToken);

      const currentTime = Date.now();
      const ttl = body.data.expires_in * 1000;
      const expirationTime = currentTime + ttl;

      // persist token + expiry + refresh token
      Storage.setItem('token', access_token);
      if (refresh_token) {
        Storage.setItem('refreshToken', refresh_token);
        console.log('Refresh token stored successfully');
      }
      Storage.setItem('tokenExpiration', expirationTime);
      console.log('Token expiration set to:', new Date(expirationTime).toLocaleString());

      // --- NEW: fetch permissions AFTER token is stored ---
      // If fetchUserPermissions needs the token as argument, pass access_token.
      // Otherwise it can read token from Storage as your existing function does.
      try {
        const permissions = await fetchUserPermissions(); // await here
        // optional: attach permissions to user object if fetchUserPermissions returns them
        if (permissions) {
          user.permissions = permissions;
        }
      } catch (permError) {
        // don't block login if permissions fetch fails; log/warn and continue
        console.warn('Failed to fetch permissions:', permError);
      }
      // -----------------------------------------------------

      // update app state and redirect / further setup
      dispatch(setUser(body.data));

      const isManager = decodedToken?.roles?.some(
        (role) => role.name === 'Manager',
      );

      if (isManager) {
        // if handleSettingUpUserAccount is async, await it
        await handleSettingUpUserAccount(user);
      } else {
        dispatch(setUser({ user }));
        dispatch({ type: SIGN_IN, signed: true });
      }
    } catch (error) {
      setStatus({ success: false });
      setErrors({ submit: error.message });
      setSubmitting(false);
    } finally {
      setSigning(false);
    }
  };

  return (
    <Formik
      initialValues={{ email: '', password: '', submit: null }}
      validationSchema={Yup.object().shape({
        email: Yup.string().required('Email, ID, or Full Name is required'),
        password: Yup.string().max(255).required('Password is required'),
      })}
      onSubmit={handleLogin}
    >
      {({
        errors,
        handleBlur,
        handleChange,
        handleSubmit,
        touched,
        values,
      }) => (
        <form noValidate onSubmit={handleSubmit} {...others}>
          <Box sx={{ mb: 3 }}></Box>

          <FormControl
            style={{ display: 'flex', marginBottom: '16px' }}
            error={Boolean(touched.email && errors.email)}
          >
            <InputLabel
              htmlFor="outlined-adornment-email-login"
              style={{ fontSize: '12px' }}
            >
              Email, ID, or Full Name
            </InputLabel>
            <OutlinedInput
              id="outlined-adornment-email-login"
              type="text"
              value={values.email}
              name="email"
              onBlur={handleBlur}
              onChange={handleChange}
              label="Email, ID, or Full Name"
              inputProps={{}}
            />
            {touched.email && errors.email && (
              <FormHelperText
                error
                id="standard-weight-helper-text-email-login"
              >
                {errors.email}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl
            style={{ display: 'flex', marginTop: 2 }}
            error={Boolean(touched.password && errors.password)}
          >
            <InputLabel
              htmlFor="outlined-adornment-password-login"
              style={{ fontSize: '12px' }}
            >
              Password
            </InputLabel>
            <OutlinedInput
              id="outlined-adornment-password-login"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              name="password"
              onBlur={handleBlur}
              onChange={handleChange}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    size="large"
                  >
                    {showPassword ? (
                      <Visibility fontSize="small" />
                    ) : (
                      <VisibilityOff fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
              color="primary"
            />
            {touched.password && errors.password && (
              <FormHelperText
                error
                id="standard-weight-helper-text-password-login"
              >
                {errors.password}
              </FormHelperText>
            )}
          </FormControl>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            spacing={1}
            sx={{ marginTop: 2 }}
          >
            <Link
              to={'/forgot-password'}
              variant="subtitle1"
              sx={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              Forgot Password?
            </Link>
          </Stack>
          {errors.submit && (
            <Box sx={{ mt: 3 }}>
              <FormHelperText error>{errors.submit}</FormHelperText>
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <AnimateButton>
              <Button
                disableElevation
                disabled={signing}
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                sx={{
                  padding: 1.6,
                  transition: 'all .2s ease-in-out',
                  '&[aria-controls="menu-list-grow"],&:hover': {
                    background: theme.palette.primary.dark,
                  },
                  borderRadius: `${customization.borderRadius}px`,
                }}
              >
                {signing ? <ActivityIndicator size={18} /> : 'Sign in'}
              </Button>
            </AnimateButton>
          </Box>
        </form>
      )}
    </Formik>
  );
};

export default AuthLogin;
