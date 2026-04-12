import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, MenuItem, Grid, Avatar
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconUser, IconDoor, IconUsers } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    class_fk: '',
    class_teacher_id: '',
    room_number: '',
    capacity: ''
  });

  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.sections}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSections(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch sections');
      }
    } catch (error) {
      toast.error('Error fetching sections');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.classes}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setClasses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.teachers}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTeachers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchClasses();
    fetchTeachers();
  }, []);

  const handleOpenDialog = (section = null) => {
    if (section) {
      setEditMode(true);
      setCurrentSection(section);
      setFormData({
        name: section.name || '',
        class_fk: section.class_details?.id || section.class_fk || '',
        class_teacher_id: section.class_teacher_details?.id || section.class_teacher_id || '',
        room_number: section.room_number || '',
        capacity: section.capacity || ''
      });
    } else {
      setEditMode(false);
      setCurrentSection(null);
      setFormData({ name: '', class_fk: '', class_teacher_id: '', room_number: '', capacity: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({ name: '', class_fk: '', class_teacher_id: '', room_number: '', capacity: '' });
    setCurrentSection(null);
    setEditMode(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.class_fk || !formData.room_number || !formData.capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = await GetToken();
      const url = editMode
        ? `${Backend.api}${Backend.sections}${currentSection.id}/`
        : `${Backend.api}${Backend.sections}`;

      const payload = {
        name: formData.name,
        class_fk: formData.class_fk,
        room_number: formData.room_number,
        capacity: parseInt(formData.capacity)
      };

      if (formData.class_teacher_id) {
        payload.class_teacher_id = formData.class_teacher_id;
      }

      const response = await fetch(url, {
        method: editMode ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || `Section ${editMode ? 'updated' : 'created'} successfully`);
        handleCloseDialog();
        fetchSections();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Error saving section');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.sections}${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success || response.status === 204) {
        toast.success('Section deleted successfully');
        fetchSections();
      } else {
        toast.error(data.message || 'Failed to delete section');
      }
    } catch (error) {
      toast.error('Error deleting section');
    }
  };

  return (
    <PageContainer title="Sections Management">
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3">Sections Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage class sections, room assignments, and class teachers
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchSections}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => handleOpenDialog()}
            >
              Add Section
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="primary">{sections.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Sections</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {new Set(sections.map(s => s.class_details?.grade)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">Grades</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main">
                {sections.filter(s => s.class_teacher_details).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">With Teachers</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="info.main">
                {sections.reduce((sum, s) => sum + (s.capacity || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Capacity</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="secondary.main">{classes.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Classes</Typography>
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
                  <TableCell>Unique ID</TableCell>
                  <TableCell>Class-Section</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Class Teacher</TableCell>
                  <TableCell>Subject Teachers</TableCell>
                  <TableCell>Room/Capacity</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No sections found
                    </TableCell>
                  </TableRow>
                ) : (
                  sections.map((section) => {
                    const grade = section.class_details?.grade || '?';
                    const sectionName = section.name || '?';
                    const branchName = section.class_details?.branch_details?.name || '';
                    const uniqueId = `${grade}${sectionName}${branchName ? '-' + branchName.substring(0, 3).toUpperCase() : ''}`;

                    return (
                      <TableRow key={section.id} hover>
                        <TableCell>
                          <Chip
                            label={uniqueId}
                            size="small"
                            color="primary"
                            sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.9rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={`Grade ${grade}`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                            <Typography variant="h6" color="text.secondary">/</Typography>
                            <Chip
                              label={`Section ${sectionName}`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {branchName ? (
                            <Chip
                              label={branchName}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {section.class_teacher_details ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {section.class_teacher_details.user?.full_name?.charAt(0) || 'T'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">
                                  {section.class_teacher_details.user?.full_name || '—'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {section.class_teacher_details.user?.email || ''}
                                </Typography>
                              </Box>
                            </Stack>
                          ) : (
                            <Chip
                              label="Not Assigned"
                              size="small"
                              variant="outlined"
                              color="default"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {section.teacher_assignments?.length > 0 ? (
                            <Stack spacing={0.5}>
                              {section.teacher_assignments.slice(0, 2).map((ta, i) => (
                                <Stack key={i} direction="row" spacing={0.5} alignItems="center">
                                  <Chip
                                    label={ta.teacher_name}
                                    size="small"
                                    color={ta.is_primary ? 'primary' : 'default'}
                                    variant={ta.is_primary ? 'filled' : 'outlined'}
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    → {ta.subject_name}
                                  </Typography>
                                </Stack>
                              ))}
                              {section.teacher_assignments.length > 2 && (
                                <Typography variant="caption" color="text.secondary">
                                  +{section.teacher_assignments.length - 2} more
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Chip
                              label="No Teachers"
                              size="small"
                              variant="outlined"
                              color="default"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Chip label={section.room_number} size="small" icon={<IconDoor size={14} />} />
                            <Chip
                              label={`${section.capacity} students`}
                              size="small"
                              icon={<IconUsers size={14} />}
                              color="info"
                              variant="outlined"
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(section)}
                            title="Edit"
                          >
                            <IconEdit size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(section.id)}
                            title="Delete"
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DrogaCard>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Section' : 'Add New Section'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Section Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              helperText="e.g., A, B, C"
            />
            <TextField
              select
              label="Class/Grade *"
              value={formData.class_fk}
              onChange={(e) => setFormData({ ...formData, class_fk: e.target.value })}
              fullWidth
              helperText="Select the grade and branch"
            >
              {classes.length === 0 ? (
                <MenuItem disabled>
                  <Typography color="text.secondary">No classes available</Typography>
                </MenuItem>
              ) : (
                classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={`Grade ${cls.grade}`} size="small" color="info" />
                      {cls.branch_details?.name && (
                        <Chip label={cls.branch_details.name} size="small" variant="outlined" color="secondary" />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        (ID: {cls.id?.substring(0, 8)}...)
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))
              )}
            </TextField>
            <TextField
              select
              label="Class Teacher"
              value={formData.class_teacher_id}
              onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value })}
              fullWidth
              helperText="Optional - Assign a class teacher"
            >
              <MenuItem value="">None</MenuItem>
              {teachers.map((teacher) => (
                <MenuItem key={teacher.id} value={teacher.id}>
                  {teacher.user?.full_name || teacher.full_name} - {teacher.user?.email || teacher.email}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Room Number *"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              fullWidth
              helperText="Must be unique"
            />
            <TextField
              label="Capacity *"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              fullWidth
              helperText="Maximum number of students"
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

export default SectionsPage;
