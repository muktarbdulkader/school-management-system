import { combineReducers } from 'redux';

// reducer import
import customizationReducer from './customizationReducer';
import userReducer from './userReducer';
import pendingTaskSlice from './pendingTaskSlice';
import ManagerUnits from './slices/active-unit';
import studentsSlice from './slices/active-student';

// ============================== || COMBINE REDUCER ||============================== //

const reducer = combineReducers({
  customization: customizationReducer,
  user: userReducer,
  pending: pendingTaskSlice,
  managerUnits: ManagerUnits.reducer,
  student: studentsSlice,
});

export default reducer;
