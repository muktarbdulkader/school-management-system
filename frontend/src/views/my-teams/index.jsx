import { useEffect, useState } from 'react';
import { Grid, TablePagination } from '@mui/material';
import Search from 'ui-component/search';
import { useDispatch, useSelector } from 'react-redux';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { toast, ToastContainer } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';
import TeamListTable from './components/TeamListTable';
import { CheckForPendingTasks } from 'utils/check-for-pending-tasks';

const MyTeam = () => {
  const [mounted, setMounted] = useState(false);
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const dispatch = useDispatch();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleGettingMyTeam = async () => {
    setLoading(true);
    const token = await GetToken();

    let Api =
      Backend.api +
      Backend.myTeams +
      `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}`;

    if (from) {
      Api += `&from=${from}`;
    }
    if (to) {
      Api += `&to=${to}`;
    }

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
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };
  const handleDateChange = (newStartDate, newEndDate) => {
    setFrom(newStartDate);
    setTo(newEndDate);

    if (newStartDate && newEndDate) {
      handleGettingMyTeam();
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleGettingMyTeam();
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [from, to]);

  useEffect(() => {
    if (mounted) {
      handleGettingMyTeam();
      CheckForPendingTasks(dispatch, selectedYear?.id);
    } else {
      setMounted(true);
    }
  }, [selectedYear, pagination.page, pagination.per_page]);

  return (
    <PageContainer
      back={false}
      title="My Teams"
      searchField={
        <Search
          value={search}
          onChange={(event) => handleSearchFieldChange(event)}
        />
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
              message={`Unable to retrieve your teams `}
            />
          ) : data.length === 0 ? (
            <Fallbacks
              severity="my-teams"
              title={`Your team list are not found`}
              description={`The list of your team will be listed here`}
              sx={{ paddingTop: 6 }}
            />
          ) : (
            <TeamListTable
              teamList={data}
              onDateChange={handleDateChange}
              from={from}
              to={to}
            />
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
              labelRowsPerPage="Per page"
            />
          )}
        </Grid>
      </Grid>
      <ToastContainer />
    </PageContainer>
  );
};

MyTeam.propTypes = {};

export default MyTeam;
