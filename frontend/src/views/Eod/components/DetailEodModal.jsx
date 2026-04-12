import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper
} from '@mui/material';

const DetailEodModal = ({ detailOpen, handleCloseDetails, selectedRecord }) => {
  const detailRows = selectedRecord
    ? [
        { id: 1, field: 'Revenue', value: selectedRecord.revenue ? `${selectedRecord.revenue} Birr` : 'N/A' },
        { id: 2, field: 'Expenses', value: selectedRecord.expenses ? `${selectedRecord.expenses} Birr` : 'N/A' },
        { id: 4, field: 'Customer Satisfaction', value: selectedRecord.customer_satisfaction || 'N/A' },
        { id: 5, field: 'Plan', value: selectedRecord.Plan || 'N/A' }
        // { id: 6, field: 'Customer Satisfaction', value: selectedRecord.customer_satisfaction }
      ]
    : [];

  return (
    <Dialog
      open={detailOpen}
      onClose={handleCloseDetails}
      sx={{
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <DialogTitle>Record Details</DialogTitle>
      <DialogContent>
        {selectedRecord ? (
          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                {detailRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.field}</TableCell>
                    <TableCell>{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <p>No details available.</p>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDetails} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailEodModal;
