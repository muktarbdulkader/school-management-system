import React from 'react';
import DrogaModal from 'ui-component/modal/DrogaModal';
import PropTypes from 'prop-types';
import TaskDetailTabs from './TaskDetailTabs';
import { Subtasks } from './task-detail/SubTasks';
import { TaskRemarks } from './task-detail/Remarks';
import { TaskOverview } from './task-detail/TaskOverview';

const TaskDetailModal = ({ open, task, title, handleClose, onCancel, onSubmit, submitting, onSubtaskStatusChange, statusIsChanging }) => {
  return (
    <DrogaModal
      open={open}
      title={title}
      handleClose={handleClose}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitting={submitting}
      containerStyle={{ display: 'flex', justifyContent: 'center' }}
      sx={{ width: { xs: '100%', sm: '100%', md: 600 }, minHeight: { xs: '90%', sm: '90%', md: 500 }, p: 0 }}
      hideActionButtons={true}
    >
      <TaskDetailTabs
        overview={<TaskOverview task={task} />}
        subtasks={<Subtasks subtasks={task?.sub_tasks} onSubtaskStatusChange={onSubtaskStatusChange} statusIsChanging={statusIsChanging} />}
        remarks={<TaskRemarks task={task} />}
      />
    </DrogaModal>
  );
};

DrogaModal.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  children: PropTypes.node,
  handleClose: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool
};

export default TaskDetailModal;
