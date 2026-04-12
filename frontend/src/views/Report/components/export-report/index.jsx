import React from 'react';
import PropTypes from 'prop-types';
import DrogaReportModal from 'ui-component/modal/DrogaReportModal';
import { Grid, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { a11yProps } from 'utils/function';
import { exportingTabs } from 'data/report';
import TabPanel from 'ui-component/tabs/TabPanel';
import Backend from 'services/backend';
import GenerateReportForm from './forms/GenerateReportForm';
import IsEmployee from 'utils/is-employee';

const ExportReport = ({ open, handleClose }) => {
  const theme = useTheme();
  const smallDevice = useMediaQuery(theme.breakpoints.down('md'));
  const [value, setValue] = React.useState(0);

  const isEmployee = IsEmployee();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <DrogaReportModal
      open={open}
      title="Generate Report"
      handleClose={handleClose}
      onCancel={handleClose}
      hideActionButtons={true}
      sx={{ height: '66dvh' }}
    >
      <Grid
        container
        spacing={1}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          borderTop: 1,
          borderColor: 'divider',
          mt: 1,
        }}
      >
        <Grid
          item
          xs={12}
          sm={12}
          md={2.8}
          pt={1}
          sx={{
            backgroundColor: theme.palette.grey[50],
            height: !smallDevice && '58dvh',
          }}
        >
          <Tabs
            orientation={smallDevice ? 'horizontal' : 'vertical'}
            variant="scrollable"
            value={value}
            onChange={handleChange}
            aria-label="Generate Report Modal"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.800',
              },
            }}
          >
            {exportingTabs.map((tab, index) => (
              <Tab
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                {...a11yProps(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'start',
                  padding: '16px 10px ',
                  minHeight: '32px',
                  '&.Mui-selected': {
                    backgroundColor: 'grey.100',
                    color: 'primary.800',
                  },
                }}
              />
            ))}
          </Tabs>
        </Grid>
        <Grid item xs={12} sm={12} md={9}>
          <TabPanel value={value} index={0}>
            <GenerateReportForm
              month={false}
              endpoint={
                isEmployee ? Backend.exportMyPlans : Backend.exportPlans
              }
            />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <GenerateReportForm
              month={true}
              endpoint={
                isEmployee
                  ? Backend.exportMyMonitoring
                  : Backend.exportMonitoring
              }
            />
          </TabPanel>

          <TabPanel value={value} index={2}>
            <GenerateReportForm
              month={false}
              endpoint={
                isEmployee
                  ? Backend.exportMyPerformance
                  : Backend.exportPerformance
              }
            />
          </TabPanel>
        </Grid>
      </Grid>
    </DrogaReportModal>
  );
};

ExportReport.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
};

export default ExportReport;
