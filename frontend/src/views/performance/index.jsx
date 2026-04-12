import React, { useEffect, useState } from 'react';
import { Box, Grid, TablePagination, useTheme } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';
import Search from 'ui-component/search';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import UnitPerformanceList from './components/UnitPerformanceList';
import GetFiscalYear from 'utils/components/GetFiscalYear';
import EmployeePerformanceList from './components/EmployeePerformanceList';
import { AntTabs } from 'ui-component/tabs/AntTabs';
import { AntTab } from 'ui-component/tabs/AntTab';
import { a11yProps } from 'utils/function';
import TabPanel from 'ui-component/tabs/TabPanel';

const tabsArray = [{ label: 'units' }, { label: 'employees' }];

const Performance = () => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);
  const theme = useTheme();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0
  });

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [performance, setPerformance] = useState([]);

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleFetchingUnits = async (value) => {
    if (selectedYear) {
      setLoading(true);
      const token = await GetToken();
      const units =
        Backend.api +
        Backend.getChildUnits +
        `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
      const employee =
        Backend.api +
        Backend.getChildEmployees +
        `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
      const Api = value ? employee : units;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      };

      fetch(Api, {
        method: 'GET',
        headers: header
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            setData(response.data.data);
            setPagination({ ...pagination, total: response.data.total });
            setError(false);
          } else {
            // toast.warning(response.data.message);
          }
        })
        .catch((error) => {
          // toast.error(error.message);
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      <GetFiscalYear />;
    }
  };

  const handleViewPerformance = (selected) => {
    if (selected?.id === selectedUnit) {
      setSelectedUnit(null);
    } else {
      setSelectedUnit(selected?.id);
      handleFetchingPerformance(selected?.id);
    }
  };

  const handleFetchingPerformance = async (selectedID) => {
    setIsLoading(true);
    const token = await GetToken();
    const units = Backend.api + Backend.unitPerformance + `${selectedID}?fiscal_year_id=${selectedYear?.id}`;
    const employee = Backend.api + Backend.employeePerformance + `${selectedID}?fiscal_year_id=${selectedYear?.id}`;
    const Api = value ? employee : units;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    fetch(Api, {
      method: 'GET',
      headers: header
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setPerformance(response.data.performance);
        } else {
          setPerformance([]);
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        setPerformance([]);
        toast.warning(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (mounted) {
      selectedUnit && handleFetchingPerformance(selectedUnit);
    } else {
      setMounted(true);
    }
  }, [selectedYear]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingUnits(value);
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  useEffect(() => {
    if (mounted) {
      handleFetchingUnits(value);
    } else {
      setMounted(true);
    }
  }, [selectedYear, pagination.page, pagination.per_page, value]);
  return (
    <PageContainer title="Performances" searchField={<Search value={search} onChange={(event) => handleSearchFieldChange(event)} />}>
      <Grid container>
        <Grid item xs={12} sx={{ padding: 2 }}>
          <AntTabs value={value} onChange={handleChange} aria-label="Employee tabs" theme={theme}>
            {tabsArray.map((tab, index) => (
              <AntTab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                {...a11yProps(index)}
                color="text.primary"
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </AntTabs>

          <TabPanel value={value} index={0} dir={theme.direction}>
            {loading ? (
              <Grid container>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                  <ActivityIndicator size={20} />
                </Grid>
              </Grid>
            ) : error ? (
              <ErrorPrompt title="Server Error" message={`Unable to retrieve ${tabsArray[value].label} performance `} />
            ) : data.length === 0 ? (
              <Fallbacks
                severity="units"
                title={`${tabsArray[value].label} are not found`}
                description={`The list of ${tabsArray[value].label} performance will be listed here`}
                sx={{ paddingTop: 6 }}
              />
            ) : (
              <UnitPerformanceList
                units={data}
                onView={(unit) => handleViewPerformance(unit)}
                selected={selectedUnit}
                isLoading={isLoading}
                performance={performance}
              />
            )}
          </TabPanel>

          <TabPanel value={value} index={1} dir={theme.direction}>
            {loading ? (
              <Grid container>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                  <ActivityIndicator size={20} />
                </Grid>
              </Grid>
            ) : error ? (
              <ErrorPrompt title="Server Error" message={`Unable to retrieve ${tabsArray[value].label} performance `} />
            ) : data.length === 0 ? (
              <Fallbacks
                severity="units"
                title={`${tabsArray[value].label} are not found`}
                description={`The list of ${tabsArray[value].label} performance will be listed here`}
                sx={{ paddingTop: 6 }}
              />
            ) : (
              <EmployeePerformanceList
                employees={data}
                onView={(unit) => handleViewPerformance(unit)}
                selected={selectedUnit}
                isLoading={isLoading}
                performance={performance}
              />
            )}
          </TabPanel>
        </Grid>
      </Grid>

      {!loading && data.length > 0 && (
        <TablePagination
          component="div"
          rowsPerPageOptions={[10, 25, 50, 100]}
          count={pagination.total}
          rowsPerPage={pagination.per_page}
          page={pagination.page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
      <ToastContainer />
    </PageContainer>
  );
};

export default Performance;
