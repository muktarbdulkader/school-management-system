import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Stack, Grid, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Divider, Card, CardContent,
  Tooltip
} from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  IconArrowLeft, IconEdit, IconTrash, IconPlus, IconSchool,
  IconSettings, IconAlertCircle, IconUsers, IconBook
} from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

function AdminClassManage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { classId } = useParams();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(location.state?.classData || null);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Enroll loading state
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({ grade: '', description: '' });
  const [editForm, setEditForm] = useState({ grade: '', description: '' });

  // Fetch all classes in branch
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.classes}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClasses(data.data || []);
          // If classId in URL, find and select that class
          if (classId) {
            const found = data.data.find(c => c.id === classId);
            if (found) {
              setSelectedClass(found);
              setEditForm({ grade: found.grade || '', description: found.description || '' });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [classId]);

  // Create class
  const handleCreate = async () => {
    if (!createForm.grade.trim()) {
      toast.error('Grade/Class name is required');
      return;
    }

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.classes}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Class created successfully');
        setCreateDialogOpen(false);
        setCreateForm({ grade: '', description: '' });
        fetchClasses();
      } else {
        toast.error(data.message || 'Failed to create class');
      }
    } catch (error) {
      toast.error('Error creating class');
    }
  };

  // Edit class
  const handleEdit = async () => {
    if (!selectedClass) return;
    if (!editForm.grade.trim()) {
      toast.error('Grade/Class name is required');
      return;
    }

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.classes}${selectedClass.id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Class updated successfully');
        setEditDialogOpen(false);
        fetchClasses();
      } else {
        toast.error(data.message || 'Failed to update class');
      }
    } catch (error) {
      toast.error('Error updating class');
    }
  };

  // Delete class
  const handleDelete = async () => {
    if (!selectedClass) return;

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.classes}${selectedClass.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok || response.status === 204) {
        toast.success('Class deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedClass(null);
        fetchClasses();
        // Navigate back if we were on this class
        if (classId) {
          navigate('/classes/manage');
        }
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete class');
      }
    } catch (error) {
      toast.error('Error deleting class');
    }
  };

  // Enroll all students in class subjects
  const handleEnrollAll = async () => {
    if (!selectedClass) return;

    setEnrollLoading(true);
    try {
      const token = await GetToken();
      const apiBase = Backend.api.endsWith('/') ? Backend.api.slice(0, -1) : Backend.api;
      const res = await fetch(`${apiBase}/classes/${selectedClass.id}/enroll_all_class_subjects/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Successfully enrolled all students!');
      } else {
        toast.error(data.message || 'Failed to enroll students');
      }
    } catch (error) {
      toast.error('Error during enrollment');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setEditForm({ grade: cls.grade || '', description: cls.description || '' });
    navigate(`/classes/manage/${cls.id}`, { state: { classData: cls } });
  };

  if (loading && classes.length === 0) {
    return (
      <PageContainer title="Class Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <ActivityIndicator size={40} />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Class Management">
      <DrogaCard>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={() => navigate('/')}>
              <IconArrowLeft size={24} />
            </IconButton>
            <Box>
              <Typography variant="h3">Class Management</Typography>
              <Typography variant="body2" color="text.secondary">
                Create, update, and delete classes in your branch
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => navigate('/admin/classes/create')}
          >
            Add New Class / Grade
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {/* Classes List */}
          <Grid item xs={12} md={5}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              <IconSchool size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              All Classes ({classes.length})
            </Typography>

            {classes.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No classes found</Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/admin/classes/create')}
                >
                  Add New Class / Grade
                </Button>
              </Paper>
            ) : (
              <Stack spacing={1}>
                {classes.map((cls) => (
                  <Paper
                    key={cls.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderColor: selectedClass?.id === cls.id ? 'primary.main' : 'divider',
                      bgcolor: selectedClass?.id === cls.id ? 'primary.50' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleSelectClass(cls)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {cls.grade}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {cls.description || 'No description'}
                        </Typography>
                        {cls.branch_details && (
                          <Chip
                            label={cls.branch_details.name}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {/* Student Count Badge */}
                        <Tooltip title="Students enrolled">
                          <Chip
                            icon={<IconUsers size={16} />}
                            label={`${cls.student_count || 0} Students`}
                            size="small"
                            color={cls.student_count > 0 ? 'success' : 'default'}
                            variant="filled"
                          />
                        </Tooltip>
                        {/* Sections Count Badge */}
                        <Tooltip title="Sections">
                          <Chip
                            icon={<IconBook size={16} />}
                            label={`${cls.sections_count || 0} Sections`}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                        {selectedClass?.id === cls.id && (
                          <Chip label="Selected" size="small" color="primary" />
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Grid>

          {/* Selected Class Management */}
          <Grid item xs={12} md={7}>
            {selectedClass ? (
              <>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  <IconSettings size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  Manage: {selectedClass.grade}
                </Typography>

                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={3}>
                      {/* Class Info */}
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Class Information
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {selectedClass.grade}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {selectedClass.description || 'No description provided'}
                        </Typography>
                      </Box>

                      <Divider />

                      {/* Actions */}
                      <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                          Actions
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <Button
                            variant="outlined"
                            startIcon={<IconEdit size={18} />}
                            onClick={() => setEditDialogOpen(true)}
                            fullWidth
                          >
                            Edit Class
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<IconUsers size={18} />}
                            onClick={handleEnrollAll}
                            disabled={enrollLoading}
                            fullWidth
                          >
                            {enrollLoading ? 'Enrolling...' : 'Enroll All Students'}
                          </Button>
                        </Stack>
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<IconTrash size={18} />}
                            onClick={() => setDeleteDialogOpen(true)}
                            fullWidth
                          >
                            Delete Class
                          </Button>
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Class Details */}
                      <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                          Class Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">Class ID</Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedClass.id?.substring(0, 8)}...
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">Created</Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedClass.created_at ? new Date(selectedClass.created_at).toLocaleDateString() : 'N/A'}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <IconSchool size={48} color="#ccc" />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  Select a class to manage
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click on any class from the list on the left to view and edit its details
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DrogaCard>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Class</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Grade/Class Name *"
              value={createForm.grade}
              onChange={(e) => setCreateForm({ ...createForm, grade: e.target.value })}
              placeholder="e.g., Grade 1, Grade 2, etc."
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Optional description for this class"
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!createForm.grade.trim()}>
            Create Class
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Class</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Grade/Class Name *"
              value={editForm.grade}
              onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>
          <IconAlertCircle size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Delete Class
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedClass?.grade}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone. All student enrollments and associated data for this class will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

export default AdminClassManage;
