import React, { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  Grid,
  Select,
  Typography,
  useMediaQuery,
  useTheme,
  MenuItem,
} from '@mui/material';
import { gridSpacing } from 'store/constant';
import { WeeklyTasks } from './components/employee-dashboard/WeeklyTasks';
import { MyDay } from './components/employee-dashboard/MyDay';
import { toast } from 'react-toastify';
import { EmployeeKPILists } from './components/employee-dashboard/EmployeeKPILists';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import gardenImage from 'assets/images/sky-blue.jpg';
import PageContainer from 'ui-component/MainPage';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import OverallPerformance from './components/OverallPerformance';
import MonthlyTrends from 'views/performance/components/MonthlyTrends';
import ActivityTimeline from './components/ActivityTimeline';
import DashboardSelector from './dashboard-selector';
import { format } from 'date-fns';

const EmployeeDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const bigDevice = useMediaQuery(theme.breakpoints.up('sm'));
  const smallDevice = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'EEEE')); // Default to current day

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const handleFetchingEmployeeStats = async (reload) => {
    try {
      reload && setLoading(true);

      const token = await GetToken();
      const Api =
        Backend.api +
        Backend.employeeDashboard +
        `?fiscal_year_id=${selectedYear?.id}` +
        (selectedDay ? `&day=${selectedDay}` : '');
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      fetch(Api, {
        method: 'GET',
        headers: header,
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            setData(response.data);
            setError(false);
          } else {
            setError(true);
          }
        })
        .catch((error) => {
          setError(true);
          toast.error(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      toast.error(err.message);
      setError(true);
    }
  };

  const handleDayChange = (event) => {
    setSelectedDay(event.target.value);
  };

  useEffect(() => {
    handleFetchingEmployeeStats(true);
  }, [selectedYear?.id, selectedDay]);

  return (
    <>
      <PageContainer
        title={bigDevice ? 'Dashboard' : ' '}
        rightOption={<DashboardSelector />}
      >
        <Grid
          container
          spacing={gridSpacing}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          {bigDevice && (
            <Grid item xs={12} sm={12} md={8} lg={8} xl={8}>
              <Grid container spacing={gridSpacing}>
                <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
                  <EmployeeKPILists
                    isLoading={loading}
                    error={error}
                    KPIS={data?.employee_kpis || []}
                    navigate={navigate}
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
                  <WeeklyTasks
                    isLoading={loading}
                    error={error}
                    tasks={data?.weekly_tasks || []}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}

          {!smallDevice && (
            <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: { xs: '90dvh', sm: '90dvh', md: '78dvh' },
                  overflowY: 'auto',
                  backgroundColor: '#0006',
                  backgroundImage: `url(${gardenImage})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  borderRadius: { xs: 0, sm: 3 },
                  mt: { xs: -6, sm: 0 },
                  mb: 3,
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <MyDay
                    isLoading={loading}
                    error={error}
                    tasks={data?.my_day || []}
                    onRefresh={() => handleFetchingEmployeeStats(false)}
                    selectedDay={selectedDay}
                    onDayChange={setSelectedDay}
                  />
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>

        {!smallDevice && (
          <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
              <MonthlyTrends
                title="Monthly Trends"
                url={Backend.api + Backend.myMonthlyTrends}
                itshows="Performance"
              />
            </Grid>
          </Grid>
        )}

        {!smallDevice && (
          <Grid container spacing={gridSpacing}>
            <Grid item xs={12} sm={12} md={8}>
              <OverallPerformance />
            </Grid>

            {/* <ActivityTimeline sx={{ mt: 2 }} /> */}
          </Grid>
        )}
      </PageContainer>

      {smallDevice && (
        <Grid container>
          <Grid item xs={12}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '96dvh',
                overflowY: 'auto',
                backgroundColor: '#0006',
                backgroundImage: `url(${gardenImage})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                borderRadius: { xs: 0, sm: 3 },
                mt: { xs: -5.4, sm: 0 },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <MyDay
                  isLoading={loading}
                  error={error}
                  tasks={data?.my_day || []}
                  onRefresh={() => handleFetchingEmployeeStats(false)}
                  selectedDay={selectedDay}
                  onDayChange={setSelectedDay}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default EmployeeDashboard;
