import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, Grid, MenuItem, FormControl,
  InputLabel, Select, Checkbox, ListItemText, OutlinedInput
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconLink, IconSchool } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function ClassSubjectAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({
    class_fk: '',
    section: '',
    subject: '',
    teacher: ''
  });

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.teacherAssignments}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAssignments(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch assignments');
      }
    } catch (error) {
      toast.error('Error fetching assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.sections}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSections(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
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

  const fetchSubjects = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.subjects}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
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
    fetchAssignments();
    fetchClasses();
    fetchSections();
    fetchSubjects();
    fetchTeachers();
  }, []);

  const handleOpenDialog = (assignment = null) => {
    if (assignment) {
      setEditMode(true);
      setCurrentAssignment(assignment);
      setFormData({
        class_fk: assignment.class_fk?.id || assignment.class_fk || '',
        section: assignment.section?.id || assignment.section || '',
        subject: assignment.subject?.id || assignment.subject || '',
        teacher: assignment.teacher?.id || assignment.teacher || ''
      });
    } else {
      setEditMode(false);
      setCurrentAssignment(null);
      setFormData({ class_fk: '', section: '', subject: '', teacher: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({ class_fk: '', section: '', subject: '', teacher: '' });
    setCurrentAssignment(null);
    setEditMode(false);
  };

  const handleSubmit = async () => {
    if (!formData.class_fk || !formData.section || !formData.subject) {
      toast.error('Class, Section and Subject are required');
      return;
    }

    try {
      const token = await GetToken();
      const url = editMode
        ? `${Backend.api}${Backend.teacherAssignments}${currentAssignment.id}/`
        : `${Backend.api}${Backend.teacherAssignments}`;

      const payload = {
        class_fk: formData.class_fk,
        section: formData.section,
        subject: formData.subject,
        teacher: formData.teacher || null
      };

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
        toast.success(data.message || `Assignment ${editMode ? 'updated' : 'created'} successfully`);
        handleCloseDialog();
        fetchAssignments();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Error saving assignment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.teacherAssignments}${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success || response.status === 204) {
        toast.success('Assignment deleted successfully');
        fetchAssignments();
      } else {
        toast.error(data.message || 'Failed to delete assignment');
      }
    } catch (error) {
      toast.error('Error deleting assignment');
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    if (!formData.section) {
      toast.error('Please select a section');
      return;
    }
    if (!formData.subject) {
      toast.error('Please select a subject to assign');
      return;
    }

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.teacherAssignments}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          class_fk: selectedClass,
          section: formData.section,
          subject: formData.subject,
          teacher: formData.teacher || null
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Subject assigned to class successfully');
        fetchAssignments();
        setFormData({ ...formData, subject: '', teacher: '' });
      } else {
        toast.error(data.message || 'Failed to assign subject');
      }
    } catch (error) {
      toast.error('Error assigning subject');
    }
  };

  const filteredAssignments = selectedClass
    ? assignments.filter(a =>
      (a.class_fk?.id || a.class_fk) === selectedClass ||
      a.class_fk?.grade === classes.find(c => c.id === selectedClass)?.grade
    )
    : assignments;

  const getClassName = (classFk) => {
    const cls = classes.find(c => c.id === classFk || c.id === (classFk?.id || classFk));
    return cls?.grade || cls?.name || 'Unknown';
  };

  const getSectionName = (sectionId) => {
    const sec = sections.find(s => s.id === sectionId || s.id === (sectionId?.id || sectionId));
    return sec?.name || sec?.code || 'Unknown';
  };

  const getSubjectName = (subjectId) => {
    const sub = subjects.find(s => s.id === subjectId || s.id === (subjectId?.id || subjectId));
    return sub?.name || sub?.code || 'Unknown';
  };

  const getTeacherName = (teacherId) => {
    if (!teacherId) return 'Not Assigned';
    const teacher = teachers.find(t => t.id === teacherId || t.id === (teacherId?.id || teacherId));
    return teacher?.user_details?.full_name || teacher?.name || 'Unknown';
  };

  return (
    <PageContainer title="Class Subject Assignments">
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3">Assign Subjects to Classes</Typography>
            <Typography variant="body2" color="text.secondary">
              Link subjects with classes and assign teachers
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchAssignments}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => handleOpenDialog()}
            >
              Add Assignment
            </Button>
          </Stack>
        </Stack>

        {/* Class Filter & Quick Assign */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Filter by Class"
              >
                <MenuItem value="">All Classes</MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.grade || cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                label="Section"
                disabled={!selectedClass}
              >
                <MenuItem value="">Select Section</MenuItem>
                {sections
                  .filter((s) => s.class_fk?.id === selectedClass || s.class_fk === selectedClass)
                  .map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>
                      {sec.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Subject to Assign</InputLabel>
              <Select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                label="Subject to Assign"
              >
                <MenuItem value="">Select Subject</MenuItem>
                {subjects.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Teacher (Optional)</InputLabel>
              <Select
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                label="Teacher (Optional)"
              >
                <MenuItem value="">No Teacher</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.user_details?.full_name || teacher.name || teacher.teacher_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<IconLink size={18} />}
              onClick={handleBulkAssign}
              disabled={!selectedClass || !formData.section || !formData.subject}
              sx={{ height: '100%' }}
            >
              Assign
            </Button>
          </Grid>
        </Grid>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="primary">{filteredAssignments.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedClass ? 'Assignments in Class' : 'Total Assignments'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="primary">{classes.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Classes</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">{subjects.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Subjects</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main">{teachers.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Teachers</Typography>
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
                  <TableCell>Class</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography sx={{ py: 4 }} color="text.secondary">
                        {selectedClass
                          ? 'No subjects assigned to this class yet. Use the form above to add subjects.'
                          : 'No assignments found. Create one to get started.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconSchool size={18} />
                          <Typography variant="subtitle2" fontWeight={600}>
                            {getClassName(assignment.class_fk)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSectionName(assignment.section)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSubjectName(assignment.subject)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {getTeacherName(assignment.teacher)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(assignment)}
                        >
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(assignment.id)}
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
        <DialogTitle>{editMode ? 'Edit Assignment' : 'Add New Assignment'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Class *</InputLabel>
              <Select
                value={formData.class_fk}
                onChange={(e) => setFormData({ ...formData, class_fk: e.target.value })}
                label="Class *"
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.grade || cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Section *</InputLabel>
              <Select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                label="Section *"
                disabled={!formData.class_fk}
              >
                <MenuItem value="">Select Section</MenuItem>
                {sections
                  .filter((s) => s.class_fk?.id === formData.class_fk || s.class_fk === formData.class_fk)
                  .map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>
                      {sec.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Subject *</InputLabel>
              <Select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                label="Subject *"
              >
                {subjects.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Teacher</InputLabel>
              <Select
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                label="Teacher"
              >
                <MenuItem value="">No Teacher Assigned</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.user_details?.full_name || teacher.name || teacher.teacher_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer >
  );
}

export default ClassSubjectAssignmentsPage;
