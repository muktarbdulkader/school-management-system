// import { useState } from 'react';
// import { useSelector } from 'react-redux';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// // material-ui
// import { useTheme } from '@mui/material/styles';
// import useMediaQuery from '@mui/material/useMediaQuery';
// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import Checkbox from '@mui/material/Checkbox';
// import Divider from '@mui/material/Divider';
// import FormControl from '@mui/material/FormControl';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import FormHelperText from '@mui/material/FormHelperText';
// import Grid from '@mui/material/Grid';
// import IconButton from '@mui/material/IconButton';
// import InputAdornment from '@mui/material/InputAdornment';
// import InputLabel from '@mui/material/InputLabel';
// import OutlinedInput from '@mui/material/OutlinedInput';
// import Typography from '@mui/material/Typography';
// import Stack from '@mui/material/Stack';

// // third party
// import * as Yup from 'yup';
// import { Formik } from 'formik';

// // project imports
// import AnimateButton from 'ui-component/extended/AnimateButton';

// // assets
// import Visibility from '@mui/icons-material/Visibility';
// import VisibilityOff from '@mui/icons-material/VisibilityOff';

// import Google from 'assets/images/icons/social-google.svg';

// // config
// import config from '../../../../config/config';

// const AuthLogin = ({ ...others }) => {
//   const theme = useTheme();
//   const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));
//   const customization = useSelector((state) => state.customization);
//   const [checked, setChecked] = useState(true);
//   const navigate = useNavigate();

//   const googleHandler = async () => {
//     console.error('Login');
//   };

//   const [showPassword, setShowPassword] = useState(false);
//   const handleClickShowPassword = () => {
//     setShowPassword(!showPassword);
//   };

//   const handleMouseDownPassword = (event) => {
//     event.preventDefault();
//   };

//   const handleLogin = async (values, { setErrors, setStatus, setSubmitting }) => {
//     try {
//       const response = await axios.post(`${config.API_URL}/login-with-email`, {
//         email: values.email,
//         password: values.password,
//       });

//       if (response.data.success) {
//         // Store email and password in local storage
//         localStorage.setItem('email', values.email);
//         localStorage.setItem('password', values.password);
//         localStorage.setItem('token', response.data.token);

//         // Show success toast
//         toast.success('Login successful...!');

//         // Redirect to user creation page
//         navigate('/utils/user-creation');
//       } else {
//         // Handle error response
//         setStatus({ success: false });
//         setErrors({ submit: response.data.message });
//         setSubmitting(false);
//       }
//     } catch (error) {
//       setStatus({ success: false });
//       setErrors({ submit: error.message });
//       setSubmitting(false);
//     }
//   };

//   return (
//     <>
//       <Grid container direction="column" justifyContent="center" spacing={2}>
//         <Grid item xs={12} container alignItems="center" justifyContent="center">
//           <Box sx={{ mb: 3 }}>
//             {/* <Typography variant="subtitle1" style={{fontSize:'12px'}}>Sign in with Email address</Typography> */}
//           </Box>
//         </Grid>
//       </Grid>

//       <Formik
//         initialValues={{
//           email: '',
//           password: '',
//           submit: null
//         }}
//         validationSchema={Yup.object().shape({
//           email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
//           password: Yup.string().max(255).required('Password is required')
//         })}
//         onSubmit={handleLogin}
//       >
//         {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
//           <form noValidate onSubmit={handleSubmit} {...others}>
//             <FormControl style={{ display: 'flex' }} error={Boolean(touched.email && errors.email)} >
//               <InputLabel htmlFor="outlined-adornment-email-login" style={{fontSize:'12px'}}>Email Address / Username</InputLabel>
//               <OutlinedInput
//                 id="outlined-adornment-email-login"
//                 type="email"
//                 value={values.email}
//                 style={{ height: '40px' ,marginBottom:'10px'}}
//                 name="email"
//                 onBlur={handleBlur}
//                 onChange={handleChange}
//                 label="Email Address / Username"
//                 inputProps={{}}
//               />
//               {touched.email && errors.email && (
//                 <FormHelperText error id="standard-weight-helper-text-email-login">
//                   {errors.email}
//                 </FormHelperText>
//               )}
//             </FormControl>

