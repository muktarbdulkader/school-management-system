import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  TablePagination,
  FormControl,
  Select,
  MenuItem,
  Card,
  CircularProgress,
} from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import Search from 'ui-component/search';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';

import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';

import myGif from '../../assets/video/gifChart.gif';
import { format } from 'date-fns';

import EmployeeMonitoringTable from './componenets/EmployeeMonitoringTable';
import ManagersMonitoringTable from './componenets/ManagersMonitoringTable';

import FilterMonth from 'ui-component/FilterMonth';

const MonitoringReport = () => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selection, setSelection] = useState('units');
  const [activeStatus, setActiveStatus] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Not Started');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });

  const [exporting, setExporting] = useState(false);

  const theme = useTheme();
  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page on search
  };

  const handleGettingMonitoringReportCount = async () => {
    try {
      // Ensure selectedMonth is not null and format it
      const monthName = selectedMonth
        ? format(selectedMonth, 'MMMM')
        : format(new Date(), 'MMMM');

      const apiUrl = `${Backend.api}${Backend.monitoringStatusCount}?fiscal_year_id=${selectedYear?.id}&month=${monthName}`;

      const token = await GetToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, { method: 'GET', headers });
      const result = await response.json();

      if (response.ok) {
        setStatuses(result.data);
      } else {
        console.error('Error fetching status counts:', result?.message);
      }
    } catch (err) {
      console.error('Error fetching status counts:', err?.message || err);
    }
  };

  const handleDownloadingExcel = (excelLink) => {
    const link = document.createElement('a');
    link.href = excelLink;
    link.setAttribute('download', 'planning_status.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportingExcel = async () => {
    try {
      setExporting(true);
      const token = await GetToken();

      const employees = `${Backend.api}${Backend.exportPlanningStatus}?fiscal_year_id=${selectedYear?.id}&filter=${filter}&search=${search}`;
      const units = `${Backend.api}${Backend.exportUnitPlanningStatus}?fiscal_year_id=${selectedYear?.id}&filter=${filter}&search=${search}`;

      const Api = selection === 'employees' ? employees : units;

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, {
        method: 'POST',
        headers,
      });

      const result = await response.json();

      if (response.status === 200) {
        handleDownloadingExcel(result?.data);
      } else {
        toast.info(result?.message);
      }
    } catch (err) {
      toast.error(err?.message);
    } finally {
      setExporting(false);
    }
  };

  //  ========== PAGINATION ========START=======
  const handleGettingData = async () => {
    try {
      const token = await GetToken();
      setLoading(true);

      // Get the month name
      const monthName = selectedMonth
        ? format(selectedMonth, 'MMMM')
        : format(new Date(), 'MMMM');

      const employees = `${Backend.api}${Backend.employeeMonitoringList}?fiscal_year_id=${selectedYear?.id}&month=${monthName}&page=${pagination.page + 1}&per_page=${pagination.per_page}&filter=${filter}&search=${search}`;
      const units = `${Backend.api}${Backend.unitMonitoringList}?fiscal_year_id=${selectedYear?.id}&month=${monthName}&page=${pagination.page + 1}&per_page=${pagination.per_page}&filter=${filter}&search=${search}`;

      const Api = selection === 'employees' ? employees : units;

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (response.status === 200) {
        setData(result.data?.data);
        setPagination((prev) => ({ ...prev, total: result.data?.total }));
        setError(false);
      } else {
        setError(true);
        toast.error(result?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(true);
      toast.error(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGettingData();
  }, [
    pagination.page,
    pagination.per_page,
    selection,
    filter,
    selectedMonth,
    selectedYear?.id,
    debouncedSearch,
  ]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [search]);

  useEffect(() => {
    setLoading(true);
    handleGettingMonitoringReportCount();
    setTimeout(() => setLoading(false), 500);
  }, [selectedMonth]);

  const handlePageChange = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({
      ...pagination,
      per_page: parseInt(event.target.value, 10),
      page: 0,
    });
  };

  const handleChange = (event) => {
    setSelection(event.target.value);
    setSearch(''); // Clear search when changing selection
    setPagination({ ...pagination, page: 0 }); // Reset to first page
  };
  //  ========== PAGINATION ========END=======
  const renderTrending = (
    <Box
      sx={{
        top: 10,
        gap: 0.5,
        right: 16,
        display: 'flex',
        position: 'absolute',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          typography: 'h6',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <img
          src={myGif}
          alt="Animated Icon"
          width="35"
          height="35"
          style={{ marginRight: 10, borderRadius: '0' }}
        />
      </Box>
    </Box>
  );

  return (
    <DrogaCard sx={{ mt: 3, pb: 0, minHeight: '400px' }}>
      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Header Section */}
        <Grid item xs={12}>
          <Typography variant="h4">Monitoring Reports</Typography>
        </Grid>

        {statuses && (
          <Grid container item xs={12} spacing={2} sx={{ mt: 1 }}>
            {[
              {
                category: 'employees',
                title: 'Employee Monitoring Status',
                stats: [
                  { label: 'Total', key: 'total' },
                  { label: 'Completed', key: 'completed' },
                ],
              },
              {
                category: 'employees',
                title: 'Employee Monitoring Status',
                stats: [
                  { label: 'In Progress', key: 'in_progress' },
                  { label: 'Not Started', key: 'not_started' },
                ],
              },
              {
                category: 'units',
                title: 'Unit Monitoring Status',
                stats: [
                  { label: 'Total', key: 'total' },
                  { label: 'Completed', key: 'completed' },
                ],
              },
              {
                category: 'units',
                title: 'Unit Monitoring Status',
                stats: [
                  { label: 'In Progress', key: 'in_progress' },
                  { label: 'Not Started', key: 'not_started' },
                ],
              },
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={3} lg={3} xl={3} key={index}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    px: 1,
                    borderRadius: 3,
                    transition: 'background-color 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      backgroundColor: '#05417a',
                      boxShadow: '0 4px 15px #054077',
                    },
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: 2,
                    flexDirection: 'column',
                    position: 'relative',
                    backgroundColor: '#003b73',
                    color: 'white',
                    textAlign: 'center',
                    width: 280,
                    height: 170,
                  }}
                  title={item.title}
                  onClick={() => setActiveStatus(item.category)}
                >
                  {/* Status Circles */}
                  <Box
                    sx={{
                      typography: 'h6',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        mr: 1,
                      }}
                    />
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        mr: 1,
                      }}
                    />
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        mr: 1,
                      }}
                    />
                  </Box>

                  {/* Status Card */}
                  <Card
                    sx={{
                      border: `solid 1px ${theme.palette.divider}`,
                      p: 0.5,
                      boxShadow: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      backgroundColor: 'common.white',
                      mt: 2,
                      cursor: 'pointer',
                    }}
                  >
                    {renderTrending}
                    <Box
                      sx={{
                        flexGrow: 1,
                        minWidth: 260,
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box sx={{ typography: 'h6' }}>{item.title}</Box>

                      <Grid container sx={{ mt: 1 }}>
                        {item.stats.map((stat, idx) => (
                          <Grid item xs={5} key={idx}>
                            <Box
                              sx={{
                                typography: 'subtitle2',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              {stat.label} -{' '}
                              {loading ? (
                                <CircularProgress size={12} sx={{ ml: 0.5 }} />
                              ) : (
                                <Typography
                                  sx={{
                                    typography: 'caption',
                                    fontWeight: 'bold',
                                    ml: 0.5,
                                  }}
                                >
                                  {statuses[item.category]?.[stat.key]}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Grid>

      <Grid container mt={2} spacing={2}>
        <Grid item xs={12} sm={12} md={5} lg={5} xl={5}>
          <Search
            value={search}
            onChange={(event) => handleSearchFieldChange(event)}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={12}
          md={7}
          lg={7}
          xl={7}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <FormControl sx={{ minWidth: '120px', mr: 2 }}>
            <Select
              value={selection}
              onChange={handleChange}
              sx={{
                boxShadow: 'none',
                border: 'none',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                backgroundColor: '#fafafa',
              }}
            >
              <MenuItem value="units">Unit</MenuItem>
              <MenuItem value="employees">Employee</MenuItem>
            </Select>
          </FormControl>
          <Box>
            <FilterMonth
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </Box>
          <Grid item xs={12} md={0.2} sx={{ mt: 2 }}></Grid>
        </Grid>
      </Grid>

      <Grid container mt={1} spacing={1}>
        <Grid item xs={12}>
          {loading ? (
            <Grid container>
              <Grid
                item
                xs={12}
                sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
              >
                <ActivityIndicator size={20} />
              </Grid>
            </Grid>
          ) : error ? (
            <ErrorPrompt
              title="There is an issue getting data"
              message="It might get fixed by refreshing the page"
              size={80}
            />
          ) : data && data.length > 0 ? (
            selection === 'employees' ? (
              <EmployeeMonitoringTable
                data={data}
                selectedMonth={
                  selectedMonth
                    ? format(selectedMonth, 'MMMM')
                    : format(new Date(), 'MMMM')
                }
              />
            ) : (
              <ManagersMonitoringTable
                data={data}
                selectedMonth={
                  selectedMonth
                    ? format(selectedMonth, 'MMMM')
                    : format(new Date(), 'MMMM')
                }
              />
            )
          ) : (
            <Fallbacks
              severity={selection}
              title={`There is no ${selection} found`}
              description={`The list of ${selection} will be listed here`}
              size={80}
              sx={{ marginY: 2 }}
            />
          )}
        </Grid>

        {!loading && data?.length > 0 && (
          <Grid
            item
            xs={12}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <TablePagination
              component="div"
              rowsPerPageOptions={[10, 25, 50, 100]} // Removed extra brackets
              count={pagination.total}
              rowsPerPage={pagination.per_page}
              page={pagination.page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Grid>
        )}
      </Grid>
    </DrogaCard>
  );
};

export default MonitoringReport;
