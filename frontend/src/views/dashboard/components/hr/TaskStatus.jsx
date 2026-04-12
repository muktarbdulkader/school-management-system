import { useEffect, useState } from 'react';
import { Grid, Typography, Box, TablePagination } from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import Search from 'ui-component/search';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { IconDownload } from '@tabler/icons-react';
import StatusCount from './StatusCount';
import { format } from 'date-fns';
import EmployeeTaskTable from './EmployeeTaskTable';
import ManagersTaskTable from './ManagersTaskTable';
import FilterDateRange from 'views/todo/components/FilterDateRange';
import ManagersNoTaskTable from './ManagersNoTaskTable';
import EmployeeNoTaskTable from './EmployeeNoTaskTable';
// const StatusLabels = [
//   { name: 'Not Started', color: '#fcba03' },
//   { name: 'In Progress', color: '#0390fc' },
//   { name: 'Completed', color: '#04c233' },
// ];

const TaskStatus = () => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const [selection, setSelection] = useState('employees');
  const [activeStatus, setActiveStatus] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState(null);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Not Started');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [exporting, setExporting] = useState(false);

  // const handleChange = (event) => {
  //   setSelection(event.target.value);
  // };

  // const handleFiltering = (event) => {
  //   setFilter(event.target.value);
  // };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleGettingTaskStatusCount = async () => {
    try {
      const dateParams =
        startDate && endDate
          ? `&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`
          : '';

      const apiUrl = `${Backend.api}${Backend.taskStatusCount}?fiscal_year_id=${selectedYear?.id}${dateParams}`;

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

      const payload = {
        fiscal_year_id: selectedYear?.id,
        filter: filter,
        search: search,
      };

      if (startDate && endDate) {
        payload.start_date = format(startDate, 'yyyy-MM-dd');
        payload.end_date = format(endDate, 'yyyy-MM-dd');
      }

      let apiEndpoint;
      switch (selection) {
        case 'employees':
          apiEndpoint = Backend.exportEmployeesTaskStatus;
          break;
        case 'employeesNoTask':
          apiEndpoint = Backend.exportEmployeesHasNoStatus;
          break;
        case 'managers':
          apiEndpoint = Backend.exportManagersTaskStatus;
          break;
        case 'managerNoTask':
          apiEndpoint = Backend.exportManagersHasNoStatus;
          break;
        case 'units':
          apiEndpoint = Backend.exportUnitPlanningStatus;
          break;
        default:
          toast.info('Invalid export selection');
          return;
      }

      // Generate the export file
      const response = await fetch(`${Backend.api}${apiEndpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate export');
      }

      const { data: fileUrl } = await response.json();

      // Create temporary download link
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', '');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  //  ========== PAGINATION ========START=======

  const handleStatusClick = async (statusType = selection) => {
    try {
      const token = await GetToken();
      setLoading(true);

      let apiUrl = '';
      if (statusType === 'employees') {
        apiUrl = `${Backend.api}${Backend.employeeTaskList}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
      } else if (statusType === 'managers') {
        apiUrl = `${Backend.api}${Backend.managerTaskList}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
      } else if (statusType === 'employeesNoTask') {
        apiUrl = `${Backend.api}${Backend.employeeNoTaskList}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
      } else if (statusType === 'managerNoTask') {
        apiUrl = `${Backend.api}${Backend.managerNoTaskList}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
      } else {
        apiUrl = `${Backend.api}${Backend.employeeTaskList}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
      }
      if (statusType && startDate && endDate) {
        apiUrl += `&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, { method: 'GET', headers });

      const result = await response.json();

      if (response.ok) {
        setData(result.data?.data);
        setPagination((prev) => ({ ...prev, total: result.data?.total }));
      } else {
        toast.info(result?.message || 'Unexpected response');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (startDate && endDate) {
  //     handleStatusClick(selection);
  //   }
  // }, [startDate, endDate, selection]);

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination((prev) => ({
      ...prev,
      per_page: parseInt(event.target.value, 10),
    }));
  };

  //  ========== PAGINATION ========END=======

  useEffect(() => {
    handleGettingTaskStatusCount();
  }, [startDate, endDate]);

  useEffect(() => {
    handleStatusClick(selection);
  }, [
    pagination.page,
    pagination.per_page,
    selection,
    filter,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleStatusClick();
    }, 600);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

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
          <Typography variant="h4">Task Status</Typography>
        </Grid>

        {statuses && (
          <Grid container item xs={12} spacing={2} sx={{ mt: 1 }}>
            {/* Employees Has Task */}
            <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 0.4,
                  px: 1,
                  borderRadius: 2,
                  backgroundColor:
                    activeStatus === 'employees' ? '#e4c6f3' : '#f5deff',
                  boxShadow:
                    activeStatus === 'employees'
                      ? '0 0 8px 4px rgba(65, 43, 43, 0.7)'
                      : 'none',
                  transform:
                    activeStatus === 'employees' ? 'scale(1.08)' : 'scale(1)',
                  transition:
                    'background-color 0.3s, box-shadow 0.3s, transform 0.3s',
                  '&:hover': {
                    backgroundColor: '#f3e9c6',
                    boxShadow: '0 0 8px 4px rgba(245, 222, 255, 0.7)',
                    transform:
                      activeStatus === 'employees'
                        ? 'scale(1.05)'
                        : 'scale(1.03)',
                  },
                  cursor: 'pointer',
                }}
                title="Employees has task"
                onClick={() => {
                  const newSelection = 'employees';
                  setActiveStatus(newSelection);
                  setSelection(newSelection);
                  handleStatusClick(newSelection);
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#ffff',
                    mr: 1,
                  }}
                />
                <StatusCount
                  title="Employees"
                  total={statuses?.employees_has_task}
                  subtitle="has task"
                  sx={{ ml: 2, cursor: 'pointer' }}
                  onClick={() => {
                    const newSelection = 'employees';
                    setActiveStatus(newSelection);
                    setSelection(newSelection);
                    handleStatusClick(newSelection);
                  }}
                />
              </Box>
            </Grid>

            {/* Manager Has Task */}
            <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 0.4,
                  px: 1,
                  borderRadius: 2,
                  backgroundColor:
                    activeStatus === 'managers'
                      ? 'rgba(252, 186, 3, 0.8)'
                      : 'rgba(252, 186, 3, 0.5)',
                  boxShadow:
                    activeStatus === 'managers'
                      ? '0 0 8px 4px rgba(71, 62, 37, 0.5)'
                      : 'none',
                  transform:
                    activeStatus === 'managers' ? 'scale(1.08)' : 'scale(1)',
                  transition:
                    'background-color 0.3s, box-shadow 0.3s, transform 0.3s',
                  '&:hover': {
                    backgroundColor: 'rgba(252, 186, 3, 0.8)',
                    boxShadow: '0 0 8px 4px rgba(252, 186, 3, 0.5)',
                    transform:
                      activeStatus === 'managers'
                        ? 'scale(1.05)'
                        : 'scale(1.03)',
                  },
                  cursor: 'pointer',
                }}
                title="Manager has task"
                onClick={() => {
                  const newSelection = 'managers';
                  setActiveStatus(newSelection);
                  setSelection(newSelection);
                  handleStatusClick(newSelection);
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#ffff',
                    mr: 1,
                  }}
                />
                <StatusCount
                  title="Managers"
                  total={statuses?.managers_has_task}
                  subtitle="has task"
                  sx={{ ml: 2, cursor: 'pointer' }}
                  onClick={() => {
                    const newSelection = 'managers';
                    setActiveStatus(newSelection);
                    setSelection(newSelection);
                    handleStatusClick(newSelection);
                  }}
                />
              </Box>
            </Grid>

            {/* Employees Has No Task */}
            <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 0.4,
                  px: 1,
                  borderRadius: 2,
                  backgroundColor:
                    activeStatus === 'employeesNoTask'
                      ? 'rgba(3, 144, 252, 0.8)'
                      : 'rgba(3, 144, 252, 0.5)',
                  boxShadow:
                    activeStatus === 'employeesNoTask'
                      ? '0 0 8px 4px rgba(71, 62, 37, 0.5)'
                      : 'none',
                  transform:
                    activeStatus === 'employeesNoTask'
                      ? 'scale(1.08)'
                      : 'scale(1)',
                  transition:
                    'background-color 0.3s, box-shadow 0.3s, transform 0.3s',
                  '&:hover': {
                    backgroundColor: 'rgba(3, 144, 252, 0.8)',
                    boxShadow: '0 4px 15px rgba(3, 144, 252, 0.6)',
                    transform:
                      activeStatus === 'employeesNoTask'
                        ? 'scale(1.05)'
                        : 'scale(1.03)',
                  },
                  cursor: 'pointer',
                }}
                title="Employees has no task"
                onClick={() => {
                  const newSelection = 'employeesNoTask';
                  setActiveStatus(newSelection);
                  setSelection(newSelection);
                  handleStatusClick(newSelection);
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#ffff',
                    mr: 1,
                  }}
                />
                <StatusCount
                  title="Employees"
                  total={statuses?.employees_has_no_task}
                  subtitle="has no task"
                  sx={{ ml: 2, cursor: 'pointer' }}
                  onClick={() => {
                    const newSelection = 'employeesNoTask';
                    setActiveStatus(newSelection);
                    setSelection(newSelection);
                    handleStatusClick(newSelection);
                  }}
                />
              </Box>
            </Grid>

            {/* Completed */}
            <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 0.4,
                  px: 1,
                  borderRadius: 2,
                  backgroundColor:
                    activeStatus === 'managerNoTask'
                      ? 'rgba(4, 194, 51, 0.8)'
                      : 'rgba(4, 194, 51, 0.5)',
                  boxShadow:
                    activeStatus === 'managerNoTask'
                      ? '0 4px 15px rgba(33, 44, 36, 0.6)'
                      : 'none',
                  transform:
                    activeStatus === 'managerNoTask'
                      ? 'scale(1.08)'
                      : 'scale(1)',
                  transition:
                    'background-color 0.3s, box-shadow 0.3s, transform 0.3s',
                  '&:hover': {
                    backgroundColor: 'rgba(4, 194, 51, 0.8)',
                    boxShadow: '0 4px 15px rgba(4, 194, 51, 0.6)',
                    transform:
                      activeStatus === 'managerNoTask'
                        ? 'scale(1.05)'
                        : 'scale(1.03)',
                  },
                  cursor: 'pointer',
                }}
                title="Managers"
                onClick={() => {
                  const newSelection = 'managerNoTask';
                  setActiveStatus(newSelection);
                  setSelection(newSelection);
                  handleStatusClick(newSelection);
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#ffff',
                    mr: 1,
                  }}
                />
                <StatusCount
                  title="Managers"
                  total={statuses?.managers_has_no_task}
                  subtitle="has no task"
                  sx={{ ml: 2, cursor: 'pointer' }}
                  onClick={() => {
                    const newSelection = 'managerNoTask';
                    setActiveStatus(newSelection);
                    setSelection(newSelection);
                    handleStatusClick(newSelection);
                  }}
                />
              </Box>
            </Grid>
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
          <Box>
            <FilterDateRange
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </Box>
          <Grid item xs={12} md={0.2} sx={{ mt: 2 }}></Grid>

          <DrogaButton
            type="button"
            icon={<IconDownload size="1rem" style={{ paddingRight: 3 }} />}
            title="Export Excel"
            variant="contained"
            color="primary"
            fullWidth
            onPress={() => handleExportingExcel()}
            disabled={exporting}
          />
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
              title="There is issue getting data"
              message="It might get fixed by refreshing the page"
              size={80}
            />
          ) : data.length === 0 ? (
            <Fallbacks
              severity={selection}
              title={`There is no ${selection} found`}
              description={`The list of ${selection}  will be listed here`}
              size={80}
              sx={{ marginY: 2 }}
            />
          ) : selection === 'employees' ? (
            <EmployeeTaskTable data={data} />
          ) : selection === 'employeesNoTask' ? (
            <EmployeeNoTaskTable data={data} />
          ) : selection === 'managerNoTask' ? (
            <ManagersNoTaskTable data={data} />
          ) : selection === 'managers' ? (
            <ManagersTaskTable data={data} />
          ) : (
            <Fallbacks
              severity={selection}
              title={`There is no ${selection} found`}
              description={`The list of ${selection}  will be listed here`}
              size={80}
              sx={{ marginY: 2 }}
            />
          )}
        </Grid>

        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {!loading && (
            <TablePagination
              rowsPerPageOptions={[]}
              component="div"
              count={pagination.total}
              rowsPerPage={pagination.per_page}
              page={pagination.page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

export default TaskStatus;
