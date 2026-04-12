import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Pagination,
  Grid,
  TablePagination,
} from '@mui/material';
import { Delete, CheckCircle } from '@mui/icons-material';
import { format } from 'date-fns';
import plan from 'assets/images/svg/delatedPlanimg.svg';
import Iconify from 'ui-component/iconify';
import DrogaCard from 'ui-component/cards/DrogaCard';
import Search from 'ui-component/search';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';

export default function EmployeesRemovedPlanLog() {
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination((prev) => ({
      ...prev,
      per_page: parseInt(event.target.value, 10),
    }));
  };
  const handlefetchingDelatedLogs = async () => {
    try {
      const token = await GetToken();

      setLoading(true);

      const Api = `${Backend.api}${Backend.delatedLogs}?page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
      console.log('Api', Api);

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
      console.log('sd', result);

      if (response.status === 200) {
        setData(result.data?.data);
        console.log('data', result.data?.data);

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

  useEffect(() => {
    handlefetchingDelatedLogs();
  }, [pagination.page, pagination.per_page, search]);

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };
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
          <Typography variant="h4">Delated Plan Logs</Typography>
        </Grid>
      </Grid>
      <Grid container mt={2} spacing={2}>
        <Grid item xs={12} sm={12} md={5} lg={5} xl={12}>
          <Search
            value={search}
            onChange={(event) => handleSearchFieldChange(event)}
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
              severity="plan"
              title={`There is no delated plan`}
              description={`The list of delated plan will be listed here`}
              size={80}
              sx={{ marginY: 2 }}
            />
          ) : (
            <Box>
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                }}
              >
                {data.map((log) => (
                  <Box
                    key={log.id}
                    style={{
                      padding: '15px',
                      border: '1px solid #ddd',
                      background: '#f9f9f9',
                      borderRadius: '8px',
                    }}
                  >
                    <Box
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <Typography
                        variant="h6 "
                        sx={{ display: 'flex', fontWeight: 'bold' }}
                      >
                        {' '}
                        <Iconify
                          icon="line-md:account-delete"
                          style={{
                            marginRight: 8,
                            fontSize: 20,
                            color: '#FF5722',
                          }}
                        />
                        {log.employee}
                      </Typography>
                      {/* Replacing Badge with Image */}
                      <img
                        src={plan}
                        alt="Employee"
                        style={{
                          width: '65px', // Adjust the width
                          height: '65px', // Adjust the height
                          borderRadius: '50%', // For rounded image
                          objectFit: 'cover', // Keeps aspect ratio intact
                          marginLeft: 'auto', // Pushes it to the right
                        }}
                      />
                    </Box>

                    <Typography
                      style={{
                        fontSize: '14px',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Iconify
                        icon="line-md:briefcase-remove-twotone"
                        style={{
                          marginRight: 8,
                          fontSize: 20,
                          color: '#FF5722',
                        }}
                      />
                      Deleted by: {log.user}
                    </Typography>

                    <Typography
                      style={{
                        fontSize: '14px',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                      }}
                    >
                      <Delete
                        color="error"
                        fontSize="small"
                        sx={{ marginRight: 1 }}
                      />
                      {/* Check if log.deleted_at is a valid date */}
                      Deleted at:{' '}
                      {isNaN(new Date(log.created_at))
                        ? 'Invalid date'
                        : format(new Date(log.created_at), 'PPP p')}
                    </Typography>

                    {log.note && (
                      <Typography
                        style={{
                          fontSize: '14px',
                          marginTop: '4px',
                          display: 'flex',
                          color: '#666',
                        }}
                      >
                        <Iconify
                          icon="line-md:file-twotone"
                          style={{
                            marginRight: 11,
                            fontSize: 20,
                            color: '#FF5722',
                          }}
                        />
                        Note: {log.note}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>

              <Box
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '16px',
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
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </DrogaCard>
  );
}
