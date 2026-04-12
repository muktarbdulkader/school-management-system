import PropTypes from 'prop-types';
import Conversations from '../remarks/Conversations';

export const TaskRemarks = ({ task }) => {
  return <Conversations task={task} />;
};

TaskRemarks.propTypes = {
  task: PropTypes.object.isRequired,
};
