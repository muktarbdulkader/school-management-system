import { Box, TablePagination, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { EmployeeKPI } from '../employee-dashboard/EmployeeKPI';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export const YourKPIList = () => {
  const navigate = useNavigate();
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);

  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 5,
    total: 0
  });

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleFetchingEmployeeStats = async (reload) => {
    try {
      reload && setLoading(true);

      const token = await GetToken();
      const Api =
        Backend.api +
        Backend.managerKPIS +
        `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}`;
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
            setError(true);
          }
        })
        .catch((error) => {
          setError(true);
          toast.error(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      toast.error(err.message);
      setError(true);
    }
  };

  useEffect(() => {
    handleFetchingEmployeeStats(true);
  }, [selectedYear?.id, pagination?.page, pagination?.per_page]);
  return (
    <DrogaCard>
      <Typography variant="h4" color="text.primary" mb={1.4}>
        Your KPI's
      </Typography>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8
          }}
        >
          <ActivityIndicator size={20} />
        </Box>
      ) : error ? (
        <ErrorPrompt title="Server Error" message="There is error with fetching your kpi" size={80} />
      ) : data.length === 0 ? (
        <Fallbacks severity="kpis" title="" description="KPI are not found" sx={{ paddingTop: 6 }} size={80} />
      ) : (
        <>
          {data.map((kpi, index) => (
            <EmployeeKPI
              key={index}
              kpi_name={kpi.name}
              kpi_perspective={kpi?.perspective}
              weight={kpi.weight}
              onPress={() => navigate('/planning/view', { state: { ...kpi, can_distribute: false } })}
            />
          ))}

          {!loading && (
            <TablePagination
              component="div"
              rowsPerPageOptions={[]}
              count={pagination.total}
              rowsPerPage={pagination.per_page}
              page={pagination.page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Per page"
            />
          )}
        </>
      )}
    </DrogaCard>
  );
};
