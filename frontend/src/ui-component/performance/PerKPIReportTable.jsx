import React from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Fallbacks from 'utils/components/Fallbacks';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const PerKPIReportTable = ({ isLoading, performance }) => {
  const theme = useTheme();

  return (
    <TableContainer component={Paper} sx={{ marginTop: 2, padding: 2 }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
          <ActivityIndicator size={20} />
        </Box>
      ) : performance.length === 0 ? (
        <Fallbacks
          severity="performance"
          title="Report is not ready"
          description="Per KPI performances report is not ready"
          sx={{ paddingTop: 2, my: 4 }}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
              <TableCell>
                <Typography variant="h5">KPI Name</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h5">Target</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h5">Actual</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h5">Performance</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {performance.map((kpi, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Typography variant="subtitle1">{kpi.name}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body1">{kpi.target}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body1">{kpi.actual_value}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: 3, backgroundColor: kpi?.color, mr: 1 }}></Box>

                    <Typography variant="subtitle1" color="text.primary">
                      {parseFloat(kpi.kpi_performance).toFixed(1)}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
};

export default PerKPIReportTable;
