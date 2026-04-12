import React, { useState } from 'react';
import {
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import { useNavigate } from 'react-router-dom';
import PlanTable from './PlanTable';
import { UpdatePlan } from './UpdatePlan';
import { useSelector } from 'react-redux';
import { DotMenu } from 'ui-component/menu/DotMenu';

const EmployeeTable = ({ employees }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    plans: { data: [] },
    canPlan: false,
    can_verify: false,
  });
  const [error, setError] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deletePlan, setDeletePlan] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPlanID, setSelectedPlanID] = useState(null);
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const handleRowClick = (employeeId) => {
    if (selectedRow === employeeId) {
      setSelectedRow(null);
    } else {
      setSelectedRow(employeeId);
      handleFetchingEmployeePlan(employeeId);
    }
  };

  const handleFetchingEmployeePlan = async (employeeId) => {
    setLoading(true);
    const token = await GetToken();
    const Api =
      Backend.api +
      Backend.getEmployeePlan +
      employeeId +
      `?fiscal_year_id=${selectedYear?.id}`;

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
          setData({
            plans: response.data.plans || { data: [] },
            canPlan: response.data.canPlan,
            can_verify: response.data.can_verify,
          });
          setLoading(false);
          setError(false);
        } else {
          setLoading(false);
          setError(false);
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
        setLoading(false);
      });
  };

  // const handleFetchingEmployeePlan = async (employeeId) => {
  //   setLoading(true);
  //   const token = await GetToken();
  //   const Api =
  //     Backend.api +
  //     Backend.getEmployeePlan +
  //     employeeId +
  //     `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}`;

  //   const header = {
  //     Authorization: `Bearer ${token}`,
  //     accept: 'application/json',
  //     'Content-Type': 'application/json',
  //   };

  //   fetch(Api, {
  //     method: 'GET',
  //     headers: header,
  //   })
  //     .then((response) => response.json())
  //     .then((response) => {
  //       if (response.success && response.data?.plans) {
  //         setData(response.data?.plans?.data);
  //         setCanPlan(response?.data?.can_plan);
  //         setCanDistribute(response?.data?.can_distribute);
  //         setAllowedState(response.data?.allowed_status);
  //         setPlanStatus(response.data?.plan_status);

  //         handleSettingUpPerspectiveFilter(response?.data?.perspectiveTypes);
  //         handleSettingUpMeasuringUnitFilter(response.data?.measuringUnits);
  //         setPagination({ ...pagination, total: response.data?.plans?.total });
  //         setError(false);
  //         console.log('New', response.data?.plans?.data);
  //       } else {
  //         toast.warning(response.data.message);
  //         setError(false);
  //       }
  //     })
  //     .catch((error) => {
  //       toast.warning(error.message);
  //       setError(true);
  //     })
  //     .finally(() => {
  //       setLoading(false);
  //     });
  // };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setUpdateModalOpen(true);
  };

  const handleDeletePlan = async (planID) => {
    setSelectedPlanID(planID);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.api}${Backend.deletePlan}/${selectedPlanID}`;
      const response = await fetch(Api, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.data.message || 'Plan deleted successfully');
        handleFetchingEmployeePlan(selectedRow);
      } else {
        throw new Error(result.data?.message || 'Failed to delete plan');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
      setSelectedPlanID(null);
    }
  };

  const handleUpdateModalClose = () => {
    setUpdateModalOpen(false);
    setSelectedPlan(null);
  };

  const handlePlanUpdateSuccess = () => {
    handleFetchingEmployeePlan(selectedRow);
    handleUpdateModalClose();
  };

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          minHeight: '66dvh',
          border: 0.4,
          borderColor: theme.palette.divider,
          borderRadius: 2,
        }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="Organization unit table">
          <TableHead>
            <TableRow>
              <TableCell>Employee name</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees?.map((employee, index) => (
              <React.Fragment key={index}>
                <TableRow
                  sx={{
                    backgroundColor:
                      selectedRow == employee.id
                        ? theme.palette.grey[100]
                        : theme.palette.background.default,
                    ':hover': {
                      backgroundColor: theme.palette.grey[100],
                      color: theme.palette.background.default,
                      cursor: 'pointer',
                      borderRadius: 2,
                    },
                  }}
                >
                  <TableCell
                    sx={{ display: 'flex', alignItems: 'center', border: 0 }}
                  >
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => handleRowClick(employee.id)}
                    >
                      {selectedRow === employee.id ? (
                        <KeyboardArrowUp />
                      ) : (
                        <KeyboardArrowDown />
                      )}
                    </IconButton>

                    <Typography
                      variant="subtitle1"
                      color={theme.palette.text.primary}
                      onClick={() =>
                        navigate('/employees/view', { state: employee })
                      }
                      sx={{
                        ':hover': { color: theme.palette.primary[800] },
                        ml: 1,
                      }}
                    >
                      {employee?.user?.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {employee?.job_position?.name}
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {employee?.user?.email}
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    <Button
                      variant="text"
                      onClick={() => handleRowClick(employee.id)}
                    >
                      Expand
                    </Button>
                    <Button
                      variant="text"
                      onClick={() =>
                        navigate('/employees/view', { state: employee })
                      }
                    >
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>

                {selectedRow === employee.id && (
                  <TableRow sx={{ border: 0 }}>
                    <TableCell colSpan={7}>
                      <Collapse
                        in={selectedRow !== null}
                        timeout="auto"
                        unmountOnExit
                      >
                        {loading ? (
                          <TableRow
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 4,
                            }}
                          >
                            <TableCell colSpan={7} sx={{ border: 0 }}>
                              <ActivityIndicator size={20} />
                            </TableCell>
                          </TableRow>
                        ) : error ? (
                          <TableRow sx={{ padding: 4 }}>
                            <TableCell colSpan={7} sx={{ border: 0 }}>
                              <Typography variant="body2">
                                There is error fetching the employee target
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : data.length === 0 ? (
                          <TableRow sx={{ padding: 4 }}>
                            <TableCell colSpan={7} sx={{ border: 0 }}>
                              <Typography variant="body2">
                                There is no target found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              sx={{ width: '100%', border: 0 }}
                            >
                              <PlanTable
                                plans={data.plans.data}
                                unitName={employee?.user.name}
                                unitType={employee?.position}
                                onRefresh={() =>
                                  handleFetchingEmployeePlan(selectedRow)
                                }
                                onRevision={handleEditPlan}
                                onDelete={handleDeletePlan}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update Plan Modal */}

      {selectedPlan && (
        <UpdatePlan
          add={updateModalOpen}
          plan_id={selectedPlan.id}
          planData={selectedPlan}
          onClose={handleUpdateModalClose}
          onSucceed={handlePlanUpdateSuccess}
          isUpdate={true}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{'Confirm Deletion'}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this plan? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            autoFocus
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmployeeTable;
