import { toast } from 'react-toastify';
import Backend from 'services/backend';
import GetToken from './auth-token';
import { setActiveUnit, storeUnits } from 'store/slices/active-unit';

export const handleGettingManagerUnits = async (dispatch) => {
  try {
    const Api = Backend.api + Backend.getManagerUnits;
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
      if (data.data?.units.length > 1) {
        dispatch(storeUnits(data.data?.units));
        if (data.data.last_active) {
          dispatch(setActiveUnit(data.data?.last_active));
        } else {
          handleSettingActingUnit(dispatch, data.data?.units[0]);
        }
      }
    }
  } catch (error) {
    toast.error(error.message);
  }
};

export const handleSettingActingUnit = async (dispatch, unit) => {
  try {
    const Api = Backend.api + Backend.setActiveUnit + unit?.id;
    const token = await GetToken();

    const response = await fetch(Api, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      dispatch(setActiveUnit(unit));
      window.location.reload();
    }
  } catch (error) {
    toast.error(error.message);
  }
};
