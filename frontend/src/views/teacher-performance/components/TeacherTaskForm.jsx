import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Grid
} from '@mui/material';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const TeacherTaskForm = ({ open, onClose, onSuccess, teacher }) => {
  const [formData, setFormData] = useState({
    task_type: 'lesson_plan',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const taskTypes = [
    { value: 'lesson_plan', label: 'Lesson Planning' },
    { value: 'grading', label: 'Grading' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'parent_communication', label: 'Parent Communication' },
    { value: 'professional_development', label: 'Professional Development' },
    { value: 'administrative', label: 'Administrative' },
    { value: 'other', label: 'Other' }
  ];

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.teacherTasks}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          teacher: teacher.id
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Task logged successfully');
        onSuccess();
        handleClose();
      } else {
        toast.error(data.message || 'Failed to log task');
      }
    } catch (error) {
      console.error('Error logging task:', error);
      toast.error('Failed to log task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      task_type: 'lesson_plan',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Log Teacher Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Task Type"
                name="task_type"
                value={formData.task_type}
                onChange={handleChange}
                required
              >
                {taskTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {statuses.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="Additional notes (optional)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Logging...' : 'Log Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TeacherTaskForm;