//             <FormControl style={{ display: 'flex' }} error={Boolean(touched.password && errors.password)} >
//               <InputLabel htmlFor="outlined-adornment-password-login" style={{fontSize:'12px'}}>Password</InputLabel>
//               <OutlinedInput
//                 id="outlined-adornment-password-login"
//                 type={showPassword ? 'text' : 'password'}
//                 value={values.password}
//                 name="password"
//                 style={{ height: '40px' }}
//                 onBlur={handleBlur}
//                 onChange={handleChange}
//                 endAdornment={
//                   <InputAdornment position="end">
//                     <IconButton
//                       aria-label="toggle password visibility"
//                       onClick={handleClickShowPassword}
//                       onMouseDown={handleMouseDownPassword}
//                       edge="end"
//                       size="large"
//                     >
//                       {showPassword ? <Visibility /> : <VisibilityOff />}
//                     </IconButton>
//                   </InputAdornment>
//                 }
//                 label="Password"
//                 inputProps={{}}
//               />
//               {touched.password && errors.password && (
//                 <FormHelperText error id="standard-weight-helper-text-password-login">
//                   {errors.password}
//                 </FormHelperText>
//               )}
//             </FormControl>
//             <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
//               <FormControlLabel
//                 control={
//                   <Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} name="checked" color="primary" />
//                 }
//                 label="Remember me"
//               />
//               <Typography variant="subtitle1" color="secondary" sx={{ textDecoration: 'none', cursor: 'pointer' }}>
//                 Forgot Password?
//               </Typography>
//             </Stack>
//             {errors.submit && (
//               <Box sx={{ mt: 3 }}>
//                 <FormHelperText error>{errors.submit}</FormHelperText>
//               </Box>
//             )}

//             <Box sx={{ mt: 2 }}>
//               <AnimateButton>
//                 <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" sx={{
//           transition: 'all .2s ease-in-out',
//           // background: theme.palette.secondary.light_icon,
//           color: theme.palette.secondary.dark,
//           '&[aria-controls="menu-list-grow"],&:hover': {
//             background: theme.palette.secondary.dark_icon_hover,
//             color: theme.palette.secondary.dark
//           },
//         borderRadius: `${customization.borderRadius}px`
//         }}>
//                   Sign in
//                 </Button>
//               </AnimateButton>
//             </Box>

//             <Grid item xs={12}>
//               <Box
//                 sx={{
//                   alignItems: 'center',
//                   display: 'flex'
//                 }}
//               >
//                 <Divider sx={{ flexGrow: 1 }} orientation="horizontal" />

//                 <Button
//                   variant="outlined"
//                   sx={{
//                     cursor: 'unset',
//                     m: 2,
//                     py: 0.4,
//                     px: 7,
//                     borderColor: `${theme.palette.grey[100]} !important`,
//                     color: `${theme.palette.grey[900]}!important`,
//                     fontWeight: 500,
//                     borderRadius: `${customization.borderRadius}px`
//                   }}
//                   disableRipple
//                   disabled
//                 >
//                   OR
//                 </Button>

//                 <Divider sx={{ flexGrow: 1 }} orientation="horizontal" />
//               </Box>
//             </Grid>
//             <Grid item xs={12}>
//               <AnimateButton>
//                 <Button
//                   disableElevation
//                   fullWidth
//                   onClick={googleHandler}
//                   size="large"
//                   variant="outlined"
//                   sx={{
//                     color: 'grey.700',
//                     backgroundColor: theme.palette.grey[50],
//                     borderColor: theme.palette.grey[100],
//                     borderRadius: `${customization.borderRadius}px`
//                   }}
//                 >
//                   <Box sx={{ mr: { xs: 1, sm: 2, width: 20 } }}>
//                     <img src={Google} alt="google" width={16} height={16} style={{ marginRight: matchDownSM ? 8 : 16 }} />
//                   </Box>
//                   Sign in with Google
//                 </Button>
//               </AnimateButton>
//             </Grid>
//           </form>
//         )}
//       </Formik>
//     </>
//   );
// };

// export default AuthLogin;

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
// third party
import * as Yup from 'yup';
import { Formik } from 'formik';
// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Google from 'assets/images/icons/social-google.svg';
// config
import config from '../../../../configration/config';
import {
  decodeToken,
  hasRole,
  hasPermission,
} from '../../../../store/permissionUtils';
import { setUser } from '../../../../store/actions/actions';

