// count of pending tasks
import * as actionTypes from './actions/actions';

const initialState = {
  weeklyTasks: 0,
  approvalRequests: 0,
  notifications: 0
};

const pendingTaskSlice = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SET_WEEKLY_TASKS:
      return {
        ...state,
        weeklyTasks: action.payload
      };
    case actionTypes.SET_APPROVAL_TASKS:
      return {
        ...state,
        approvalRequests: action.payload
      };

    case actionTypes.SET_NEW_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload
      };
    default:
      return state;
  }
};

export default pendingTaskSlice;
