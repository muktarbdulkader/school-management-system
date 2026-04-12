import { Badge, Box, TablePagination, Typography, useTheme } from '@mui/material';
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
import TaskListComponent from './TaskListComponent';

export const ApprovalTaskPanel = () => {
  const theme = useTheme();
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

  const handleFetchingApprovalTasks = async () => {
    try {
      setLoading(true);

      const token = await GetToken();
      const Api = Backend.api + Backend.getPendingWeeklyTask + `?fiscal_year_id=${selectedYear?.id}`;
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
    handleFetchingApprovalTasks(true);
  }, [selectedYear?.id]);

  return (
    <DrogaCard>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.4 }}>
        <Typography variant="h4">Pending Approval Tasks</Typography>
        {data && <Badge color="error" badgeContent={data.length} sx={{ mr: 2 }} />}
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
        <ErrorPrompt title="Server Error" message="There is error with fetching approval task" size={100} />
      ) : data.length === 0 ? (
        <Fallbacks severity="tasks" title="" description="No pending approval tasks" sx={{ paddingTop: 6 }} size={100} />
      ) : (
        <>
          {data.map((task, index) => (
            <TaskListComponent
              key={index}
              kpiName={task?.employee?.user?.name}
              title={task.title}
              created_at={task?.date}
              sub_task_count={task?.sub_task_count}
              hoverColor={theme.palette.grey[50]}
              onPress={() => navigate('/my-team/member/tasks', { state: { ...task, id: task.employee_id } })}
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
