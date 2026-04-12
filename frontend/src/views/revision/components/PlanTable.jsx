import React, { useState } from 'react';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  Box,
} from '@mui/material';
import { IconCircleFilled } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { DotMenu } from 'ui-component/menu/DotMenu';
import hasPermission from 'utils/auth/hasPermission';
import { useNavigate } from 'react-router-dom';

const PlanTable = ({
  hideActions,
  plans,
  unitName,
  unitType,
  onRefresh,
  onEdit,
  onDelete,
  onRevision,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState(null);

  const handleRowClick = (index, planID) => {
    setSelectedRow(index);
  };

  const handleEdit = (plan) => {
    if (onRevision) {
      onRevision(plan);
    }
  };

  const handleDelete = (plan) => {
    if (onDelete) {
      onDelete(plan.id);
    }
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
              {/* {!hideActions && <TableCell>Action</TableCell>} */}
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans?.map((plan, index) => (
              <TableRow
                key={plan?.id}
                sx={{
                  backgroundColor:
                    selectedRow == index
                      ? theme.palette.grey[50]
                      : theme.palette.background.default,
                  ':hover': {
                    backgroundColor: theme.palette.grey[50],
                    cursor: 'pointer',
                  },
                }}
                onClick={() => handleRowClick(index, plan?.id)}
              >
                <TableCell
                  sx={{ display: 'flex', alignItems: 'center', border: 0 }}
                >
                  {selectedRow === index && (
                    <IconCircleFilled
                      size="0.6rem"
                      style={{ color: theme.palette.primary[800] }}
                    />
                  )}
                  <Typography variant="subtitle1" ml={1}>
                    {plan?.kpi}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  {plan?.inherit_weight
                    ? parseFloat(plan?.inherit_weight).toFixed(1) + '%'
                    : 'N/A'}
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  {parseFloat(plan?.weight).toFixed(1)}%
                </TableCell>
                <TableCell sx={{ border: 0 }}>{plan?.total_target}</TableCell>
                <TableCell sx={{ border: 0 }}>{plan?.measuring_unit}</TableCell>
                <TableCell sx={{ border: 0 }}>{plan?.frequency}</TableCell>
                {/* {!hideActions && ( */}
                <TableCell sx={{ border: 0 }}>
                  <DotMenu
                    orientation="vertical"
                    onRevision={
                      onRevision && hasPermission('update:kpitracker')
                        ? () => handleEdit(plan)
                        : null
                    }
                    onDelete={
                      onDelete && hasPermission('delete:kpitracker')
                        ? () => handleDelete(plan)
                        : null
                    }
                  />
                </TableCell>
                {/* )} */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </React.Fragment>
  );
};

export default PlanTable;
