import * as React from 'react';
import { Grid, styled, useTheme } from '@mui/material';
import { EmployeeTabs } from 'data/employee/tabs';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import TabPanel from 'ui-component/tabs/TabPanel';
import EmployeeTaskReport from './EmployeeTaskReport';
import EmployeePerformanceReport from 'views/Report/components/EmployeePerformanceReport';
import EmployeeProfile from './EmployeeProfile';
import EmployeePlans from './EmployeePlans';
import MonthlyTrends from 'views/performance/components/MonthlyTrends';
import Backend from 'services/backend';

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

export default function EmployeeTabComponent({ id }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    if (!id) {
      navigate(-1);
    }
  }, [id]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box>
        <AntTabs
          value={value}
          onChange={handleChange}
          aria-label="Employee tabs"
          theme={theme}
        >
          {EmployeeTabs.map((tab, index) => (
            <AntTab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              {...a11yProps(index)}
              color="text.primary"
            />
          ))}
        </AntTabs>
      </Box>

      <TabPanel value={value} index={0} dir={theme.direction}>
        <EmployeeTaskReport hideHeadSection={true} id={id} />
      </TabPanel>

      <TabPanel value={value} index={1} dir={theme.direction}>
        <EmployeePlans id={id} />
      </TabPanel>

      <TabPanel value={value} index={2} dir={theme.direction}>
        <EmployeePerformanceReport id={id} />

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
              url={Backend.api + Backend.employeeMonthlyTrends + id}
              itshows="Performance"
            />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={3} dir={theme.direction}>
        <EmployeeProfile id={id} />
      </TabPanel>
    </Box>
  );
}
