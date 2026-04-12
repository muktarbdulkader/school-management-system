import { useEffect, useState } from 'react';

import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import PageContainer from 'ui-component/MainPage';

import Backend from 'services/backend';

import GetToken from 'utils/auth-token';
import PropTypes from 'prop-types';

import CreateFeedBack from './components/CreateFeedBack';
import FeedBackTabs from './components/FeedBackTabs';

import { useLocation } from 'react-router-dom';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import { IconPlus } from '@tabler/icons-react';

const FeedBack = () => {
  const { state } = useLocation();

  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [modalState, setModalState] = useState({
    openModal: false,
    submitting: false,
  });

  const [feedBackData, setFeedbackData] = useState([]);

  const [loading, setLoading] = useState();
  const [error, setError] = useState(false);
  const [frequency, setFrequency] = useState([]);

  const handleOpenCreateModal = async () => {
    setModalState((prev) => ({ ...prev, openModal: true }));
  };

  const handleCloseCreateModal = () => {
    setModalState((prev) => ({ ...prev, openModal: false }));
  };

  const handleFeedbackCreation = async (value) => {
    setModalState((prev) => ({ ...prev, submitting: true }));
    const token = await GetToken('token');
    console.log('he', state?.employee_id);

    const Api =
      Backend.api +
      Backend.feedBack +
      `?employee_id=${state?.employee_id}` +
      `&fiscal_year_id=${selectedYear?.id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      frequency_id: value?.id,
      strength: value?.strength,
      weakness: value?.weakness,
      area_of_improvement: value?.area_of_improvement,
      recommendation: value?.recommendation,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data?.message);
          handleFetchingFeedback();
        } else {
          toast.error(response.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setModalState((prev) => ({
          ...prev,
          submitting: false,
          openModal: false,
        }));
      });
  };

  const handleFetchingFeedback = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api =
      Backend.api +
      Backend.feedBack +
      `?employee_id=${state?.employee_id}` +
      `&fiscal_year_id=${selectedYear?.id}`;
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
          setFeedbackData(response.data.data);
          setError(false);
        } else {
          toast.warning(response.data.message);
          setError(false);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const handleGettingFrequency = async () => {
    const token = await GetToken();
    const Api = Backend.api + Backend.frequencies;

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
          setFrequency(response.data.data);
        } else {
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
      });
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleGettingFrequency();
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, []);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingFeedback();
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, []);

  return (
    <PageContainer
      title="Employees Feedback"
      rightOption={
        <DrogaButton
          title="Create Feedback"
          variant="contained"
          icon={
            <IconPlus size="1.2rem" stroke="1.2" style={{ marginRight: 4 }} />
          }
          sx={{ boxShadow: 0 }}
          onPress={handleOpenCreateModal}
        />
      }
    >
      {feedBackData && (
        <FeedBackTabs
          isLoading={loading}
          feedBack={feedBackData}
          onCreateTask={() => handleOpenCreateModal()}
        />
      )}

      <CreateFeedBack
        open={modalState.openModal}
        handleCloseModal={handleCloseCreateModal}
        handleFeedbackSubmission={(values) => handleFeedbackCreation(values)}
        submitting={modalState.submitting}
        frequency={frequency}
      />

      <ToastContainer />
    </PageContainer>
  );
};

FeedBack.propTypes = {
  hideChart: PropTypes.bool,
  hideCreate: PropTypes.bool,
  onRefresh: PropTypes.func,
};
export default FeedBack;
