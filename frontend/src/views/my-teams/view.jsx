import { useEffect, useState } from 'react';
import { Box, Grid, TablePagination, Typography } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';
import TeamMemberTasks from './components/TeamMemberTasks';
import TaskDetailModal from './components/TaskDetailModal';
import { CheckForPendingTasks } from 'utils/check-for-pending-tasks';

const ViewTeamMemberTasks = () => {
  const { state } = useLocation();
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });

  const [taskDetail, setTaskDetail] = useState({
    openModal: false,
    selected: null,
  });

  const handleViewingDetail = (task) => {
    setTaskDetail((prevTask) => ({
      ...prevTask,
      openModal: true,
      selected: task,
    }));
  };

  const handleCloseDetailModal = () => {
    setTaskDetail((prevTask) => ({
      ...prevTask,
      openModal: false,
      selected: null,
    }));
  };

  const handleGettingEmployeeTasks = async (dontReload) => {
    !dontReload && setLoading(true);
    const token = await GetToken();

    let Api =
      Backend.api +
      Backend.getEmployeeTask +
      state?.id +
      `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}`;

    if (state?.from) {
      Api += `&from=${state?.from}`;
    }
    if (state?.to) {
      Api += `&to=${state?.to}`;
    }

    // const Api =
    //   Backend.api +
    //   Backend.getEmployeeTask +
    //   state?.id +
    //   `?fiscal_year_id=${selectedYear?.id}&from=${state?.from}&to=${state?.to}&page=${pagination.page + 1}&per_page=${pagination.per_page}`;

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

  //  ======= TEAM TASK APPROVAL ======= START ========

  const handleTaskApproval = async (newStatus, task) => {
    const token = await GetToken();
    const Api = Backend.api + Backend.weeklyTaskApproval + task?.id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify({ status: newStatus }),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          handleGettingEmployeeTasks(true);
          CheckForPendingTasks(dispatch, selectedYear?.id);
        } else {
          toast.error(response?.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error?.message);
      });
  };

  //  ======= TEAM TASK APPROVAL ======= END ========

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  useEffect(() => {
    handleGettingEmployeeTasks();
  }, [selectedYear?.id, state?.id, pagination.page, pagination.per_page]);

  // Add this useEffect to check for taskId after data loads
  useEffect(() => {
    if (data.length > 0 && state?.taskId) {
      const task = data.find((task) => task.id === state.taskId);
      if (task) {
        setTaskDetail({ openModal: true, selected: task });
      }
    }
  }, [data, state?.taskId]);
  return (
    <PageContainer
      back={true}
      title={state?.name || 'Team Member Tasks'}
      rightOption={
        <Box sx={{ mr: 4, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" color="text.primary">
            Weekly Tasks
          </Typography>
          {state?.from && state?.to && (
            <Grid
              item
              xs={12}
              sx={{
                mb: 3,
                flexDirection: 'row',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Typography variant="h4" fontWeight="bold">
                Selected Date Range :
                <span style={{ color: 'skyblue' }}>
                  {state?.from} - {state?.to}
                </span>
              </Typography>
            </Grid>
          )}
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
              message={`Unable to retrieve your teams `}
            />
          ) : data.length === 0 ? (
            <Fallbacks
              severity="my-teams"
              title={`There is no task`}
              description={`The list of employee tasks will be listed here`}
              sx={{ paddingTop: 6 }}
            />
          ) : (
            <TeamMemberTasks
              tasks={data}
              onViewDetail={(task) => handleViewingDetail(task)}
              onActionTaken={(action, task) => handleTaskApproval(action, task)}
            />
          )}

          {!loading && data.length > 0 && (
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
      {taskDetail.selected && (
        <TaskDetailModal
          open={taskDetail.openModal}
          task={taskDetail.selected}
          title="Task Detail"
          handleClose={handleCloseDetailModal}
          onCancel={handleCloseDetailModal}
        />
      )}
      <ToastContainer />
    </PageContainer>
  );
};

ViewTeamMemberTasks.propTypes = {};

export default ViewTeamMemberTasks;
