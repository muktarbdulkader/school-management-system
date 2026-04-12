import React, { useEffect, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Tabs, Tab, Grid, Box } from '@mui/material';

const AddEditEodModal = ({
  open,
  handleClose,
  handleSave,
  formValues,
  handleChange,
  handleTabChange,
  tabIndex,
  editIndex,
  formErrors,
  isLoading
}) => {
const [isPlanReadOnly, setIsPlanReadOnly] = useState(false);

  useEffect(() => {
    if (editIndex !== null) {
      setIsPlanReadOnly(true);
    } else {
      setIsPlanReadOnly(false);
    }
  }, [editIndex]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      sx={{
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <DialogTitle>{editIndex !== null ? 'Edit EOD Activity' : 'Add EOD Activity'}</DialogTitle>
      <DialogContent>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="EOD Activity" />
          {editIndex !== null && <Tab label="EOD Revenue" />}
        </Tabs>
        <Box mt={2}>
          {tabIndex === 0 && (
            <Grid container spacing={2}>
              {editIndex === null && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date"
                    name="date"
                    type="date"
                    value={formValues.date || ''}
                    onChange={handleChange}
                    InputLabelProps={{
                      shrink: true
                    }}
                    error={!!formErrors.date}
                    helperText={formErrors.date ? formErrors.date[0] : ''}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Plan"
                  name="plan"
                  value={formValues.plan || ''}
                  onChange={handleChange}
                  error={!!formErrors.plan}
                  helperText={formErrors.plan ? formErrors.plan[0] : ''}
                  InputProps={{
                    readOnly: isPlanReadOnly
                  }}
                  multiline
                  rows={5}
                  variant="outlined"
                />
              </Grid>
              {editIndex !== null && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Completed"
                      name="completed"
                      value={formValues.completed || ''}
                      onChange={handleChange}
                      error={!!formErrors.completed}
                      helperText={formErrors.completed ? formErrors.completed[0] : ''}
                      multiline
                      rows={5}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Challenge Faced"
                      name="challenge_faced"
                      value={formValues.challenge_faced || ''}
                      onChange={handleChange}
                      error={!!formErrors.challenge_faced}
                      helperText={formErrors.challenge_faced ? formErrors.challenge_faced[0] : ''}
                      multiline
                      rows={5}
                      variant="outlined"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}
          {tabIndex === 1 && editIndex !== null && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Revenue"
                  name="revenue"
                  value={formValues.revenue || ''}
                  onChange={handleChange}
                  error={!!formErrors.revenue}
                  helperText={formErrors.revenue ? formErrors.revenue[0] : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expenses"
                  name="expenses"
                  value={formValues.expenses || ''}
                  onChange={handleChange}
                  error={!!formErrors.expenses}
                  helperText={formErrors.expenses ? formErrors.expenses[0] : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Customer Satisfaction"
                  name="customer_satisfaction"
                  value={formValues.customer_satisfaction || ''}
                  onChange={handleChange}
                  error={!!formErrors.customer_satisfaction}
                  helperText={formErrors.customer_satisfaction ? formErrors.customer_satisfaction[0] : ''}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditEodModal;
