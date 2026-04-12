import { Storage } from 'configration/storage';
import { useDispatch } from 'react-redux';
import { SIGN_IN } from 'store/actions/actions';
import Backend from 'services/backend';

let inactivityTimeout;

export const handleBackendLogout = async() => {
  const Api = Backend.auth + Backend.logout;
  const token = Storage.getItem('token');

  fetch(Api, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const logout = () => {
  const dispatch = useDispatch();
  dispatch({ type: SIGN_IN, signed: false });
  handleBackendLogout();
  Storage.clear();
};

const resetInactivityTimeout = () => {
  clearTimeout(inactivityTimeout);

  inactivityTimeout = setTimeout(
    () => {
      logout();
    },
    10 * 60 * 1000
  ); // 10 minutes in milliseconds
};

const setupActivityListeners = () => {
  window.addEventListener('mousemove', resetInactivityTimeout);
  window.addEventListener('keydown', resetInactivityTimeout);
  window.addEventListener('click', resetInactivityTimeout);
};

setupActivityListeners();
resetInactivityTimeout();
