import * as React from 'react';
import { Tabs, Tab, Box, useTheme } from '@mui/material';
import PropTypes from 'prop-types';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

export default function TaskDetailTabs({ overview, subtasks, remarks }) {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Tabs
        sx={{ position: 'sticky' }}
        value={value}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="inherit"
        variant="fullWidth"
        aria-label="full width tabs example"
      >
        <Tab label="Overview" {...a11yProps(0)} />
        <Tab label="Subtasks" {...a11yProps(1)} />
        <Tab label="Remarks" {...a11yProps(2)} />
      </Tabs>

      <TabPanel value={value} index={0} dir={theme.direction}>
        {overview}
      </TabPanel>
      <TabPanel value={value} index={1} dir={theme.direction}>
        {subtasks}
      </TabPanel>
      <TabPanel value={value} index={2} dir={theme.direction}>
        {remarks}
      </TabPanel>
    </Box>
  );
}
