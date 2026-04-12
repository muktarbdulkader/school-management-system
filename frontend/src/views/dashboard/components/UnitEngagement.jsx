import React, { useEffect, useState } from 'react';
import { Box, Grid, TablePagination, Typography, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import SelectorMenu from 'ui-component/menu/SelectorMenu';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Fallbacks from 'utils/components/Fallbacks';
import { useNavigate } from 'react-router-dom';

const typeOptions = [
  { label: 'Units', value: 'units' },
  { label: 'Employees', value: 'employees' }
];
const filterOptions = [
  { label: 'Not Planned', value: 'planned' },
  { label: 'Not Monitored', value: 'monitored' },
  { label: 'Not Evaluated', value: 'evaluated' }
];

const UnitEngagement = () => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState({
    type: 'units',
    filter_by: 'planned'
  });

  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 5,
    total: 0
  });

  const handleFiltering = (event) => {
    const { value, name } = event.target;
    setFilter({ ...filter, [name]: value });
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleGettingUnitEngagement = async (reload) => {
    try {
      reload && setLoading(true);
      const token = await GetToken();

      const unitApi =
        Backend.api +
        Backend.notEngagedUnits +
        `?fiscal_year_id=${selectedYear?.id}&filter_by=${filter.filter_by}&page=${pagination.page + 1}&per_page=${pagination.per_page}`;
      const employeesApi =
        Backend.api +
        Backend.notEngagedEmployees +
        `?fiscal_year_id=${selectedYear?.id}&filter_by=${filter.filter_by}&page=${pagination.page + 1}&per_page=${pagination.per_page}`;

      const Api = filter.type === 'employees' ? employeesApi : unitApi;
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
            setData(response.data?.data);
            setPagination({ ...pagination, total: response.data?.total });
          }
        })
        .catch((error) => {
          toast.error(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    handleGettingUnitEngagement(true);
  }, [selectedYear?.id, filter.filter_by, filter.type, pagination.page, pagination.per_page]);

  return (
    <Grid item xs={12} sm={12} md={6} lg={8} xl={8}>
      <DrogaCard>
        <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h4" color="text.primary">
              List of
              <Typography
                component="span"
                variant="h4"
                color="text.primary"
                sx={{ backgroundColor: 'yellow', padding: '2px 4px', borderRadius: '4px' }}
              >
                {filter.type}
              </Typography>
              not
              <Typography
                component="span"
                variant="h4"
                color="text.primary"
                sx={{ backgroundColor: 'yellow', padding: '2px 4px', borderRadius: '4px' }}
              >
                {filter.filter_by}
              </Typography>
              yet
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <SelectorMenu name="type" options={typeOptions} selected={filter.type} handleSelection={handleFiltering} />
            <SelectorMenu name="filter_by" options={filterOptions} selected={filter.filter_by} handleSelection={handleFiltering} />
          </Grid>
        </Grid>

        <Grid container>
          <Grid item xs={12}>
            {loading ? (
              <Grid container>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                  <ActivityIndicator size={18} sx={{ mt: 4 }} />
                </Grid>
              </Grid>
            ) : data.length === 0 ? (
              <Fallbacks
                severity="planing"
                title=""
                description={`There is no record of ${filter.type} not ${filter.filter_by}`}
                sx={{ paddingY: 4 }}
                size={100}
              />
            ) : (
              <>
                {filter.type === 'units' &&
                  data.map((unit, index) => (
                    <Box
                      key={index}
                      onClick={() => navigate('/units/view', { state: unit })}
                      sx={{
                        borderBottom: 0.4,
                        borderBottomStyle: 'dashed',
                        my: 1,
                        p: 1,
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        ':hover': { backgroundColor: theme.palette.grey[100] },
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-out'
                      }}
                    >
                      <Typography variant="subtitle1">{unit?.name}</Typography>
                      <Typography variant="subtitle2">{unit?.unit_type}</Typography>
                    </Box>
                  ))}

                {filter.type === 'employees' &&
                  data.map((employee, index) => (
                    <Box
                      key={index}
                      onClick={() => navigate('/employees/view', { state: employee })}
                      sx={{
                        borderBottom: 0.4,
                        borderBottomStyle: 'dashed',
                        my: 1,
                        p: 1,
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        ':hover': { backgroundColor: theme.palette.grey[100] },
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-out'
                      }}
                    >
                      <Typography variant="subtitle1">{employee?.name}</Typography>
                      <Typography variant="subtitle2">{employee?.unit}</Typography>
                    </Box>
                  ))}

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
              </>
            )}
          </Grid>
        </Grid>
      </DrogaCard>
    </Grid>
  );
};

export default UnitEngagement;