const AuthLogin = ({ ...others }) => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));
  const customization = useSelector((state) => state.customization);
  const [checked, setChecked] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const googleHandler = async () => {
    console.error('Login');
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleLogin = async (
    values,
    { setErrors, setStatus, setSubmitting },
  ) => {
    try {
      const response = await axios.post(`${config.API_URL}token/`, {
        email: values.email,
        password: values.password,
      });

      if (response.data.success) {
        const { access_token } = response.data.data; // Ensure to extract access_token from data

        // Ensure token is a string
        if (typeof access_token !== 'string') {
          console.error('Invalid token format:', access_token);
          throw new Error('Invalid token format');
        }

        const decodedToken = decodeToken(access_token);
        const user = {
          id: decodedToken.sub,
          name: decodedToken.name,
          email: decodedToken.email,
          roles: decodedToken.roles,
          permissions: decodedToken.roles.flatMap((role) => role.permissions),
        };

        localStorage.setItem('token', access_token);
        dispatch(setUser({ user }));

        toast.success('Login successful!');

        if (hasRole(user.roles, 'CEO')) {
          navigate('/kpi/kpi-managment');
        } else if (hasRole(user.roles, 'Admin')) {
          navigate('/Eod/Eod-act');
        } else {
          navigate('/');
        }
      } else {
        setStatus({ success: false });
        setErrors({ submit: response.data.message });
        setSubmitting(false);
      }
    } catch (error) {
      setStatus({ success: false });
      setErrors({ submit: error.message });
      setSubmitting(false);
    }
  };

  return (
    <>
      <Grid container direction="column" justifyContent="center" spacing={2}>
        <Grid
          item
          xs={12}
          container
          alignItems="center"
          justifyContent="center"
        >
          <Box sx={{ mb: 3 }}>
            {/* <Typography variant="subtitle1" style={{fontSize:'12px'}}>Sign in with Email address</Typography> */}
          </Box>
        </Grid>
      </Grid>

      <Formik
        initialValues={{
          email: '',
          password: '',
          submit: null,
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string()
            .max(255)
            .required('Email or ID is required'),
          password: Yup.string().max(255).required('Password is required'),
        })}
        onSubmit={handleLogin}
      >
        {({
          errors,
          handleBlur,
          handleChange,
          handleSubmit,
          isSubmitting,
          touched,
          values,
        }) => (
          <form noValidate onSubmit={handleSubmit} {...others}>
            <FormControl
              style={{ display: 'flex' }}
              error={Boolean(touched.email && errors.email)}
            >
              <InputLabel
                htmlFor="outlined-adornment-email-login"
                style={{ fontSize: '12px' }}
              >
                Email Address / Student ID / Teacher ID
              </InputLabel>
              <OutlinedInput
                id="outlined-adornment-email-login"
                type="email"
                value={values.email}
                sx={{ marginBottom: '16px' }}
                name="email"
                onBlur={handleBlur}
                onChange={handleChange}
                label="Email Address / Student ID"
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
                sx={{ marginBottom: '16px' }}
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
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
                inputProps={{}}
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
              justifyContent="space-between"
              spacing={1}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checked}
                    onChange={(event) => setChecked(event.target.checked)}
                    name="checked"
                    color="primary"
                  />
                }
                label="Remember me"
              />
              <Typography
                variant="subtitle1"
                color="secondary"
                sx={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                Forgot Password?
              </Typography>
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
                  disabled={isSubmitting}
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  sx={{
                    padding: 1.6,
                    transition: 'all .2s ease-in-out',
                    color: theme.palette.secondary.dark,
                    '&[aria-controls="menu-list-grow"],&:hover': {
                      background: theme.palette.secondary.dark_icon_hover,
                      color: theme.palette.secondary.dark,
                    },
                    borderRadius: `${customization.borderRadius}px`,
                  }}
                >
                  Sign in
                </Button>
              </AnimateButton>
            </Box>

            {/* <Grid item xs={12}>
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex'
                }}
              >
                <Divider sx={{ flexGrow: 1 }} orientation="horizontal" />

                <Button
                  variant="outlined"
                  sx={{
                    cursor: 'unset',
                    m: 2,
                    py: 0.4,
                    px: 7,
                    borderColor: `${theme.palette.grey[100]} !important`,
                    color: `${theme.palette.grey[900]}!important`,
                    fontWeight: 500,
                    borderRadius: `${customization.borderRadius}px`
                  }}
                  disableRipple
                  disabled
                >
                  OR
                </Button>

                <Divider sx={{ flexGrow: 1 }} orientation="horizontal" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <AnimateButton>
                <Button
                  disableElevation
                  fullWidth
                  onClick={googleHandler}
                  size="large"
                  variant="outlined"
                  sx={{
                    color: 'grey.700',
                    backgroundColor: theme.palette.grey[50],
                    borderColor: theme.palette.grey[100],
                    borderRadius: `${customization.borderRadius}px`
                  }}
                >
                  <Box sx={{ mr: { xs: 1, sm: 2, width: 20 } }}>
                    <img src={Google} alt="google" width={16} height={16} style={{ marginRight: matchDownSM ? 8 : 16 }} />
                  </Box>
                  Sign in with Google
                </Button>
              </AnimateButton>
            </Grid> */}
          </form>
        )}
      </Formik>
    </>
  );
};

export default AuthLogin;
