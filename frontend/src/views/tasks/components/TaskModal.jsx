import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Grid, Stack, 
  Typography, Autocomplete, CircularProgress 
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

const TaskModal = ({ open, task, onClose, onSave, loading }) => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.users}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      title: task?.title || '',
      description: task?.description || '',
      assigned_to: task?.assigned_to || '',
      priority: task?.priority || 'medium',
      due_date: task?.due_date || new Date().toISOString().split('T')[0],
      status: task?.status || 'to_do'
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      title: Yup.string().required('Title is required'),
      assigned_to: Yup.string().required('Assigned user is required'),
      due_date: Yup.date().required('Due date is required'),
    }),
    onSubmit: (values) => {
      onSave(values);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {task ? 'Edit Task' : 'New Task'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Task Title"
              name="title" value={formik.values.title} onChange={formik.handleChange}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth multiline rows={3} label="Description"
              name="description" value={formik.values.description} onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={users}
              getOptionLabel={(o) => o.full_name || o.email || ''}
              loading={usersLoading}
              value={users.find(u => u.id === formik.values.assigned_to) || null}
              onChange={(_, v) => formik.setFieldValue('assigned_to', v?.id || '')}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Assign To" 
                  error={formik.touched.assigned_to && Boolean(formik.errors.assigned_to)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth label="Priority"
              name="priority" value={formik.values.priority} onChange={formik.handleChange}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="date" fullWidth label="Due Date" InputLabelProps={{ shrink: true }}
              name="due_date" value={formik.values.due_date} onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth label="Status"
              name="status" value={formik.values.status} onChange={formik.handleChange}
            >
              <MenuItem value="to_do">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
          onClick={formik.handleSubmit} 
          variant="contained" 
          disabled={loading || !formik.isValid}
          startIcon={loading && <CircularProgress size={16}/>}
        >
          {task ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskModal;
