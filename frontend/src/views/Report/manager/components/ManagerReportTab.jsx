import * as React from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import TabPanel from 'ui-component/tabs/TabPanel';
import { managerReportTabs } from 'data/report';
import { AntTabs } from 'ui-component/tabs/AntTabs';
import { AntTab } from 'ui-component/tabs/AntTab';
import { a11yProps } from 'utils/function';
import ManagerPerfomanceReport from './ManagerPerfomanceReport';
import ManagerUnitPerformance from './ManagerUnitPerformance';

export default function ManagerReportTab() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box>
        <AntTabs
          value={value}
          onChange={handleChange}
          aria-label="Manager tabs"
          theme={theme}
        >
          {managerReportTabs.map((tab, index) => (
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

      <TabPanel value={value} index={0} dir={theme.direction}>
        <>
          <ManagerUnitPerformance />
        </>
      </TabPanel>

      <TabPanel value={value} index={1} dir={theme.direction}>
        <ManagerPerfomanceReport />
      </TabPanel>
    </Box>
  );
}
