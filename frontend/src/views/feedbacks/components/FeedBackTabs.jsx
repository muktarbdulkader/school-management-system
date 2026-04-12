import PropTypes from 'prop-types';
import { Box, useTheme } from '@mui/material';

import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import View from '../view';

const FeedBackTabs = ({
  isLoading,
  onEditTask,
  onCreateTask,
  feedBack,
  onAddSubTask,

  onActionTaken,
  onViewDetail,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', borderColor: theme.palette.divider }}>
      <Box sx={{ p: 0 }}>
        {isLoading ? (
          <>
            <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
              <ActivityIndicator size={20} />
            </Box>
          </>
        ) : (
          <>
            <>
              <View
                feedBack={feedBack}
                createTask={onCreateTask}
                editTask={onEditTask}
                addSubtask={onAddSubTask}
                onActionTaken={onActionTaken}
                onViewDetail={onViewDetail}
              />
            </>
          </>
        )}
      </Box>
    </Box>
  );
};
FeedBackTabs.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  tasks: PropTypes.array.isRequired,
  onCreateTask: PropTypes.func.isRequired,
  onChangeStatus: PropTypes.func.isRequired,
  onAddSubTask: PropTypes.func.isRequired,
  feedBack: PropTypes.array.isRequired,

  onActionTaken: PropTypes.func.isRequired,
  onViewDetail: PropTypes.func.isRequired,
};

export default FeedBackTabs;
