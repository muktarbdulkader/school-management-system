import { toast } from 'react-toastify';
import { setUserUnit } from 'store/actions/actions';
import Backend from 'services/backend';
import GetToken from './auth-token';

const StoreUserUnit = () => async (dispatch) => {
  try {
    const Api = Backend.api + Backend.myUnit;
    const token = await GetToken();

    const response = await fetch(Api, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      dispatch(setUserUnit(data.data));
    }
  } catch (error) {
    toast.error(error.message);
  }
};
export default StoreUserUnit;
