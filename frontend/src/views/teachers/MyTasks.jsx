import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Backend from 'services/backend';
import { Storage } from 'configration/storage';

const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    task_type: 'lesson_plan',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: ''
  });

  const taskTypes = [
    { value: 'lesson_plan', label: 'Lesson Planning' },
    { value: 'grading', label: 'Grading' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'parent_communication', label: 'Parent Communication' },
    { value: 'professional_development', label: 'Professional Development' },
    { value: 'administrative', label: 'Administrative' },
    { value: 'other', label: 'Other' }
  ];

  const statusColors = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'default'
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const token = Storage.getItem('token');
      const response = await fetch(`${Backend.api}${Backend.teacherTasks}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const token = Storage.getItem('token');
      const response = await fetch(`${Backend.api}${Backend.teacherTasks}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setOpenDialog(false);
        setFormData({
          task_type: 'lesson_plan',
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          notes: ''
        });
        fetchMyTasks();
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to create task');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const token = Storage.getItem('token');
      const response = await fetch(`${Backend.api}${Backend.teacherTasks}/${taskId}/complete/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchMyTasks();
      } else {
        throw new Error('Failed to complete task');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    return { total, completed, pending, inProgress };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>My Tasks</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Tasks</Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Completed</Typography>
              <Typography variant="h4" color="success.main">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending</Typography>
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>In Progress</Typography>
              <Typography variant="h4" color="info.main">{stats.inProgress}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Task Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Log New Task
        </Button>
      </Box>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="textSecondary" sx={{ py: 4 }}>
                    No tasks found. Create your first task to get started!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    {taskTypes.find(t => t.value === task.task_type)?.label || task.task_type}
                  </TableCell>
                  <TableCell>{task.date}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      color={statusColors[task.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {task.status !== 'completed' && (
                      <IconButton
                        color="success"
                        onClick={() => handleCompleteTask(task.id)}
                        title="Mark as Complete"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Task Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={formData.task_type}
                label="Task Type"
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
              >
                {taskTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={!formData.title || !formData.description}
          >
            Log Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTasks;
