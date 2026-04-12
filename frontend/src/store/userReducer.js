// reducers.js
import * as actionTypes from './actions/actions';

const initialState = {
  signed: false,
  user: null,
  roles: [],
  permissions: [],
  my_unit: null,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        roles: action.payload.user.roles || [],
        permissions: action.payload.user.permissions,
      };
    case actionTypes.SET_USER_UNIT:
      return {
        ...state,
        my_unit: action.payload,
      };
    case actionTypes.SIGN_IN:
      return {
        ...state,
        signed: action.signed,
      };

    default:
      return state;
  }
};

export default userReducer;
