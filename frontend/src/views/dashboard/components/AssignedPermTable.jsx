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
import { PeriodNaming } from 'utils/function';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

import { toast, ToastContainer } from 'react-toastify';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const PlanTable = ({ plans, unitName, unitType, onRefresh }) => {
  const theme = useTheme();
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targetId, setTargetId] = useState(null);

  const [add, setAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentValue, setCurrentValue] = useState('0');

  const handleRowClick = (index) => {
    if (selectedRow === index) {
      setSelectedRow(null);
      setSelectedTarget(null);
    } else {
      setSelectedRow(index);
      setSelectedTarget(null);
    }
  };

  const handleTargetSelection = (targetId) => {
    selectedTarget === targetId ? setSelectedTarget(null) : setSelectedTarget(targetId);
  };


  const handleEvaluation = async (value) => {
    setIsAdding(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.evaluate;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      target_setting_id: targetId,
      actual_value: value?.actual_value,
      description: value?.description
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setIsAdding(false);
          handleEvaluateModalClose();
          toast.success(response.data.message);
          onRefresh();
        } else {
          setIsAdding(false);
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
        setIsAdding(false);
      });
  };

  const handleEvaluateModalClose = () => {
    setAdd(false);
  };
  return (
    <React.Fragment>
      <TableContainer component={Paper} sx={{ minHeight: '22dvh' }}>
        <Table sx={{ minWidth: 450 }} aria-label="unit plan table">
          <TableHead>
            <TableRow>
              <TableCell>KPI Name</TableCell>
              <TableCell>Inherited Weights(%)</TableCell>
              <TableCell>KPI Weights(%)</TableCell>
              <TableCell>Total Targets</TableCell>
              <TableCell>Measuring Unit</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans?.map((plan, index) => (
              <React.Fragment key={index}>
                <TableRow
                  sx={{
                    backgroundColor: selectedRow == index ? theme.palette.grey[50] : theme.palette.background.default,
                    ':hover': {
                      backgroundColor: theme.palette.grey[50],
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

                    <Typography variant="subtitle1" color={theme.palette.text.primary}>
                      {plan?.kpi?.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {plan?.inherit_weight ? parseFloat(plan?.inherit_weight).toFixed(1) + '%' : 'N/A'}{' '}
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>{parseFloat(plan?.weight).toFixed(1)}%</TableCell>
                  <TableCell sx={{ border: 0 }}>{plan?.total_target}</TableCell>
                  <TableCell sx={{ border: 0 }}>{plan?.kpi?.measuring_unit?.name}</TableCell>
                  <TableCell sx={{ border: 0 }}>{plan?.frequency?.name}</TableCell>
                  <TableCell sx={{ border: 0 }}>
                    <Button variant="outlined" onClick={() => handleRowClick(index)}>
                      Targets
                    </Button>
                  </TableCell>
                </TableRow>

     
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {targetId && (
        <EvaluateModal
          add={add}
          unitName={unitName}
          unitType={unitType}
          isAdding={isAdding}
          currentValue={currentValue}
          onClose={handleEvaluateModalClose}
          handleSubmission={(value) => handleEvaluation(value)}
        />
      )}
      <ToastContainer />
    </React.Fragment>
  );
};

export default PlanTable;
