import { useEffect, useState } from 'react';
import { Icon3dCubeSphere, IconPlus } from '@tabler/icons-react';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import PageContainer from 'ui-component/MainPage';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import Backend from 'services/backend';
import CreateTask from './components/CreateTask';
import GetToken from 'utils/auth-token';
import PropTypes from 'prop-types';
import TaskTabs from './components/TaskTabs';
import AddSubTask from './components/AddSubTask';
import EditTask from './components/EditTask';
import TaskDetailModal from './components/TaskDetailModal';
import FilterTasks from './components/FilterTasks';
import { Box } from '@mui/material';
import AttachmentModal from './components/AttachmentModal';

const Todo = ({ hideCreate }) => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [myKPI, setMyKPI] = useState([]);
  const [task, setTask] = useState({
    loading: true,
    taskList: [],
    openModal: false,
    openEdit: false,
    selected: null,
    submitting: false,
    date: '',
    picker: false,
    changing: false,
    search: '',
    deleting: false,
  });

  const [taskDetail, setTaskDetail] = useState({
    openModal: false,
    selected: null,
  });

  const [subTask, setSubTask] = useState({
    loading: true,
    selectedTask: {},
    dateSelected: '',
    openModal: false,
    submitting: false,
    changing: false,
  });

  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });

  // ========== FILTER RELATED CODES ========START=========

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [KPISelected, setKPISelected] = useState('');
  const [attachmentModal, setAttachmentModal] = useState({
    open: false,
    task: null,
    newStatus: null,
    file: null,
    uploading: false,
  });

  const handleKPISelection = (event) => {
    const value = event.target.value;
    setKPISelected(value);
  };

  // Handler for file change
  const handleFileChange = (event) => {
    setAttachmentModal((prev) => ({
      ...prev,
      file: event.target.files[0],
    }));
  };

  // Handler for submitting the attachment
  const handleAttachmentSubmit = async () => {
    if (!attachmentModal.file) {
      toast.error('Please select a file');
      return;
    }

    setAttachmentModal((prev) => ({ ...prev, uploading: true }));

    const token = await GetToken('token');
    const formData = new FormData();
    formData.append('attachment', attachmentModal.file);
    formData.append('status', attachmentModal.newStatus);

    try {
      const response = await fetch(
        Backend.api + Backend.employeeTaskStatus + attachmentModal.task.id,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Status changed and file uploaded successfully');
        handleEmployeeTask();
        setAttachmentModal((prev) => ({ ...prev, open: false }));
      } else {
        toast.error(data.data?.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAttachmentModal((prev) => ({ ...prev, uploading: false }));
    }
  };

  // =========== FILTER RELATED CODES ========END=========

  const handleStatusChange = async (task, option) => {
    setAttachmentModal({
      open: true,
      task: task,
      newStatus: option?.value,
      file: null,
      uploading: false,
    });
    setTask((prevTask) => ({ ...prevTask, changing: true }));
    const token = await GetToken('token');
    const Api = Backend.api + Backend.employeeTaskStatus + task.id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      status: option?.value,
      attachment: task?.attachment,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          handleEmployeeTask();
        } else {
          toast.error(response.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setTask((prevTask) => ({ ...prevTask, changing: false }));
      });
  };

  const handleGettingMyKPI = async () => {
    const token = await GetToken();
    const Api = Backend.api + Backend.myKPIS;

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
          setMyKPI(response.data);
        } else {
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
      });
  };

  const handleSettingUpEdit = async (task) => {
    setTask((prevTask) => ({ ...prevTask, selected: task }));
  };

  const handleTaskAction = async (action, task) => {
    if (action === 'remove') {
      handleDeleteTask(task?.id);
    } else {
      await handleSettingUpEdit(task);
      handleOpenEditModal();
    }
  };

  const handleOpenCreateModal = async () => {
    await handleGettingMyKPI();
    setTask((prevTask) => ({ ...prevTask, openModal: true }));
  };

  const handleCloseCreateModal = () => {
    setTask((prevTask) => ({ ...prevTask, openModal: false }));
  };

  const handleOpenEditModal = async () => {
    await handleGettingMyKPI();
    setTask((prevTask) => ({ ...prevTask, openEdit: true }));
  };

  const handleCloseEditModal = () => {
    setTask((prevTask) => ({ ...prevTask, openEdit: false }));
  };

  const handleTaskCreation = async (value) => {
    setTask((prevTask) => ({ ...prevTask, submitting: true }));
    const token = await GetToken('token');
    const Api = Backend.api + Backend.employeeTasks;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      kpi_tracker_id: value?.plan_id,
      title: value?.task,
      description: value?.description,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data?.message);
          handleEmployeeTask();
        } else {
          toast.error(response.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setTask((prevTask) => ({
          ...prevTask,
          submitting: false,
          openModal: false,
        }));
      });
  };

  const handleTaskEdition = async (value) => {
    setTask((prevTask) => ({ ...prevTask, submitting: true }));
    const token = await GetToken('token');
    const Api = Backend.api + Backend.employeeTasks + '/' + task?.selected?.id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      kpi_tracker_id: value?.plan_id,
      title: value?.task,
      description: value?.description,
    };

    fetch(Api, {
      method: 'PATCH',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data?.message);
          handleEmployeeTask();
          handleCloseEditModal();
        } else {
          toast.error(response.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setTask((prevTask) => ({
          ...prevTask,
          submitting: false,
          openModal: false,
        }));
      });
  };

  const handleDeleteTask = async (id) => {
    setTask((prevTask) => ({ ...prevTask, deleting: true }));
    const token = await GetToken('token');
    const Api = Backend.api + Backend.employeeTasks + '/' + id;

    const headers = {
      Authorization: `Bearer` + token,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'DELETE',
      headers: headers,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data.message);
          handleEmployeeTask();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setTask((prevTask) => ({ ...prevTask, deleting: false }));
      });
  };

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

  const handleRefreshSelectedTask = (data) => {
    const selectedTask = data.find(
      (task) => task.id === taskDetail.selected?.id,
    );
    setTaskDetail((prevTask) => ({ ...prevTask, selected: selectedTask }));
  };

  const handleGettingDate = (dateStr) => {
    if (dateStr) {
      const dateObj = new Date(dateStr);

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      const formattedDate = `${year}-${month}-${day}`;

      return formattedDate ? formattedDate : null;
    } else {
      return '';
    }
  };

  const handleEmployeeTask = async (doesLoad) => {
    if (selectedYear?.id) {
      doesLoad && setTask((prevTask) => ({ ...prevTask, loading: true }));
      const token = await GetToken();

      const filteredEndpoint =
        Backend.api +
        Backend.employeeTasks +
        `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&from=${handleGettingDate(startDate)}&to=${handleGettingDate(endDate)}&kpi_tracker_id=${KPISelected}`;

      const NormalEndpoint =
        Backend.api +
        Backend.employeeTasks +
        `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&kpi_tracker_id=${KPISelected}`;

      const Api = startDate && endDate ? filteredEndpoint : NormalEndpoint;

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
            setTask((prevTask) => ({
              ...prevTask,
              taskList: response.data.data,
            }));
            taskDetail.selected &&
              handleRefreshSelectedTask(response.data.data);
            setPagination({ ...pagination, total: response.data.total });
            handleCloseCreateModal();
          } else {
            toast.warning(response.data?.message);
          }
        })
        .catch((error) => {
          toast.error(error.message);
        })
        .finally(() => {
          setTask((prevTask) => ({ ...prevTask, loading: false }));
        });
    }
  };

  //=================== SUB TASK MANAGEMENT GOES BELOW =================================

  const handleOpenAddSubtaskModal = (dateSelected, task) => {
    setSubTask((prevTask) => ({
      ...prevTask,
      openModal: true,
      selectedTask: task,
      dateSelected: dateSelected,
    }));
  };

  const handleCloseSubTaskModal = () => {
    setSubTask((prevTask) => ({
      ...prevTask,
      openModal: false,
      selectedTask: {},
    }));
  };

  const handleSubTaskCreation = async (value, taskID) => {
    setSubTask((prevTask) => ({ ...prevTask, submitting: true }));
    const token = await GetToken('token');
    const Api = Backend.api + Backend.employeeSubTasks + taskID;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      title: value?.task,
      date: subTask.dateSelected,
      description: value?.description,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data?.message);
          handleEmployeeTask();
        } else {
          toast.error(response.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubTask((prevTask) => ({
          ...prevTask,
          submitting: false,
          openModal: false,
        }));
      });
  };

  const handleTaskStatusMiddleware = (task, statuses) => {
    if (statuses === 'remove') {
      handleSubtaskRemoval(task?.id);
    } else {
      handleSubTaskStatusChange(task, statuses);
    }
  };

  const handleSubTaskStatusChange = async (task, statuses) => {
    setSubTask((prevTask) => ({ ...prevTask, changing: true }));
    const token = await GetToken('token');
    const Api = Backend.api + Backend.employeeSubTaskStatus + task?.id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      status: statuses,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data?.message);
          handleEmployeeTask();
        } else {
          toast.info(response.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubTask((prevTask) => ({ ...prevTask, changing: false }));
      });
  };
  const handleCloneTask = async () => {
    setSubTask((prevTask) => ({ ...prevTask, changing: true }));
    const token = await GetToken('token');
    const Api =
      Backend.api +
      Backend.clonWeeklyTask +
      `?fiscal_year_id=${selectedYear?.id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data?.message);
          handleEmployeeTask();
        } else {
          toast.info(response.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubTask((prevTask) => ({ ...prevTask, changing: false }));
      });
  };
  const handleSubtaskRemoval = async (id) => {
    const token = await GetToken('token');
    const Api = Backend.api + Backend.employeeSubTasks + id;

    const headers = {
      Authorization: `Bearer` + token,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'DELETE',
      headers: headers,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data.message);
          handleEmployeeTask();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  useEffect(() => {
    handleEmployeeTask(true);
  }, [
    task.date,
    endDate,
    KPISelected,
    selectedYear,
    pagination.page,
    pagination.per_page,
  ]);

  return (
    <PageContainer
      title="Weekly Tasks"
      rightOption={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          <FilterTasks
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            GetKPIS={() => handleGettingMyKPI()}
            myKPIS={myKPI}
            KPISelected={KPISelected}
            handleKPISelection={(event) => handleKPISelection(event)}
          />
          {!hideCreate && (
            <DrogaButton
              title="Create"
              variant="contained"
              icon={
                <IconPlus
                  size="1.2rem"
                  stroke="1.2"
                  style={{ marginRight: 4 }}
                />
              }
              sx={{ boxShadow: 0 }}
              onPress={handleOpenCreateModal}
            />
          )}
          <DrogaButton
            title="Clon Weekly task"
            variant="contained"
            icon={
              <Icon3dCubeSphere
                size="1.2rem"
                stroke="1.2"
                style={{ marginRight: 4 }}
              />
            }
            sx={{ boxShadow: 0 }}
            onPress={handleCloneTask}
          />
        </Box>
      }
    >
      {task.taskList && (
        <TaskTabs
          isLoading={task.loading}
          tasks={task.taskList}
          onCreateTask={() => handleOpenCreateModal()}
          onChangeStatus={(task, option) => handleStatusChange(task, option)}
          onAddSubTask={(dateSelected, task) =>
            handleOpenAddSubtaskModal(dateSelected, task)
          }
          onSubtaskStatusChange={(subtask, newStatus) =>
            handleTaskStatusMiddleware(subtask, newStatus)
          }
          statusIsChanging={subTask.changing}
          onActionTaken={(action, task) => handleTaskAction(action, task)}
          onViewDetail={(task) => handleViewingDetail(task)}
        />
      )}

      {myKPI && (
        <CreateTask
          open={task.openModal}
          handleCloseModal={handleCloseCreateModal}
          kpi={myKPI}
          handleTaskSubmission={(values) => handleTaskCreation(values)}
          submitting={task.submitting}
        />
      )}

      {myKPI && task.selected && (
        <EditTask
          open={task.openEdit}
          handleCloseModal={handleCloseEditModal}
          kpi={myKPI}
          selectedKPI={task.selected}
          handleTaskSubmission={(values) => handleTaskEdition(values)}
          submitting={task.submitting}
        />
      )}

      {taskDetail.selected && (
        <TaskDetailModal
          open={taskDetail.openModal}
          task={taskDetail.selected}
          title="Task Detail"
          handleClose={handleCloseDetailModal}
          onCancel={handleCloseDetailModal}
          onSubtaskStatusChange={(subtask, newStatus) =>
            handleTaskStatusMiddleware(subtask, newStatus)
          }
          statusIsChanging={subTask.changing}
        />
      )}

      {subTask.selectedTask && (
        <AddSubTask
          open={subTask.openModal}
          handleCloseModal={handleCloseSubTaskModal}
          task={subTask.selectedTask}
          handleSubmission={(values, taskID) =>
            handleSubTaskCreation(values, taskID)
          }
          submitting={subTask.submitting}
        />
      )}

      <AttachmentModal
        open={attachmentModal.open}
        task={attachmentModal.task}
        onClose={() => setAttachmentModal((prev) => ({ ...prev, open: false }))}
        onSubmit={handleAttachmentSubmit}
        uploading={attachmentModal.uploading}
        onFileChange={handleFileChange}
      />
      <ToastContainer />
    </PageContainer>
  );
};

Todo.propTypes = {
  hideChart: PropTypes.bool,
  hideCreate: PropTypes.bool,
  onRefresh: PropTypes.func,
};
export default Todo;
