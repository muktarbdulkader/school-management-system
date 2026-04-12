import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Stack, Tabs, Tab, 
  Button, TextField, InputAdornment, Card, 
  CardContent, CircularProgress, Alert, Tooltip,
  IconButton, useTheme, Divider
} from '@mui/material';
import { 
  IconPlus, IconSearch, IconRefresh, 
  IconLayoutGrid, IconFilter, IconChartBar,
  IconChecklist, IconSend, IconAlertCircle
} from '@tabler/icons-react';
import { toast, ToastContainer } from 'react-toastify';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';

const TasksPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      let endpoint = Backend.api + Backend.myTasks;
      if (activeTab === 1) endpoint = Backend.api + Backend.tasksCreatedByMe;
      
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.data || []);
      }
      
      // Fetch stats
      const statsRes = await fetch(`${Backend.api}${Backend.tasksStatistics}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      toast.error('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      const token = await GetToken();
      const method = selectedTask ? 'PUT' : 'POST';
      const endpoint = selectedTask ? 
        `${Backend.api}${Backend.tasks}${selectedTask.id}/` : 
        `${Backend.api}${Backend.tasks}`;
      
      const res = await fetch(endpoint, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success || res.status === 201 || res.status === 200) {
        toast.success(selectedTask ? 'Task updated' : 'Task created');
        setModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to save task');
      }
    } catch (err) {
      toast.error('Error saving task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.tasks}${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 204 || res.status === 200) {
        toast.success('Task deleted');
        fetchData();
      }
    } catch (err) {
      toast.error('Error deleting task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.tasks}${task.id}/`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.status === 200) {
        toast.info('Status updated');
        fetchData();
      }
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer title="Task Management">
      <DrogaCard>
        {/* Header Section */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h3">Task Hive</Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Organize, track and complete school tasks efficiently.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchData} color="primary" sx={{ border: 1, borderColor: 'divider' }}>
                <IconRefresh size={20}/>
              </IconButton>
            </Tooltip>
            <Button 
              variant="contained" 
              startIcon={<IconPlus />} 
              onClick={() => { setSelectedTask(null); setModalOpen(true); }}
            >
              New Task
            </Button>
          </Stack>
        </Stack>

        {/* Statistics Bar */}
        {stats && (
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">{stats.total_tasks}</Typography>
                <Typography variant="caption" fontWeight={700}>Total Tasks</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#f0fff4', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">{stats.completed_tasks}</Typography>
                <Typography variant="caption" fontWeight={700}>Completed</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#fff9db', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">{stats.pending_tasks}</Typography>
                <Typography variant="caption" fontWeight={700}>Pending</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 2, bgcolor: '#fff5f5', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">{stats.overdue_tasks}</Typography>
                <Typography variant="caption" fontWeight={700}>Overdue</Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Navigation Tabs & Search */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" mb={3}>
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)} 
            textColor="primary" 
            indicatorColor="primary"
          >
            <Tab icon={<IconChecklist size={20}/>} iconPosition="start" label="Assigned to Me" />
            <Tab icon={<IconSend size={20}/>} iconPosition="start" label="Tasks I Created" />
            <Tab icon={<IconChartBar size={20}/>} iconPosition="start" label="Insights" />
          </Tabs>

          <TextField
             placeholder="Search tasks..."
             size="small"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             InputProps={{
               startAdornment: <InputAdornment position="start"><IconSearch size={18}/></InputAdornment>
             }}
             sx={{ minWidth: 280 }}
          />
        </Stack>

        <Divider sx={{ mb: 3 }}/>

        {/* Task Grid */}
        {loading ? (
          <Box py={10} textAlign="center"><CircularProgress /></Box>
        ) : filteredTasks.length > 0 ? (
          <Grid container spacing={3}>
            {filteredTasks.map(task => (
              <Grid item xs={12} sm={6} lg={4} key={task.id}>
                <TaskCard 
                  task={task} 
                  onEdit={(t) => { setSelectedTask(t); setModalOpen(true); }}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box py={10} textAlign="center" sx={{ bgcolor: 'grey.50', borderRadius: 3, border: '2px dashed', borderColor: 'divider' }}>
            <IconAlertCircle size={48} color={theme.palette.text.disabled}/>
            <Typography variant="h4" mt={2} color="text.secondary">No tasks found</Typography>
            <Typography variant="body2" color="text.secondary">
              Try a different filter or create a new task.
            </Typography>
          </Box>
        )}
      </DrogaCard>

      <TaskModal 
        open={modalOpen} 
        task={selectedTask}
        loading={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
      <ToastContainer />
    </PageContainer>
  );
};

export default TasksPage;
