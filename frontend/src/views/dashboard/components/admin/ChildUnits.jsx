import { Box, Chip, IconButton, TablePagination, Typography, useTheme } from '@mui/material';
import React, { useEffect, useState } from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ChildUnitComponent from './ChildUnitComponent';
import ChildEmployees from './ChildEmployees';
import { IconBuilding, IconUsersGroup } from '@tabler/icons-react';

const ChildUnits = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [tab, setTab] = useState('units');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);

  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 5,
    total: 0
  });

  const handleTabChange = (value) => {
    setTab(value);
    value !== tab && handleGettingChilds(value);
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleGettingChilds = async (selectedChild) => {
    try {
      setLoading(true);

      const token = await GetToken();
      const units =
        Backend.api +
        Backend.getChildUnits +
        `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}`;
      const employees =
        Backend.api +
        Backend.getChildEmployees +
        `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}`;

      const Api = selectedChild === 'employees' ? employees : units;
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
    handleGettingChilds(tab);
  }, [selectedYear?.id, pagination.page, pagination.per_page]);
  return (
    <DrogaCard>
      <Typography variant="h4" mb={1.4}>
        Child Unit and Employees
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        {[
          { value: 'units', icon: <IconBuilding size="1.2rem" stroke="1.6" /> },
          { value: 'employees', icon: <IconUsersGroup size="1.2rem" stroke="1.6" /> }
        ].map((item, index) => (
          <IconButton
            key={index}
            title={item.value}
            sx={{
              width: 40,
              height: 40,
              marginLeft: index > 0 && 2,
              cursor: 'pointer',
              textTransform: 'capitalize',
              padding: 0,
              backgroundColor: tab === item.value && theme.palette.grey[100]
            }}
            color="primary"
            variant={tab === item.value ? 'filled' : 'outlined'}
            onClick={() => handleTabChange(item.value)}
          >
            {item.icon}
          </IconButton>
        ))}
      </Box>

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
        <ErrorPrompt title="Server Error" message="There is error with fetching your childs" size={80} />
      ) : data.length === 0 ? (
        <Fallbacks severity="childs" title="" description="There is no child units" sx={{ paddingTop: 6 }} size={80} />
      ) : (
        <>
          {tab === 'units' &&
            data.map((unit, index) => (
              <ChildUnitComponent
                key={index}
                name={unit.name}
                manager={unit?.manager?.user?.name}
                planningStatus={unit?.plan_status}
                hoverColor={theme.palette.grey[50]}
                onPress={() => navigate('/units/view', { state: { ...unit } })}
              />
            ))}

          {tab === 'employees' &&
            data.map((employee, index) => (
              <ChildEmployees
                key={index}
                name={employee?.user?.name}
                position={employee?.job_position?.name}
                employeeID={employee.user?.username}
                planningStatus={employee?.plan_status}
                hoverColor={theme.palette.grey[50]}
                onPress={() => navigate('/employees/view', { state: { ...employee } })}
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

export default ChildUnits;
