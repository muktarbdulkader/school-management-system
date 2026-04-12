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
import PlanLists from './PlanLists';
import hasPermission from 'utils/auth/hasPermission';
import AddButton from 'ui-component/buttons/AddButton';
import { CreateUnitPlan } from 'views/planning/components/CreateUnitPlan';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import StatusModal from 'ui-component/modal/StatusModal';
import { useKPI } from 'context/KPIProvider';
import EmployeesModal from './EmployeesPlanClone';

const EmployeePlans = ({ id }) => {
  const { selectedPerspective, selectedObjective } = useKPI();
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });

  const [create, setCreate] = useState(false);
  const [canPlan, setCanPlan] = useState(false);
  const [canVerify, setCanVerify] = useState(false);

  //  ======= SENDING PLAN TO EMPLOYEE ======= START =======

  const [sending, setSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
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

  //  ======= SENDING PLAN TO EMPLOYEE ======= END =======

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

  const handleFetchingEmployeePlans = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api =
      Backend.api +
      Backend.getEmployeePlan +
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

  const handleCreateModalClose = () => {
    setCreate(false);
  };
  const handleEmployeeSelect = (employees) => {
    setSelectedEmployees(employees); // This is the array of selected employee IDs
  };

  const handlePlanSending = async () => {
    setSending(true);

    const token = await GetToken();
    if (!token) {
      toast.error('Authorization token is missing.');
      setSending(false);
      return;
    }

    const payloadData = {
      ...data,
      objective_id: selectedObjective?.id,
      perspective_type_id: selectedPerspective?.id,
    };

    const Api =
      Backend.api +
      Backend.submitEmployeePlan +
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
      body: JSON.stringify(payloadData),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          handleOpenSuccess(
            response?.data?.message || 'The plans are sent successfully',
          );
          handleFetchingEmployeePlans();
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
  const handleClonePlans = async (selectedEmployees) => {
    if (selectedEmployees.length === 0) {
      toast('Please select at least one employee.');
      return;
    }

    setSending(true);

    const token = await GetToken();
    if (!token) {
      toast.error('Authorization token is missing.');
      setSending(false);
      return;
    }

    const payloadData = {
      clone_to_employees: selectedEmployees,
    };

    const Api = `${Backend.api}${Backend.submitClonedEmployeePlan}/${id}?fiscal_year_id=${selectedYear?.id}`;
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
          handleFetchingEmployeePlans();
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

  //  ======== SUBMIT PLAN TO EMPLOYEES ===== END ====

  useEffect(() => {
    if (!id) {
      navigate(-1);
    }
  }, [id]);

  useEffect(() => {
    if (mounted) {
      handleFetchingEmployeePlans();
    } else {
      setMounted(true);
    }
  }, [pagination.page, pagination.per_page]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingEmployeePlans();
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
              <Grid item xs={6} sm={6} md={6} lg={4} xl={4}>
                <Search
                  value={search}
                  onChange={(event) => handleSearchFieldChange(event)}
                />
              </Grid>

              <Grid
                item
                xs={6}
                sm={4}
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
                    props={{ vara: 'contained' }}
                    title={'Add new plan'}
                    onPress={() => handleCreatePlan()}
                    disable={loading}
                  />
                )}
                {selectedEmployees && (
                  <EmployeesModal
                    open={isEmployeesModalOpen}
                    onClose={() => setIsEmployeesModalOpen(false)}
                    onEmployeeSelect={handleEmployeeSelect} // Pass selected employees to parent
                    handleClonePlans={handleClonePlans} // Pass clone function to modal
                  />
                )}
                {canVerify && (
                  <DrogaButton
                    variant="outlined"
                    title={
                      sending ? (
                        <ActivityIndicator size={18} />
                      ) : (
                        'Send to Employee'
                      )
                    }
                    onPress={() => handlePlanSending()}
                    sx={{ minWidth: '140px', ml: 3 }}
                    disabled={sending}
                  />
                )}
                {selectedEmployees && (
                  <DrogaButton
                    variant="outlined"
                    title={
                      sending ? <ActivityIndicator size={18} /> : 'Clone Plan'
                    }
                    onPress={() => setIsEmployeesModalOpen(true)}
                    sx={{ minWidth: '140px', ml: 3 }}
                    disabled={sending}
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
              refresh={() => handleFetchingEmployeePlans()}
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
        unit_type="employee"
        unit_id={id}
        onClose={handleCreateModalClose}
        onSucceed={() => handleFetchingEmployeePlans()}
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
EmployeePlans.propTypes = {
  id: PropTypes.string.isRequired,
};

export default EmployeePlans;
