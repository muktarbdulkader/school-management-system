import React, { useState } from 'react';
import {
  Button,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { toast, ToastContainer } from 'react-toastify';
import { IconSend } from '@tabler/icons-react';
import Backend from 'services/backend';
import PlanTable from './PlanTable';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import StatusModal from 'ui-component/modal/StatusModal';

const EmployeeTable = ({ employees }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState(null);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  //  ============ PLAN VERIFICATION MODAL ========== START =========

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const handleOpenSuccess = (message) => {
    setModalStatus('success');
    setModalTitle('Evaluation Sent');
    setModalMessage(message);
    setModalOpen(true);
  };

  const handleOpenError = (message) => {
    setModalStatus('error');
    setModalTitle('Evaluation is not sent');
    setModalMessage(message);
    setModalOpen(true);
  };

  //  ============ PLAN VERIFICATION MODAL ========== END =========

  const handleRowClick = (employeeId) => {
    if (selectedRow === employeeId) {
      setSelectedRow(null);
    } else {
      setSelectedRow(employeeId);
      handleFetchingUnitPlan(employeeId);
    }
  };

  const handleFetchingUnitPlan = async (employeeId) => {
    setLoading(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.getEmployeeTarget + employeeId;
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
          setData(response.data);
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

  const handleSendingEvaluation = async (employeeID) => {
    setSelectedEmployeeId(employeeID);

    const token = await GetToken();
    const Api = Backend.api + Backend.sendEvaluation + employeeID;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {};

    fetch(Api, { method: 'POST', headers: header, body: JSON.stringify(data) })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          handleOpenSuccess(response?.data?.message || 'Evaluation is successfully sent to employee');
          handleFetchingUnitPlan(employeeID);
        } else {
          handleOpenError(response?.data?.message || 'The evaluation is not delivered to employees');
        }
      })
      .catch((error) => {
        toast.error(error?.message);
      })
      .finally(() => {
        setSelectedEmployeeId(null);
      });
  };

  return (
    <TableContainer component={Paper} sx={{ minHeight: '66dvh', border: 0.4, borderColor: theme.palette.divider, borderRadius: 2 }}>
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
                  backgroundColor: selectedRow == employee.id ? theme.palette.grey[100] : theme.palette.background.default,
                  ':hover': {
                    backgroundColor: theme.palette.grey[100],
                    color: theme.palette.background.default,
                    cursor: 'pointer',
                    borderRadius: 2
                  }
                }}
              >
                <TableCell sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
                  <IconButton aria-label="expand row" size="small" onClick={() => handleRowClick(employee.id)}>
                    {selectedRow === employee.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </IconButton>

                  <Typography
                    variant="subtitle1"
                    color={theme.palette.text.primary}
                    onClick={() => navigate('/employees/view', { state: employee })}
                    sx={{ ':hover': { color: theme.palette.primary[800] }, ml: 1 }}
                  >
                    {employee?.user?.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: 0 }}>{employee?.job_position?.name}</TableCell>
                <TableCell sx={{ border: 0 }}>{employee?.user?.email}</TableCell>
                <TableCell sx={{ border: 0, display: 'flex', alignItems: 'center' }}>
                  <Button variant="text" onClick={() => handleRowClick(employee.id)}>
                    View
                  </Button>
                  {employee?.can_send_evaluation && (
                    <DrogaButton
                      variant="outlined"
                      icon={selectedEmployeeId != employee.id && <IconSend size="1rem" stroke="1.8" style={{ marginRight: 3 }} />}
                      title={
                        selectedEmployeeId === employee.id ? (
                          <ActivityIndicator size="1rem" stroke="1.8" sx={{ color: theme.palette.primary.main }} />
                        ) : (
                          'Send'
                        )
                      }
                      onPress={() => handleSendingEvaluation(employee.id)}
                      sx={{ px: 1.4, ml: 1, minWidth: '70px' }}
                    />
                  )}
                </TableCell>
              </TableRow>

              {selectedRow == employee.id && (
                <TableRow sx={{ border: 0 }}>
                  <TableCell colSpan={7}>
                    <Collapse in={selectedRow !== null} timeout="auto" unmountOnExit>
                      {loading ? (
                        <TableRow sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                          <TableCell colSpan={7} sx={{ border: 0 }}>
                            <ActivityIndicator size={20} />
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow sx={{ padding: 4 }}>
                          <TableCell colSpan={7} sx={{ border: 0 }}>
                            <Typography variant="body2">There is error fetching the employee target</Typography>
                          </TableCell>
                        </TableRow>
                      ) : data.length === 0 ? (
                        <TableRow sx={{ padding: 4 }}>
                          <TableCell colSpan={7} sx={{ border: 0 }}>
                            <Typography variant="body2">There is no target found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ width: '100%', border: 0 }}>
                            <PlanTable
                              plans={data}
                              unitName={employee?.user.name}
                              unitType={employee?.position}
                              page="evaluation"
                              onRefresh={() => handleFetchingUnitPlan(selectedRow)}
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

      <StatusModal open={modalOpen} status={modalStatus} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />

      <ToastContainer />
    </TableContainer>
  );
};

export default EmployeeTable;
