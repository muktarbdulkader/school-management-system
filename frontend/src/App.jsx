import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Grid, StyledEngineProvider } from '@mui/material';
// defaultTheme
import themes from 'themes';

// project imports
import NavigationScroll from 'layout/NavigationScroll';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthContext } from 'context/AuthContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KPIProvider } from 'context/KPIProvider';
import { ToastContainer } from 'react-toastify';
import { Storage } from 'configration/storage';
import { SIGN_IN } from 'store/actions/actions';
import MainRoutes from 'routes/MainRoutes';
import LoginRoutes from 'routes/AuthenticationRoutes';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TargetProvider } from 'context/TargetContext';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { DashboardProvider } from 'context/DashboardContext';

// ==============================|| APP ||============================== //

const queryClient = new QueryClient();

const App = () => {
  const customization = useSelector((state) => state.customization);
  const signed = useSelector((state) => state.user.signed);
  const dispatch = useDispatch();
  const prevSigned = useRef(signed);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const authContext = useMemo(
    () => ({
      signin: () => {
        setIsSignedIn(true);
      },
      signOut: () => {
        setIsSignedIn(false);
      },
      isSignedIn,
    }),
    [isSignedIn],
  );

  const routes = useMemo(() => {
    return signed ? MainRoutes : LoginRoutes;
  }, [signed]);

  const router = createBrowserRouter([routes]);

  useEffect(() => {
    if (prevSigned.current === false && signed === true) {
      setIsReloading(true);
      // Navigate to root before reloading
      window.history.pushState({}, '', '/');
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
    prevSigned.current = signed;
  }, [signed]);

  useEffect(() => {
    const checkAuthentication = async () => {
      const ttl = Storage.getItem('tokenExpiration');
      const currentTime = new Date().getTime();

      if (currentTime > ttl) {
        dispatch({ type: SIGN_IN, signed: false });
        Storage.clear();
      }
    };

    checkAuthentication();
  }, []);

  if (isReloading) {
    return (
      <Grid container sx={{ height: '100dvh' }}>
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <ActivityIndicator size={24} color="primary" />
        </Grid>
      </Grid>
    );
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={themes(customization)}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AuthContext.Provider value={authContext}>
            <DashboardProvider>
              <KPIProvider>
                <TargetProvider>
                  <QueryClientProvider client={queryClient}>
                    <CssBaseline />
                    <NavigationScroll>
                      <RouterProvider router={router} />
                      <ToastContainer />
                    </NavigationScroll>
                  </QueryClientProvider>
                </TargetProvider>
              </KPIProvider>
            </DashboardProvider>
          </AuthContext.Provider>
        </LocalizationProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
