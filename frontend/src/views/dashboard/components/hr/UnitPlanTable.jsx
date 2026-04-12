import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const StatusLabels = [
  { name: 'Completed', color: '#04c233' },
  { name: 'In Progress', color: '#0390fc' },
  { name: 'Not Started', color: '#fcba03' }
];

const UnitPlanTable = ({ data }) => {
  const getStatusColor = (status) => {
    const statusLabel = StatusLabels.find((label) => label.name === status);
    return statusLabel ? statusLabel.color : '#000000';
  };
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ backgroundColor: '#eee' }}>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Name
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Unit Type
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Manager
              </Typography>
            </TableCell>

            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Parent
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Status
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Weight
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row?.name}</TableCell>
              <TableCell>{row?.unit_type}</TableCell>
              <TableCell>{row?.manager}</TableCell>

              <TableCell>{row?.parent}</TableCell>
              <TableCell sx={{ color: getStatusColor(row.plan_status) }}>{row.plan_status}</TableCell>

              <TableCell>
                <div
                  style={{
                    backgroundColor: getStatusColor(row.plan_status) + '70',
                    borderRadius: '16px',
                    padding: '4px 8px',
                    display: 'inline-block',
                    color: '#000',
                    fontWeight: 'bold'
                  }}
                >
                  {row?.weight_sum}%
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UnitPlanTable;
