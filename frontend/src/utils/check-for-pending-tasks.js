import Backend from 'services/backend';
import GetToken from './auth-token';
import { toast } from 'react-toastify';
import { setApprovalTasks, setWeeklyTasks } from 'store/actions/actions';

export const CheckForPendingTasks = async (dispatch, fiscal_year_id) => {
  const token = await GetToken();
  const Api =
    Backend.api +
    Backend.getPendingTaskCount +
    `?fiscal_year_id=${fiscal_year_id}`;

  const header = {
    Authorization: `Bearer ${token}`,
    accept: 'application/json',
    'Content-Type': 'application/json',
  };

  fetch(Api, {
    method: 'GET',
    headers: header,
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.success) {
        dispatch(setWeeklyTasks(response.data.pending_employee_tasks));
        dispatch(setApprovalTasks(response.data.approval_requests));
      }
    })
    .catch((error) => {
      toast(error.message);
    });
};
