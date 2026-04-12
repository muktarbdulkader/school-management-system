import React, { useState } from 'react';
import {
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
import { PeriodNaming } from 'utils/function';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { DotMenu } from 'ui-component/menu/DotMenu';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import axios from 'axios';
import DeletePrompt from 'ui-component/modal/DeletePrompt';

const TargetTable = ({ plans, onRefresh }) => {
  const theme = useTheme();
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState();
  const [deletePlan, setDeletePlan] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleRowClick = (index) => {
    if (selectedRow === index) {
      setSelectedRow(null);
      setSelectedTarget(null);
    } else {
      setSelectedRow(index);
      setSelectedTarget(null);
    }
  };

  const handleDeleteClick = (plan) => {
    setSelectedPlan(plan);
    setDeletePlan(true);
  };

  const handleDeleteChildPlan = async () => {
    setDeleting(true);
    try {
      const token = await GetToken();
      const Api = Backend.api + Backend.deletePlan + `/${selectedPlan?.id}`;
      const response = await axios.delete(Api, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setDeletePlan(false);
        toast.success(response.data.data.message);
        onRefresh();
      } else {
        toast.error(response.data.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <React.Fragment>
      <TableContainer component={Paper} sx={{ marginY: 2, backgroundColor: theme.palette.background.paper, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="Distributed target table">
          <TableHead>
            <TableRow>
              <TableCell>Unit name</TableCell>
              <TableCell>Inherited Weights(%)</TableCell>
              <TableCell>KPI Weights(%)</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans?.map((plan, index) => (
              <>
                <TableRow
                  key={index}
                  sx={{
                    backgroundColor: selectedRow == index && theme.palette.grey[50],
                    ':hover': {
                      backgroundColor: theme.palette.primary.light,
                      color: theme.palette.background.default,
                      cursor: 'pointer',
                      borderRadius: 2
                    }
                  }}
                >
                  <TableCell sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
                    <IconButton aria-label="expand row" size="small" onClick={() => handleRowClick(index)}>
                      {selectedRow === index ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                    <Typography variant="subtitle1" color={theme.palette.text.primary} sx={{ marginLeft: 2 }}>
                      {' '}
                      {plan?.unit ? plan?.unit?.name : plan?.employee?.user?.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>{parseFloat(plan?.inherit_weight).toFixed(1)}%</TableCell>
                  <TableCell sx={{ border: 0 }}>{parseFloat(plan?.weight).toFixed(1)}%</TableCell>
                  <TableCell sx={{ border: 0 }}>{parseFloat(plan?.total_target).toFixed(1)}</TableCell>
                  <TableCell sx={{ border: 0 }}>
                    <DotMenu onView={() => handleRowClick(index)} onDelete={() => handleDeleteClick(plan)} />
                  </TableCell>
                </TableRow>

                {selectedRow == index && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Collapse
                        in={selectedRow !== null}
                        timeout="auto"
                        unmountOnExit
                        sx={{ backgroundColor: theme.palette.background.default, borderRadius: 2 }}
                      >
                        <Table
                          sx={{
                            minWidth: 650
                          }}
                          aria-label="Organization plan table"
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell>Period</TableCell>
                              <TableCell>Target</TableCell>
                            </TableRow>
                          </TableHead>
                          
                          <TableBody>
                            {plan?.target?.map((target, index) => (
                              <TableRow
                                key={index}
                                sx={
                                  selectedTarget == target.id
                                    ? {
                                        backgroundColor: theme.palette.background.default,
                                        ':hover': {
                                          backgroundColor: theme.palette.grey[100],
                                          color: theme.palette.background.default,
                                          cursor: 'pointer',
                                          borderRadius: 2
                                        }
                                      }
                                    : {
                                        backgroundColor: theme.palette.primary.light,
                                        ':hover': {
                                          backgroundColor: theme.palette.grey[100],
                                          color: theme.palette.background.default,
                                          cursor: 'pointer',
                                          borderRadius: 2
                                        }
                                      }
                                }
                              >
                                <TableCell sx={{ border: 0 }}>{PeriodNaming(plan?.frequency?.name) + ' ' + (index + 1)}</TableCell>
                                <TableCell sx={{ border: 0, fontWeight: 'bold' }}>{target?.target}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {deletePlan && (
        <DeletePrompt
          type="Delete"
          open={deletePlan}
          title="Deleting child plan"
          description={`Are you sure you want to delete ${selectedPlan?.unit ? selectedPlan?.unit?.name + ' unit' : selectedPlan?.employee?.user?.name}`}
          onNo={() => setDeletePlan(false)}
          onYes={() => handleDeleteChildPlan()}
          deleting={deleting}
          handleClose={() => setDeletePlan(false)}
        />
      )}
    </React.Fragment>
  );
};

export default TargetTable;
