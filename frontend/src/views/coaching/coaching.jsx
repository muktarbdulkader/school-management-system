import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import PageContainer from 'ui-component/MainPage';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import { IconPlus } from '@tabler/icons-react';
import CoachingTabs from './components/CoachingTabs';
import CreateCoaching from './components/CreateCoaching';

const Coaching = () => {
  const { state } = useLocation();
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [coachingData, setCoachingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalState, setModalState] = useState({
    openModal: false,
    submitting: false,
  });

  const handleOpenCreateModal = () => {
    setModalState((prev) => ({ ...prev, openModal: true }));
  };

  const handleCloseCreateModal = () => {
    setModalState((prev) => ({ ...prev, openModal: false }));
  };

  const handleCoachingCreation = async (values) => {
    setModalState((prev) => ({ ...prev, submitting: true }));
    try {
      const token = await GetToken();
      const Api = Backend.api + Backend.coaching;
      const payload = {
        ...values,
        employee_id: state?.employee_id,
        fiscal_year_id: selectedYear?.id,
      };

      const response = await fetch(Api, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Coaching session created successfully');
        handleFetchingCoaching();
      } else {
        throw new Error(result.message || 'Failed to create coaching session');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setModalState((prev) => ({
        ...prev,
        submitting: false,
        openModal: false,
      }));
    }
  };

  const handleFetchingCoaching = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api =
        Backend.api +
        Backend.coaching +
        `?employee_id=${state?.employee_id}&fiscal_year_id=${selectedYear?.id}`;

      const response = await fetch(Api, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        const data = result.data?.data || result.data || [];
        setCoachingData(data);
        setError(false);
      } else {
        toast.warning(result.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state?.employee_id && selectedYear?.id) {
      handleFetchingCoaching();
    }
  }, [state?.employee_id, selectedYear?.id]);

  return (
    <PageContainer
      title="Coaching Employees"
      rightOption={
        <DrogaButton
          title="Create Coaching"
          variant="contained"
          icon={
            <IconPlus size="1.2rem" stroke="1.2" style={{ marginRight: 4 }} />
          }
          sx={{ boxShadow: 0 }}
          onPress={handleOpenCreateModal}
        />
      }
    >
      <CoachingTabs
        feedBack={coachingData}
        isLoading={loading}
        onRefresh={handleFetchingCoaching}
      />

      <CreateCoaching
        open={modalState.openModal}
        handleCloseModal={handleCloseCreateModal}
        handleCoachingSubmission={handleCoachingCreation}
        submitting={modalState.submitting}
      />

      <ToastContainer />
    </PageContainer>
  );
};

Coaching.propTypes = {
  hideChart: PropTypes.bool,
  hideCreate: PropTypes.bool,
};

export default Coaching;
