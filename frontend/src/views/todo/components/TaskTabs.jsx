import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Tab, useTheme } from '@mui/material';
import { IconLayoutKanban, IconList } from '@tabler/icons-react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import BoardView from '../boardView';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import TabularView from '../tabularView';

const tabs = [
  {
    icon: <IconLayoutKanban size="1.6rem" stroke="1.4" />,
    label: 'Board View',
  },
  { icon: <IconList size="1.6rem" stroke="1.4" />, label: 'Tabular View' },
];

const TaskTabs = ({
  isLoading,
  tasks,
  onCreateTask,
  onChangeStatus,
  onAddSubTask,
  onSubtaskStatusChange,
  statusIsChanging,
  onActionTaken,
  onViewDetail,
}) => {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', borderColor: theme.palette.divider }}>
      <TabContext value={value}>
        <Box>
          <TabList
            onChange={handleChange}
            aria-label="Employee to do task tab and contents"
            sx={{ paddingY: 0 }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                value={index}
              />
            ))}
          </TabList>
        </Box>

        <Box sx={{ p: 0 }}>
          {isLoading ? (
            <TabPanel value={value}>
              <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
                <ActivityIndicator size={20} />
              </Box>
            </TabPanel>
          ) : (
            <>
              <TabPanel value={0} sx={{ p: 0 }}>
                <BoardView
                  tasks={tasks}
                  changeStatus={onChangeStatus}
                  createTask={onCreateTask}
                  addSubtask={onAddSubTask}
                  onSubtaskStatusChange={onSubtaskStatusChange}
                  statusIsChanging={statusIsChanging}
                  onActionTaken={onActionTaken}
                  onViewDetail={onViewDetail}
                />
              </TabPanel>

              <TabPanel value={1} sx={{ p: 0 }}>
                <TabularView
                  tasks={tasks}
                  changeStatus={onChangeStatus}
                  createTask={onCreateTask}
                  addSubtask={onAddSubTask}
                  onSubtaskStatusChange={onSubtaskStatusChange}
                  statusIsChanging={statusIsChanging}
                  onActionTaken={onActionTaken}
                  onViewDetail={onViewDetail}
                />
              </TabPanel>
            </>
          )}
        </Box>
      </TabContext>
    </Box>
  );
};
TaskTabs.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  tasks: PropTypes.array.isRequired,
  onCreateTask: PropTypes.func.isRequired,
  onChangeStatus: PropTypes.func.isRequired,
  onAddSubTask: PropTypes.func.isRequired,
  onSubtaskStatusChange: PropTypes.func.isRequired,
  statusIsChanging: PropTypes.bool.isRequired,
  onActionTaken: PropTypes.func.isRequired,
  onViewDetail: PropTypes.func.isRequired,
};

export default TaskTabs;
