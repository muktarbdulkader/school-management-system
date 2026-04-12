import { Storage } from 'configration/storage';
import { handleBackendLogout } from './user-inactivity';
import { SIGN_IN } from 'store/actions/actions';
import Backend from 'services/backend';
import { store } from 'store';

export const RefreshToken = async () => {
  const Api = Backend.auth + Backend.refreshToken;
  const refreshToken = Storage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(Api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();

    if (response.ok && data.access) {
      const currentTime = new Date().getTime();
      const ttl = 3600 * 1000; // 1 hour
      const expirationTime = ttl + currentTime;

      Storage.setItem('token', data.access);
      Storage.setItem('tokenExpiration', expirationTime);
      
      // If a new refresh token is provided, update it
      if (data.refresh) {
        Storage.setItem('refreshToken', data.refresh);
      }
    } else {
      throw new Error('Token refresh failed');
    }
  } catch (error) {
    throw error;
  }
};

const GetToken = async () => {
  const token = Storage.getItem('token');
  const ttl = Storage.getItem('tokenExpiration');
  const currentTime = new Date().getTime();
  const twoMinutes = 2 * 60 * 1000;

  if (ttl - currentTime < twoMinutes) {
    try {
      await RefreshToken();
      return Storage.getItem('token');
    } catch (error) {
      store.dispatch({ type: SIGN_IN, signed: false });
      await handleBackendLogout();
      Storage.clear();
      return null;
    }
  } else if (token) {
    return token;
  } else {
    store.dispatch({ type: SIGN_IN, signed: false });
    await handleBackendLogout();
    Storage.clear();
  }
};

export default GetToken;
