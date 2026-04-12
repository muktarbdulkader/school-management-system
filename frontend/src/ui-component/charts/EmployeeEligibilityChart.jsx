import React from 'react';
import PropTypes from 'prop-types';
import Chart from 'react-apexcharts';
import { Card, CardContent, Typography, useTheme } from '@mui/material';

const EmployeeEligibilityChart = ({ eligible, non_eligible }) => {
  const theme = useTheme();

  // Chart data and options
  const chartOptions = {
    chart: {
      type: 'donut'
    },
    labels: ['Eligible', 'Non-Eligible'],
    colors: [theme.palette.warning.dark, theme.palette.error.main],
    legend: {
      position: 'bottom',
      labels: {
        colors: theme.palette.text.secondary
      }
    },
    dataLabels: {
      style: {
        colors: [theme.palette.text.secondary]
      }
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            width: '100%'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  };

  const chartSeries = [eligible, non_eligible];

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 3, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" align="center" gutterBottom>
          Employee Eligibility Status
        </Typography>
        <Chart options={chartOptions} series={chartSeries} type="donut" />
      </CardContent>
    </Card>
  );
};

EmployeeEligibilityChart.propTypes = {
  eligible: PropTypes.number.isRequired,
  non_eligible: PropTypes.number.isRequired
};

export default EmployeeEligibilityChart;
