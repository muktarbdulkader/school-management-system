import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  Typography,
  Grid,
  Box,
  Card,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Select,
  MenuItem,
  Paper,
  CardContent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import Fallbacks from 'utils/components/Fallbacks';
import Search from 'ui-component/search';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const KpiTable = () => {
  const [kpiData, setKpiData] = useState({});
  const [quarters, setQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('quarter1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const theme = useTheme();
  const location = useLocation();
  const unitId = location.state?.unitId;
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const handleFetchingKpis = async () => {
    if (!selectedYear || !unitId) {
      toast.error('Please select a unit and fiscal year');
      setLoading(false);
      return;
    }

    try {
      const token = await GetToken();
      const Api = `${Backend.api}${Backend.unitPerformance}${unitId}?fiscal_year_id=${selectedYear.id}`;
      const headers = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      };

      const response = await fetch(Api, {
        method: 'GET',
        headers
      });

      const data = await response.json();

      if (data.success) {
        const performanceData = data.data.performance.reduce((acc, item) => {
          const key = Object.keys(item)[0];
          acc[key] = item[key];
          return acc;
        }, {});

        setKpiData(performanceData);
        setQuarters(Object.keys(performanceData));
        setLoading(false);
      } else {
        toast.error(data.message || 'Failed to fetch KPI data');
        setLoading(false);
        setError(true);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchingKpis();
  }, [unitId, selectedYear]);

  const getQuarterData = (quarter) => {
    return kpiData[quarter] || {};
  };

  const getKpiRows = () => {
    const quarterData = getQuarterData(selectedQuarter);
    return quarterData.per_kpi || [];
  };

  const getOverallPerformance = () => {
    return getQuarterData(selectedQuarter).overall || 'N/A';
  };

  return (
    <Card>
      <CardContent>
        <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.grey[300], marginY: 3 }} />

        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h3" sx={{ mt: 0, color: 'grey.500' }}>
              KPI List
            </Typography>
          </Grid>
        </Grid>

        <Grid container justifyContent="space-between">
          <Grid item sx={{ mt: 2 }}>
            <Search />
          </Grid>
          <Grid item>
            <Box mt={1} mb={2}>
              <Select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                displayEmpty
                fullWidth
                label="Select Quarter"
              >
                {['quarter1', 'quarter2', 'quarter3', 'quarter4'].map((quarter) => (
                  <MenuItem key={quarter} value={quarter}>
                    {`Q${quarter.replace('quarter', '')}`}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Grid>
        </Grid>

        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {['KPI Name', 'Weight', 'KPI Performance', 'Overall Performance'].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        background: theme.palette.grey[100],
                        color: '#000',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        borderBottom: `2px solid ${theme.palette.divider}`,
                        position: 'relative',
                        padding: '12px 16px',
                        '&:not(:last-of-type)': {
                          borderRight: `1px solid ${theme.palette.divider}`
                        }
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={22} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Fallbacks severity="error" title="Server error" description="Failed to fetch KPI data" />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : getKpiRows().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Box sx={{ paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Fallbacks severity="info" title="No Data" description="No KPI records found for this quarter" />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  getKpiRows().map((kpi, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 2,
                        '&:nth-of-type(odd)': {
                          backgroundColor: theme.palette.grey[50]
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.grey[100]
                        }
                      }}
                    >
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{kpi.name}</TableCell>
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{kpi.weight}</TableCell>
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{kpi.kpi_performance}</TableCell>
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{getOverallPerformance()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default KpiTable;
