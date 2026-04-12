import React, { useEffect, useState } from 'react';
import { Box, Chip, Grid, TablePagination } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';

import Search from 'ui-component/search';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import GetFiscalYear from 'utils/components/GetFiscalYear';
import UnitTable from './components/UnitTable';
import EmployeeTable from './components/EmployeeTable';

const Revision = () => {
  const [mounted, setMounted] = useState(false);
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('employees');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });

  const handleTabChange = (value) => {
    setTab(value);
    value !== tab && handleFetchingUnits(value);
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
        `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}`;
      const employee =
        Backend.api +
        Backend.getActiveChildEmployees +
        `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}`;
      const Api = value == 'employees' ? employee : units;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      fetch(Api, {
        method: 'GET',
        headers: header,
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
          toast.error(error.message);
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      <GetFiscalYear />;
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingUnits(tab);
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  useEffect(() => {
    if (mounted) {
      handleFetchingUnits(tab);
    } else {
      setMounted(true);
    }
  }, [selectedYear, pagination.page, pagination.per_page]);

  return (
    <PageContainer
      back={false}
      title="Revision"
      searchField={
        <Search
          value={search}
          onChange={(event) => handleSearchFieldChange(event)}
        />
      }
      rightOption={
        <Box sx={{ display: 'flex', alignItems: 'center', marginY: 1 }}>
          {['employees', 'units'].map((item, index) => (
            <Chip
              key={index}
              label={item}
              sx={{
                marginLeft: index > 0 && 2,
                cursor: 'pointer',
                textTransform: 'capitalize',
                paddingX: 2,
                paddingY: 0.4,
              }}
              color="primary"
              variant={tab === item ? 'filled' : 'outlined'}
              onClick={() => handleTabChange(item)}
            />
          ))}
        </Box>
      }
    >
      <Grid container>
        <Grid item xs={12} sx={{ padding: 2 }}>
          {loading ? (
            <Grid container>
              <Grid
                item
                xs={12}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                <ActivityIndicator size={20} />
              </Grid>
            </Grid>
          ) : error ? (
            <ErrorPrompt
              title="Server Error"
              message={`Unable to retrieve ${tab} `}
            />
          ) : data.length === 0 ? (
            <Fallbacks
              severity="evaluation"
              title={`${tab} are not found`}
              description={`The list of ${tab} will be listed here`}
              sx={{ paddingTop: 6 }}
            />
          ) : tab === 'employees' ? (
            <EmployeeTable employees={data} />
          ) : (
            <UnitTable units={data} />
          )}

          {!loading && pagination.total > pagination.per_page && (
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
        </Grid>
      </Grid>

      <ToastContainer />
    </PageContainer>
  );
};

export default Revision;
