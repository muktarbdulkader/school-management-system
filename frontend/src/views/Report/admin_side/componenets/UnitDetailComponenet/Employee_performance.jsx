import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Typography,
  Grid,
  Box,
  Card,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import Search from 'ui-component/search';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import Fallbacks from 'utils/components/Fallbacks';

const UnitEmployeeTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState('quarter1');
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);
  const location = useLocation();
  const unitId = location.state?.unitId;

  const theme = useTheme();

  const handleFetchingPerformance = async () => {
    if (selectedYear && unitId) {
      setLoading(true);
      const token = await GetToken();
      const url = Backend.api + Backend.unitEmployeeEndpoint + `${unitId}?fiscal_year_id=${selectedYear?.id}`;

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      };

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: header
        });

        const data = await response.json();
        console.log(data);

        if (data.success) {
          const employeeData = data.data.map((employee) => ({
            id: employee.id,
            name: employee.name,
            performance: employee.performance || []
          }));
          setData(employeeData);
        } else {
          setData([]);
          toast.warning(data.message);
        }
      } catch (error) {
        setData([]);
        toast.warning(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    handleFetchingPerformance();
  }, [selectedYear, unitId]);

  const getPerformanceForQuarter = (performance, quarter) => {
    const quarterData = performance.find((p) => p[quarter]);
    return quarterData ? quarterData[quarter].overall : 0;
  };

  return (
    <Card>
      <CardContent>
        <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.grey[300], marginY: 3 }} />

        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h3" sx={{ mt: 0, color: 'grey.500' }}>
              Employee Performance List
            </Typography>
          </Grid>
        </Grid>
        <Grid container justifyContent="space-between">
          <Grid item sx={{ mt: 2 }}>
            <Search />
          </Grid>
          <Grid item>
            <Box mt={2} mb={0} textAlign="right">
              <FormControl variant="outlined">
                <InputLabel id="unit-select-label">Select</InputLabel>

                <Select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} label="Select Quarter">
                  {['quarter1', 'quarter2', 'quarter3', 'quarter4'].map((quarter) => (
                    <MenuItem key={quarter} value={quarter}>
                      {`Q${quarter.replace('quarter', '')}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>

        <Box mt={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Employee Name', 'Overall Performance'].map((header) => (
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
                    <TableCell colSpan={2}>
                      <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={22} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Box sx={{ paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Fallbacks severity="info" title="No Data" description="No employee performance records found" />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((record) => (
                    <TableRow
                      key={record.id}
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 2,
                        '&:nth-of-type(odd)': {
                          backgroundColor: theme.palette.grey[50]
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.grey[100],
                          cursor: 'pointer'
                        }
                      }}
                    >
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{record.name}</TableCell>
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>
                        {getPerformanceForQuarter(record.performance, selectedQuarter)}
                      </TableCell>
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

export default UnitEmployeeTable;
