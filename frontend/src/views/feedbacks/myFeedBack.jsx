import { useEffect, useState } from 'react';

import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import PageContainer from 'ui-component/MainPage';

import Backend from 'services/backend';

import GetToken from 'utils/auth-token';
import PropTypes from 'prop-types';

import FeedBackTabs from './components/FeedBackTabs';

const MyFeedBack = () => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [feedBack, setMyFeedback] = useState({
    openModal: false,
    submitting: false,
  });
  const [loading, setLoading] = useState();
  const [error, setError] = useState(false);

  const handleFetchingFeedback = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api =
      Backend.api + Backend.myFeedBack + `?fiscal_year_id=${selectedYear?.id}`;
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
          setMyFeedback(response.data.data);

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

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingFeedback();
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, []);

  return (
    <PageContainer title="My Feedback">
      {feedBack && <FeedBackTabs isLoading={loading} feedBack={feedBack} />}

      <ToastContainer />
    </PageContainer>
  );
};

MyFeedBack.propTypes = {
  hideChart: PropTypes.bool,
  hideCreate: PropTypes.bool,
  onRefresh: PropTypes.func,
};
export default MyFeedBack;
