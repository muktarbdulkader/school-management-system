import Backend from 'services/backend';
import GetToken from './auth-token';
import { toast } from 'react-toastify';
import { setNotifications } from 'store/actions/actions';

export const CheckForNewNotifications = async (dispatch) => {
  const token = await GetToken();
  const Api = Backend.auth + Backend.myNotification;

  const header = {
    Authorization: `Bearer ${token}`,
    accept: 'application/json',
    'Content-Type': 'application/json'
  };

  fetch(Api, {
    method: 'GET',
    headers: header
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.success) {
        dispatch(setNotifications(response.data?.unread_count));
      }
    })
    .catch((error) => {
      toast(error.message);
    });
};
