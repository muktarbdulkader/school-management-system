import React, { useEffect, useState } from 'react';
import PageContainer from 'ui-component/MainPage';
import { Chip, FormControl, FormHelperText, Grid, InputLabel, OutlinedInput, TablePagination, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import Search from 'ui-component/search';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { EvaluationLists } from 'views/approvals/components/EvaluationLists';
import { getStatusColor } from 'utils/function';
import * as Yup from 'yup';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import EvaluationStatusNotice from './components/EvaluationStatusNotice';

const validationSchema = Yup.object().shape({
  remark: Yup.string()
});

const MyEvaluations = () => {
  const theme = useTheme();
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0
  });

  const [allowedStatus, setAllowedState] = useState([]);
  const [statuses, setStatuses] = useState({
    plan_status: ''
  });
  const [actionInfo, setActionInfo] = useState({
    openModal: false,
    title: 'Change Status',
    action: '',
    submitting: false
  });

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleChangePage = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination((prev) => ({ ...prev, per_page: event.target.value, page: 0 }));
  };

  //  ================ EVALUATION ACCEPTANCE ============= START ========

  const formik = useFormik({
    initialValues: {
      remark: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleEvaluationStatus(values);
    }
  });

  const handleOpenModal = (title, action) => {
    setActionInfo((PrevState) => ({ ...PrevState, openModal: true, title: title, action: action }));
  };

  const handleCloseModal = () => {
    setActionInfo((PrevState) => ({ ...PrevState, openModal: false, action: '' }));
    formik.resetForm();
  };

  const handleEvaluationStatus = async (values) => {
    setActionInfo((prevState) => ({ ...prevState, submitting: true }));
    const token = await GetToken();
    const Api = Backend.api + Backend.evaluationWorkflowAction;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      fiscal_year_id: selectedYear?.id,
      status: actionInfo.action,
      remark: values.remark
    };

    fetch(Api, { method: 'POST', headers: header, body: JSON.stringify(data) })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          handleCloseModal();
          handleGettingMyEvaluations();
        } else {
          toast.error(response?.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error?.message);
      })
      .finally(() => {
        setActionInfo((prevState) => ({ ...prevState, submitting: false }));
      });
  };

  //  ================ EVALUATION ACCEPTANCE ============= END ========

  const handleGettingMyEvaluations = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api =
      Backend.api +
      Backend.getMyEvaluation +
      `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;

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
          setData(response.data.employeePlans?.data);
          setAllowedState(response.data?.allowed_status);
          setStatuses((prev) => ({
            ...prev,
            plan_status: response?.data?.plan_status
          }));
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
      handleGettingMyEvaluations();
    }, 500);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  useEffect(() => {
    if (mounted) {
      handleGettingMyEvaluations();
    } else {
      setMounted(true);
    }
  }, [selectedYear, pagination.page, pagination.per_page]);

  return (
    <>
      <PageContainer
        back={true}
        title="My Evaluations"
        searchField={<Search value={search} onChange={(event) => handleSearchFieldChange(event)} />}
        rightOption={
          statuses?.plan_status && (
            <Chip
              label={statuses?.plan_status}
              sx={{
                backgroundColor: theme.palette.grey[50],
                color: getStatusColor(statuses?.plan_status),
                textTransform: 'capitalize',
                fontWeight: 'bold'
              }}
            />
          )
        }
      >
        <Grid container sx={{ justifyContent: 'center' }}>
          <Grid item xs={12}>
            {allowedStatus.length > 0 && (
              <EvaluationStatusNotice
                status={statuses?.plan_status}
                changingStatus={actionInfo.submitting}
                onAccept={allowedStatus.includes('accepted') ? () => handleOpenModal('Accepting', 'accepted') : null}
                onOpenToDiscussion={
                  allowedStatus.includes('open for discussion')
                    ? () => handleOpenModal('Opening for discussion', 'open for discussion')
                    : null
                }
                onEsclate={allowedStatus.includes('escalated') ? () => handleOpenModal('Esclating', 'escalated') : null}
              />
            )}
          </Grid>

          <Grid item xs={11.7}>
            {loading ? (
              <Grid container>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                  <ActivityIndicator size={20} />
                </Grid>
              </Grid>
            ) : error ? (
              <ErrorPrompt title="Server Error" message={`There is error retrieving KPI's`} />
            ) : data.length === 0 ? (
              <Fallbacks
                severity="evaluation"
                title={`There is not KPI evaluated`}
                description={`The list of evaluated KPI will be listed here`}
                sx={{ paddingTop: 6 }}
              />
            ) : (
              <>
                <EvaluationLists evaluations={data} />
                {!loading && data?.length > pagination.per_page && (
                  <TablePagination
                    component="div"
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    count={pagination.total}
                    rowsPerPage={pagination.per_page}
                    page={pagination.page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Per page"
                  />
                )}
              </>
            )}
          </Grid>
        </Grid>
      </PageContainer>
      {actionInfo.openModal && (
        <DrogaFormModal
          open={actionInfo.openModal}
          handleClose={handleCloseModal}
          title={actionInfo.title}
          onCancel={handleCloseModal}
          onSubmit={formik.handleSubmit}
          submitting={actionInfo.submitting}
        >
          <FormControl fullWidth error={formik.touched.remark && Boolean(formik.errors.remark)}>
            <InputLabel htmlFor="remark">Remark (Optional)</InputLabel>
            <OutlinedInput
              id="remark"
              name="remark"
              label="Remark (Optional)"
              value={formik.values.remark}
              onChange={formik.handleChange}
              multiline
              rows={4}
              fullWidth
            />
            {formik.touched.remark && formik.errors.remark && (
              <FormHelperText error id="standard-weight-helper-text-remark">
                {formik.errors.remark}
              </FormHelperText>
            )}
          </FormControl>
        </DrogaFormModal>
      )}
    </>
  );
};

MyEvaluations.propTypes = {};

export default MyEvaluations;
