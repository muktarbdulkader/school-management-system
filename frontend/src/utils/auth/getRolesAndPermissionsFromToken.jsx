import { Storage } from 'configration/storage';
import { useDispatch } from 'react-redux';
import { logout } from 'utils/user-inactivity';

export const decodeJWT = (token) => {
  if (!token || typeof token !== 'string') {
    console.error('Invalid token provided');
    return null;
  }

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error('Invalid JWT structure');
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// Get roles and permissions from token
export const getRolesAndPermissionsFromToken = (dispatch) => {
  const token = Storage.getItem('token'); // Retrieve the token

  if (!token) {
    dispatch && dispatch({ type: SIGN_IN, signed: false });
    Storage.clear();
    return;
  }

  try {
    const decodedToken = decodeJWT(token);
    if (!decodedToken) {
      console.warn('Failed to decode token');
      return [];
    }

    const roles = decodedToken.roles || [];

    return roles;
  } catch (error) {
    console.error('Failed to get roles and permissions from token:', error);
    return [];
  }
};



export default getRolesAndPermissionsFromToken;
