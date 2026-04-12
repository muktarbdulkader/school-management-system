import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid, TablePagination } from '@mui/material';
import { gridSpacing } from 'store/constant';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';

import PageContainer from 'ui-component/MainPage';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import Search from 'ui-component/search';
import PlanLists from 'views/employees/components/PlanLists';
import hasPermission from 'utils/auth/hasPermission';
import AddButton from 'ui-component/buttons/AddButton';
import { CreateUnitPlan } from 'views/planning/components/CreateUnitPlan';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import StatusModal from 'ui-component/modal/StatusModal';
import UnitsPlanClone from '../UnitsPlanClone';

const UnitPlans = ({ id }) => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);

  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });

  const [create, setCreate] = useState(false);
  const [canPlan, setCanPlan] = useState(false);

  //  ======= SENDING PLAN TO UNIT ======= START =======

  const [sending, setSending] = useState(false);
  const [planSending, setPlanSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [canVerify, setCanVerify] = useState(false);
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);

  const handleOpenSuccess = (message) => {
    setModalStatus('success');
    setModalTitle('Plan sent successfully!');
    setModalMessage(message);
    setModalOpen(true);
  };

  const handleOpenError = (message) => {
    setModalStatus('error');
    setModalTitle('Plan is not sent');
    setModalMessage(message);
    setModalOpen(true);
  };

  //  ======= SENDING PLAN TO UNIT ======= END =======

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleFetchingUnitPlans = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api =
      Backend.api +
      Backend.getUnitPlans +
      id +
      `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;

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
          setData(response.data?.plans?.data);
          setCanPlan(response.data?.canPlan);
          setCanVerify(response.data?.can_verify);
          setPagination({ ...pagination, total: response.data?.plans?.total });
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

  //  ======== NEW KPI CREATION ======== START =========

  const handleCreatePlan = () => {
    setCreate(true);
  };
  const handleUnitSelect = (unit) => {
    setSelectedUnits(unit); // This is the array of selected employee IDs
  };
  const handleCreateModalClose = () => {
    setCreate(false);
  };

  //  ======== NEW KPI CREATION ======== END =========

  //  ======== SUBMIT PLAN TO EMPLOYEES ===== START ====

  const handlePlanSending = async () => {
    setSending(true);

    const token = await GetToken();
    if (!token) {
      toast.error('Authorization token is missing.');
      setSending(false);
      return;
    }

    const Api =
      Backend.api +
      Backend.submitUnitPlan +
      id +
      `?fiscal_year_id=${selectedYear?.id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          handleOpenSuccess(
            response?.data?.message || 'The plans are sent successfully',
          );
          handleFetchingUnitPlans();
        } else {
          handleOpenError(
            response?.data?.message || 'The plan is not sent to employee',
          );
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSending(false);
      });
  };
  const handleClonePlans = async (selectedUnits) => {
    if (selectedUnits.length === 0) {
      toast.error('Please select at least one unit.');
      return;
    }

    setPlanSending(true);

    const token = await GetToken();
    if (!token) {
      toast.error('Authorization token is missing.');
      setPlanSending(false);
      return;
    }

    const payloadData = {
      clone_to_units: selectedUnits,
    };

    const Api = `${Backend.api}${Backend.submitClonedUnitPlan}/${id}?fiscal_year_id=${selectedYear?.id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(payloadData),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          handleOpenSuccess(
            response?.data?.message || 'The plans are sent successfully',
          );
          handleFetchingUnitPlans();
        } else {
          handleOpenError(
            response?.data?.message || 'The plan is not sent to units',
          );
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setPlanSending(false);
      });
  };

  //  ======== SUBMIT PLAN TO EMPLOYEES ===== END ====

  useEffect(() => {
    if (!id) {
      navigate(-1);
    }
  }, [id]);

  useEffect(() => {
    if (mounted) {
      handleFetchingUnitPlans();
    } else {
      setMounted(true);
    }
  }, [pagination.page, pagination.per_page]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingUnitPlans();
    }, 600);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  return (
    <PageContainer back={false} title=" ">
      <Grid item xs={12} sx={{ px: 1 }}>
        <Grid container>
          <Grid item xs={12}>
            <Grid
              container
              spacing={gridSpacing}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
                <Search
                  value={search}
                  onChange={(event) => handleSearchFieldChange(event)}
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={12}
                md={4}
                lg={4}
                xl={4}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                {canPlan && hasPermission('create:kpitracker') && (
                  <AddButton
                    props={{ varaint: 'contained' }}
                    title={'Add new plan'}
                    onPress={() => handleCreatePlan()}
                    disable={loading}
                  />
                )}
                {selectedUnits && (
                  <UnitsPlanClone
                    open={isUnitsModalOpen}
                    onUnitSelect={handleUnitSelect}
                    onClose={() => setIsUnitsModalOpen(false)}
                    handleClonePlans={handleClonePlans}
                  />
                )}
                {canVerify && (
                  <DrogaButton
                    variant="outlined"
                    title={
                      sending ? <ActivityIndicator size={18} /> : 'Send to Unit'
                    }
                    onPress={() => handlePlanSending()}
                    sx={{ minWidth: '140px', ml: 3 }}
                    disabled={sending}
                  />
                )}
                {selectedUnits && (
                  <DrogaButton
                    variant="outlined"
                    title={
                      planSending ? (
                        <ActivityIndicator size={18} />
                      ) : (
                        'Clone Plan'
                      )
                    }
                    onPress={() => setIsUnitsModalOpen(true)}
                    sx={{ minWidth: '140px', ml: 3 }}
                    disabled={planSending}
                  />
                )}
              </Grid>

              <Grid
                item
                xs={12}
                sm={12}
                md={12}
                lg={9}
                xl={9}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              ></Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} my={2} sx={{ minHeight: '56dvh' }}>
            <PlanLists
              loading={loading}
              error={error}
              data={data}
              canEdit={canVerify}
              refresh={() => handleFetchingUnitPlans()}
            />
          </Grid>

          <Grid item xs={12} my={2}>
            {!loading && (
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
          </Grid>
        </Grid>
      </Grid>

      <CreateUnitPlan
        add={create}
        unit_type="unit"
        unit_id={id}
        onClose={handleCreateModalClose}
        onSucceed={() => handleFetchingUnitPlans()}
      />

      <StatusModal
        open={modalOpen}
        status={modalStatus}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />

      <ToastContainer />
    </PageContainer>
  );
};
UnitPlans.propTypes = {
  id: PropTypes.string.isRequired,
};

export default UnitPlans;
