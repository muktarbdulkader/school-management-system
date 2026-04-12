import { useEffect, useState } from 'react';
import { Box, Button, Grid, TablePagination, Typography } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';
import EodReportTable from './components/EodReportTable';
import EodDetailModal from './components/EodDetailModal';

const ViewEodReports = () => {
  const { state } = useLocation();
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });

  const [eodDetail, setEodDetail] = useState({
    openModal: false,
    selected: null,
  });

  const handleViewingDetail = (report) => {
    setEodDetail((prev) => ({
      ...prev,
      openModal: true,
      selected: report,
    }));
  };

  const handleCloseDetailModal = () => {
    setEodDetail((prev) => ({
      ...prev,
      openModal: false,
      selected: null,
    }));
  };

  const handleFetchingEodReports = async (dontReload = false) => {
    if (!state?.employee_id) {
      setError('Employee ID is missing');
      setLoading(false);
      return;
    }

    !dontReload && setLoading(true);
    setError(null);

    try {
      const token = await GetToken();

      let Api = `${Backend.api}${Backend.getEodByEmployee}${state?.employee_id}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}`;

      if (state?.from) Api += `&from=${state.from}`;
      if (state?.to) Api += `&to=${state.to}`;

      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch EOD reports');
      }

      if (result.success) {
        // Adjust this based on your actual API response structure
        const reportsData = result.data?.data || result.data || [];
        setData(Array.isArray(reportsData) ? reportsData : []);
        setPagination((prev) => ({
          ...prev,
          total: result.total || result.data?.total || 0,
        }));
      } else {
        throw new Error(result.data?.message || 'No data returned');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({
      ...pagination,
      per_page: parseInt(event.target.value, 10),
      page: 0,
    });
  };

  useEffect(() => {
    handleFetchingEodReports();
  }, [
    selectedYear?.id,
    state?.employee_id,
    pagination.page,
    pagination.per_page,
  ]);

  return (
    <PageContainer
      back={true}
      title={`EOD Reports - ${state?.name || 'Employee'}`}
      rightOption={
        <Box sx={{ mr: 4, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" color="text.primary">
            Employee: {state?.name || 'Unknown'}
          </Typography>
          {state?.from && state?.to && (
            <Typography variant="body2" color="text.secondary">
              Date Range: {state.from} to {state.to}
            </Typography>
          )}
        </Box>
      }
    >
      <Grid container>
        <Grid item xs={12} sx={{ padding: 2 }}>
          {loading ? (
            <Grid container justifyContent="center" alignItems="center" p={4}>
              <ActivityIndicator size={20} />
            </Grid>
          ) : error ? (
            <ErrorPrompt
              title="Error Loading Reports"
              message={error}
              action={
                <Button
                  variant="contained"
                  onClick={() => handleFetchingEodReports()}
                >
                  Retry
                </Button>
              }
            />
          ) : data.length === 0 ? (
            <Fallbacks
              severity="info"
              title="No Reports Available"
              description="No EOD reports found for this employee and time period"
            />
          ) : (
            <>
              <EodReportTable
                reports={data}
                onViewDetail={handleViewingDetail}
              />
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
            </>
          )}
        </Grid>
      </Grid>

      <EodDetailModal
        open={eodDetail.openModal}
        report={eodDetail.selected}
        onClose={handleCloseDetailModal}
      />

      <ToastContainer />
    </PageContainer>
  );
};

export default ViewEodReports;
