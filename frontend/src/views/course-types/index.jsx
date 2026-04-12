import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, Grid
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconBook } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

import { useSelector } from 'react-redux';

function CourseTypesPage() {
  const user = useSelector((state) => state.user?.user);
  const isSuperUser = user?.is_superuser || user?.roles?.some(r => r.toLowerCase() === 'super_admin');
  const [courseTypes, setCourseTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCourseType, setCurrentCourseType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchCourseTypes = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.courseTypes}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCourseTypes(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch course types');
      }
    } catch (error) {
      toast.error('Error fetching course types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperUser) {
      fetchCourseTypes();
    } else {
      setLoading(false);
    }
  }, [isSuperUser]);

  const handleOpenDialog = (courseType = null) => {
    if (courseType) {
      setEditMode(true);
      setCurrentCourseType(courseType);
      setFormData({
        name: courseType.name || '',
        description: courseType.description || ''
      });
    } else {
      setEditMode(false);
      setCurrentCourseType(null);
      setFormData({ name: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({ name: '', description: '' });
    setCurrentCourseType(null);
    setEditMode(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Course type name is required');
      return;
    }

    try {
      const token = await GetToken();
      const url = editMode
        ? `${Backend.api}${Backend.courseTypes}${currentCourseType.id}/`
        : `${Backend.api}${Backend.courseTypes}`;

      const response = await fetch(url, {
        method: editMode ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || `Course type ${editMode ? 'updated' : 'created'} successfully`);
        handleCloseDialog();
        fetchCourseTypes();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Error saving course type');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course type?')) return;

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.courseTypes}${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success || response.status === 204) {
        toast.success('Course type deleted successfully');
        fetchCourseTypes();
      } else {
        toast.error(data.message || 'Failed to delete course type');
      }
    } catch (error) {
      toast.error('Error deleting course type');
    }
  };

  const getCourseTypeColor = (name) => {
    const colors = {
      'Core': 'primary',
      'Elective': 'warning',
      'Extra': 'success'
    };
    return colors[name] || 'default';
  };

  if (!isSuperUser) {
    return (
      <PageContainer title="Course Types Management">
        <DrogaCard>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h4" color="error" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Only Super Administrators can view and manage course types.
            </Typography>
          </Box>
        </DrogaCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Course Types Management">
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3">Course Types</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage subject classifications (Core, Elective, Extra)
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchCourseTypes}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => handleOpenDialog()}
            >
              Add Course Type
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="primary">{courseTypes.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Course Types</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {courseTypes.filter(ct => ct.name === 'Core').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Core Types</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main">
                {courseTypes.filter(ct => ct.name === 'Elective').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Elective Types</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {courseTypes.filter(ct => ct.name === 'Extra').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Extra Types</Typography>
            </Paper>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <ActivityIndicator size={32} />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courseTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography sx={{ py: 4 }} color="text.secondary">
                        No course types found. Create one to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  courseTypes.map((courseType) => (
                    <TableRow key={courseType.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconBook size={18} />
                          <Typography variant="subtitle2" fontWeight={600}>
                            {courseType.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {courseType.description || (
                          <Typography variant="body2" color="text.secondary">No description</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={courseType.name}
                          size="small"
                          color={getCourseTypeColor(courseType.name)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(courseType)}
                        >
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(courseType.id)}
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DrogaCard>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Course Type' : 'Add New Course Type'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Course Type Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              placeholder="e.g., Core, Elective, Extra"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Enter description for this course type..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

export default CourseTypesPage;
