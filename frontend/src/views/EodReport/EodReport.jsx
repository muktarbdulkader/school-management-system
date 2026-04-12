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
import CreateEodReport from './components/CreateEodReport';
import ViewEmployeeEOD from '.';
import EodReportTabs from './components/EodTabs';

const EodReport = () => {
  const { state } = useLocation();
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [eodData, setEodData] = useState([]);
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

  const handleEODReportCreation = async (values) => {
    setModalState((prev) => ({ ...prev, submitting: true }));
    try {
      const token = await GetToken();
      const Api = Backend.api + Backend.endOfDayReports;
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
          accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Coaching session created successfully');
        handleFetchingEod();
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

  const handleFetchingEod = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api =
        Backend.api +
        Backend.endOfDayReports +
        `?employee_id=${state?.employee_id}&fiscal_year_id=${selectedYear?.id}`;

      const response = await fetch(Api, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        // More robust data extraction
        const reports =
          result.data?.data?.data || result.data?.data || result.data || [];
        setEodData(reports);
        setError(false);
      } else {
        toast.warning(result.message);
        setError(true);
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
      handleFetchingEod();
    }
  }, [state?.employee_id, selectedYear?.id]);

  return (
    <PageContainer
      title="EOD Report"
      rightOption={
        <DrogaButton
          title="Create EOD Report"
          variant="contained"
          icon={
            <IconPlus size="1.2rem" stroke="1.2" style={{ marginRight: 4 }} />
          }
          sx={{ boxShadow: 0 }}
          onPress={handleOpenCreateModal}
        />
      }
    >
      <EodReportTabs
        eodReport={eodData}
        onRefresh={handleFetchingEod}
        isLoading={loading}
      />

      <CreateEodReport
        open={modalState.openModal}
        handleCloseModal={handleCloseCreateModal}
        handleCoachingSubmission={handleEODReportCreation}
        submitting={modalState.submitting}
      />

      <ToastContainer />
    </PageContainer>
  );
};

EodReport.propTypes = {
  hideChart: PropTypes.bool,
  hideCreate: PropTypes.bool,
};

export default EodReport;
