import * as React from 'react';
import { Grid, styled, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { UnitTabs } from 'data/units/tabs';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabPanel from 'ui-component/tabs/TabPanel';
import UnitPlans from './UnitPlans';
import AboutUnit from './AboutUnit';
import UnitEmployees from './UnitEmployees';
import UnitPerformanceReport from 'views/Report/components/UnitPerformanceReport';
import Backend from 'services/backend';
import MonthlyTrends from 'views/performance/components/MonthlyTrends';
// import UintTaskReport from './UnitTasks';
// import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
// import ErrorPrompt from 'utils/components/ErrorPrompt';
import GetToken from 'utils/auth-token';

const AntTabs = styled(Tabs)({
  borderBottom: '1px solid #e8e8e8',
  '& .MuiTabs-indicator': {
    backgroundColor: '#1890ff',
  },
});

const AntTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: 'none',
    minWidth: 0,
    [theme.breakpoints.up('sm')]: {
      minWidth: 0,
    },
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(1),
    color: 'rgba(0, 0, 0, 0.85)',
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    '&:hover': {
      color: 'text.primary',
      opacity: 1,
    },
    '&.Mui-selected': {
      color: theme.palette.primary[800],
      fontWeight: theme.typography.fontWeightMedium,
    },
    '&.Mui-focusVisible': {
      backgroundColor: '#d1eaff',
    },
  }),
);

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

export default function UnitTabComponent({ id }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [value, setValue] = React.useState(0);
  const [unitData, setUnitData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // React.useEffect(() => {
  //   if (!id) {
  //     navigate(-1);
  //   }
  // }, [id]);

  // const handleFetchingUnitData = async (employeeId) => {
  //   setLoading(true);
  //   const token = await GetToken();
  //   const Api = Backend.api + Backend.getEmployeeTarget + employeeId;
  //   const header = {
  //     Authorization: `Bearer ${token}`,
  //     accept: 'application/json',
  //     'Content-Type': 'application/json',
  //   };

  //   fetch(Api, {
  //     method: 'GET',
  //     headers: header,
  //   })
  //     .then((response) => response.json())
  //     .then((response) => {
  //       if (response.success) {
  //         setUnitData(response.data[0]);
  //         setError(false);
  //       } else {
  //         toast.warning(response.data.message);
  //         setError(true);
  //       }
  //     })
  //     .catch((error) => {
  //       toast.warning(error.message);
  //       setError(true);
  //     })
  //     .finally(() => {
  //       setLoading(false);
  //     });
  // };

  // React.useEffect(() => {
  //   if (id) {
  //     handleFetchingUnitData(id);
  //   } else {
  //     navigate(-1);
  //   }
  // }, [id, navigate]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box>
        <AntTabs
          value={value}
          onChange={handleChange}
          aria-label="Unit tabs"
          theme={theme}
        >
          {UnitTabs.map((tab, index) => (
            <AntTab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              {...a11yProps(index)}
            />
          ))}
        </AntTabs>
      </Box>

      {/* <TabPanel value={value} index={0} dir={theme.direction}>
        {unitData && (
          <UintTaskReport id={id} manager_id={unitData.manager_id} />
        )}
      </TabPanel> */}

      <TabPanel value={value} index={0} dir={theme.direction}>
        <UnitPlans id={id} />
      </TabPanel>

      <TabPanel value={value} index={1} dir={theme.direction}>
        <UnitEmployees id={id} />
      </TabPanel>

      <TabPanel value={value} index={2} dir={theme.direction}>
        <UnitPerformanceReport id={id} />

        <Grid
          container
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Grid item xs={12} sx={{ my: 2 }}>
            <MonthlyTrends
              title="Monthly Trends"
              url={Backend.api + Backend.unitMonthlyTrends + id}
              itshows="Performance"
            />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={3} dir={theme.direction}>
        <AboutUnit id={id} />
      </TabPanel>
    </Box>
  );
}
