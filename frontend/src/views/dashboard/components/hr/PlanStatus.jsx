import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  FormControl,
  MenuItem,
  Select,
  Box,
  TablePagination,
} from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import Search from 'ui-component/search';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import EmployeePlanTable from './EmployeePlanTable';
import UnitPlanTable from './UnitPlanTable';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { IconDownload } from '@tabler/icons-react';

const StatusLabels = [
  { name: 'Not Started', color: '#fcba03' },
  { name: 'In Progress', color: '#0390fc' },
  { name: 'Completed', color: '#04c233' },
];

const PlanStatus = () => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const [selection, setSelection] = useState('units');

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

  const [exporting, setExporting] = useState(false);

  const handleChange = (event) => {
    setSelection(event.target.value);
  };

  const handleFiltering = (event) => {
    setFilter(event.target.value);
  };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleGettingPlanStatus = async () => {
    try {
      const token = await GetToken();

      const Api = `${Backend.api}${Backend.planningByStatus}?fiscal_year_id=${selectedYear?.id}`;

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
        setStatuses(result.data);
      } else {
        toast.info(result?.message);
      }
    } catch (err) {
      toast.error(err?.message);
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

  const handleGettingData = async () => {
    try {
      const token = await GetToken();

      setLoading(true);

      const employees = `${Backend.api}${Backend.employeePlans}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}&filter=${filter}&search=${search}`;
      const units = `${Backend.api}${Backend.unitPlans}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}&filter=${filter}&search=${search}`;
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
        setError(false);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  //  ========== PAGINATION ========START=======

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
    handleGettingPlanStatus();
  }, []);

  useEffect(() => {
    if (mounted) {
      handleGettingData();
    } else {
      setMounted(true);
    }
  }, [pagination.page, pagination.per_page, selection, filter]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleGettingData();
    }, 600);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  return (
    <DrogaCard sx={{ mt: 3, pb: 0, minHeight: '400px' }}>
      <Grid
        container
        spacing={1}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
          <Typography variant="h4">Planning Status</Typography>
          {selection && statuses && statuses[selection] && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mr: 2,
                  p: 0.4,
                  px: 1,
                  borderRadius: 2,
                  backgroundColor: '#f5deff',
                }}
                title="Total"
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#a802f5',
                    mr: 1,
                  }}
                />
                <Typography variant="h4">
                  {statuses[selection]?.total}
                </Typography>
              </Box>

              <Box
                sx={{ display: 'flex', alignItems: 'center', mx: 1.2 }}
                title="Not Started"
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#fcba03',
                    mr: 1,
                  }}
                />
                <Typography variant="h4">
                  {statuses[selection]?.not_started}
                </Typography>
              </Box>

              <Box
                sx={{ display: 'flex', alignItems: 'center', mx: 1.2 }}
                title="In Progress"
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#0390fc',
                    mr: 1,
                  }}
                />
                <Typography variant="h4">
                  {statuses[selection]?.in_progress}
                </Typography>
              </Box>

              <Box
                sx={{ display: 'flex', alignItems: 'center', mx: 1.2 }}
                title="Completed"
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#04c233',
                    mr: 1,
                  }}
                />
                <Typography variant="h4">
                  {statuses[selection]?.completed}
                </Typography>
              </Box>
            </Box>
          )}
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          md={6}
          lg={6}
          xl={6}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
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

          <FormControl sx={{ minWidth: '120px' }}>
            <Select
              value={filter}
              onChange={handleFiltering}
              renderValue={(selected) => {
                const selectedStatus = StatusLabels.find(
                  (status) => status.name === selected,
                );
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: selectedStatus?.color || 'transparent',
                        mr: 1,
                      }}
                    />
                    <Typography variant="subtitle1">
                      {selectedStatus?.name}
                    </Typography>
                  </Box>
                );
              }}
              sx={{
                boxShadow: 'none',
                border: 'none',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                backgroundColor: '#fafafa',
              }}
            >
              {StatusLabels.map((status) => (
                <MenuItem
                  key={status.name}
                  value={status.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.2,
                    py: 0.6,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: status.color,
                      mr: 1,
                    }}
                  />
                  <Typography variant="subtitle1">{status.name}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
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
            <EmployeePlanTable data={data} />
          ) : (
            <UnitPlanTable data={data} />
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

export default PlanStatus;
