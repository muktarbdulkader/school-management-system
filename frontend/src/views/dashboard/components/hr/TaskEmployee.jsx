import * as React from 'react';
import { Grid, styled, useTheme } from '@mui/material';
import { EmployeeTabs } from 'data/employee/tabs';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import TabPanel from 'ui-component/tabs/TabPanel';

import Backend from 'services/backend';
import TaskEmployeReport from './TaskEmployeReport';

export default function TaskEmployee({ id }) {
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
      <TaskEmployeReport hideHeadSection={true} id={id} />
    </Box>
  );
}
