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
  useTheme,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import PlanTable from './PlanTable';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const EmployeeTable = ({ employees }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState(null);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

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
                      View
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
                                page="evaluation"
                                onRefresh={() =>
                                  handleFetchingUnitPlan(selectedRow)
                                }
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
    </>
  );
};

export default EmployeeTable;
