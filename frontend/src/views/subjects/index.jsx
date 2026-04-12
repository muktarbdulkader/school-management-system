import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, MenuItem, Grid, Tabs, Tab,
  Card, CardContent, Divider, Tooltip
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconBook, IconCalendar, IconSchool } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { useNavigate } from 'react-router-dom';

function SubjectsPage() {
  const navigate = useNavigate();

  // Tab state for new Subject Management
  const [activeTab, setActiveTab] = useState('legacy'); // 'legacy', 'global', 'class_assignment'

  // Legacy subject state
  const [subjects, setSubjects] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    course_type: '',
    assignment_day: '',
    class_grade: '',
    section: '',
    branch: ''
  });

  // Global Subject Management state
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [globalSubjectLoading, setGlobalSubjectLoading] = useState(false);
  const [globalSubjectDialogOpen, setGlobalSubjectDialogOpen] = useState(false);
  const [globalSubjectEditMode, setGlobalSubjectEditMode] = useState(false);
  const [currentGlobalSubject, setCurrentGlobalSubject] = useState(null);
  const [globalSubjectForm, setGlobalSubjectForm] = useState({
    name: '',
    description: ''
  });

  // Class Subject Assignment state
  const [classSubjects, setClassSubjects] = useState([]);
  const [classSubjectLoading, setClassSubjectLoading] = useState(false);
  const [classSubjectDialogOpen, setClassSubjectDialogOpen] = useState(false);
  const [classSubjectEditMode, setClassSubjectEditMode] = useState(false);
  const [currentClassSubject, setCurrentClassSubject] = useState(null);
  const [classSubjectForm, setClassSubjectForm] = useState({
    class_fk: '',
    global_subject: '',
    subject_code: '',
    book_code: '',
    syllabus: ''
  });
  const [selectedClassForFilter, setSelectedClassForFilter] = useState('');

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.subjects}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch subjects');
      }
    } catch (error) {
      toast.error('Error fetching subjects');
    } finally {
      setLoading(false);
    }
  };

  // Get unique identifier for subject (code + class info)
  const getSubjectUniqueId = (subject) => {
    const classInfo = subject.class_grade_details?.grade || subject.class_grade || '';
    const sectionInfo = subject.section_details?.name || subject.section || '';
    const branchInfo = subject.branch_details?.name || subject.branch || '';

    let identifier = subject.code || '';
    if (classInfo) identifier += ` | Class: ${classInfo}`;
    if (sectionInfo) identifier += ` | Section: ${sectionInfo}`;
    if (branchInfo) identifier += ` | ${branchInfo}`;

    return identifier || 'No Code';
  };

  const fetchCourseTypes = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}course_types/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCourseTypes(data.data || []);
        }
      }
      // Silently fail - non-superusers can't access course types
    } catch (error) {
      // Silently fail
    }
  };

  const fetchClasses = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}classes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClasses(data.data || []);
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  const fetchSections = async (classId) => {
    if (!classId) {
      setSections([]);
      return;
    }
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}sections/?class_fk=${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSections(data.data || []);
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  const fetchBranches = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}branches/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBranches(data.data || []);
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  // Global Subject Management fetch functions
  const fetchGlobalSubjects = async () => {
    setGlobalSubjectLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}global_subjects/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setGlobalSubjects(data.data || []);
      }
    } catch (error) {
      toast.error('Error fetching global subjects');
    } finally {
      setGlobalSubjectLoading(false);
    }
  };

  const handleSaveGlobalSubject = async () => {
    if (!globalSubjectForm.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      const token = await GetToken();
      const url = globalSubjectEditMode
        ? `${Backend.api}global_subjects/${currentGlobalSubject.id}/`
        : `${Backend.api}global_subjects/`;

      const response = await fetch(url, {
        method: globalSubjectEditMode ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(globalSubjectForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(globalSubjectEditMode ? 'Global subject updated' : 'Global subject created');
        fetchGlobalSubjects();
        setGlobalSubjectDialogOpen(false);
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Error saving global subject');
    }
  };

  const handleDeleteGlobalSubject = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this global subject?')) return;

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}global_subjects/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Global subject deactivated');
        fetchGlobalSubjects();
      }
    } catch (error) {
      toast.error('Error deactivating global subject');
    }
  };

  // Class Subject Assignment fetch functions
  const fetchClassSubjects = async (classId = '') => {
    setClassSubjectLoading(true);
    try {
      const token = await GetToken();
      let url = `${Backend.api}class_subject_management/`;
      if (classId) {
        url += `?class_id=${classId}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setClassSubjects(data.data || []);
      }
    } catch (error) {
      toast.error('Error fetching class subjects');
    } finally {
      setClassSubjectLoading(false);
    }
  };

  const handleSaveClassSubject = async () => {
    if (!classSubjectForm.class_fk || !classSubjectForm.global_subject) {
      toast.error('Please select both class and subject');
      return;
    }

    // Validate subject_code format
    if (classSubjectForm.subject_code) {
      const code = classSubjectForm.subject_code;
      if (/^0+\d/.test(code)) {
        toast.error('Subject code cannot have leading zeros (e.g., "01"). Use "1" instead.');
        return;
      }
      if (/-\d/.test(code)) {
        toast.error('Subject code cannot contain negative numbers');
        return;
      }
    }

    try {
      const token = await GetToken();
      const url = classSubjectEditMode
        ? `${Backend.api}class_subject_management/${currentClassSubject.id}/`
        : `${Backend.api}class_subject_management/`;

      const response = await fetch(url, {
        method: classSubjectEditMode ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classSubjectForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(classSubjectEditMode ? 'Class subject updated' : 'Subject assigned to class');
        fetchClassSubjects(selectedClassForFilter);
        setClassSubjectDialogOpen(false);
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Error saving class subject');
    }
  };

  const handleDeleteClassSubject = async (id) => {
    if (!window.confirm('Are you sure you want to remove this subject from the class?')) return;

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}class_subject_management/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Subject removed from class');
        fetchClassSubjects(selectedClassForFilter);
      }
    } catch (error) {
      toast.error('Error removing class subject');
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 'global') {
      fetchGlobalSubjects();
    } else if (newValue === 'class_assignment') {
      fetchClassSubjects(selectedClassForFilter);
      if (classes.length === 0) fetchClasses();
      if (globalSubjects.length === 0) fetchGlobalSubjects();
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchCourseTypes();
    fetchClasses();
    fetchBranches();
  }, []);

  const handleOpenDialog = (subject = null) => {
    if (subject) {
      setEditMode(true);
      setCurrentSubject(subject);
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        description: subject.description || '',
        course_type: subject.course_type_details?.id || subject.course_type || '',
        assignment_day: subject.assignment_day || '',
        class_grade: subject.class_grade || '',
        section: subject.section || '',
        branch: subject.branch || ''
      });
      // Load sections for this class if editing
      if (subject.class_grade) {
        fetchSections(subject.class_grade);
      }
    } else {
      setEditMode(false);
      setCurrentSubject(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        course_type: '',
        assignment_day: '',
        class_grade: '',
        section: '',
        branch: ''
      });
      setSections([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      code: '',
      description: '',
      course_type: '',
      assignment_day: '',
      class_grade: '',
      section: '',
      branch: ''
    });
    setCurrentSubject(null);
    setEditMode(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Subject name and code are required');
      return;
    }

    try {
      const token = await GetToken();
      const url = editMode
        ? `${Backend.api}${Backend.subjects}${currentSubject.id}/`
        : `${Backend.api}${Backend.subjects}`;

      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description
      };

      // Optional fields - only include if they have values
      if (formData.course_type) {
        payload.course_type = formData.course_type;
      }
      if (formData.assignment_day) {
        payload.assignment_day = formData.assignment_day;
      }
      if (formData.class_grade) {
        payload.class_grade = formData.class_grade;
      }
      if (formData.section) {
        payload.section = formData.section;
      }
      if (formData.branch) {
        payload.branch = formData.branch;
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
        toast.success(data.message || `Subject ${editMode ? 'updated' : 'created'} successfully`);
        handleCloseDialog();
        fetchSubjects();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Error saving subject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.subjects}${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success || response.status === 204) {
        toast.success('Subject deleted successfully');
        fetchSubjects();
      } else {
        toast.error(data.message || 'Failed to delete subject');
      }
    } catch (error) {
      toast.error('Error deleting subject');
    }
  };

  return (
    <PageContainer title="Subjects Management">
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3">Subjects Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage curriculum subjects, course types, and assignment schedules
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconBook size={18} />}
              onClick={() => navigate('/course-types')}
            >
              Manage Course Types
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchSubjects}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => handleOpenDialog()}
            >
              Add Subject
            </Button>
          </Stack>
        </Stack>

        {/* New Subject Management Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="Subject Management Tabs">
            <Tab label="Legacy Subjects" value="legacy" />
            <Tab label="Global Subjects" value="global" />
            <Tab label="Class Assignment" value="class_assignment" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 'legacy' && (
          <>
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">{subjects.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Subjects</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main">
                    {subjects.filter(s => s.course_type_details?.name === 'Core').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Core</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main">
                    {subjects.filter(s => s.course_type_details?.name === 'Elective').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Elective</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h3" color="info.main">
                    {new Set(subjects.map(s => s.class_grade_details?.grade || s.class_grade)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Classes</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h3" color="secondary.main">
                    {new Set(subjects.map(s => s.branch_details?.name || s.branch)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Branches</Typography>
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
                      <TableCell>Subject Name</TableCell>
                      <TableCell>Unique Identifier</TableCell>
                      <TableCell>Class/Section</TableCell>
                      <TableCell>Branch</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No subjects found
                        </TableCell>
                      </TableRow>
                    ) : (
                      subjects.map((subject) => (
                        <TableRow key={subject.id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <IconBook size={18} />
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {subject.name}
                                </Typography>
                                {subject.assignment_day && (
                                  <Typography variant="caption" color="text.secondary">
                                    {subject.assignment_day}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={subject.code || 'No Code'}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell>
                            {subject.class_grade_details?.grade || subject.class_grade ? (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Chip
                                  label={`Grade ${subject.class_grade_details?.grade || subject.class_grade}`}
                                  size="small"
                                  color="info"
                                />
                                {subject.section_details?.name || subject.section ? (
                                  <Chip
                                    label={`Sec ${subject.section_details?.name || subject.section}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                ) : (
                                  <Chip
                                    label="All Sections"
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                  />
                                )}
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary">Not assigned to class</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {subject.branch_details?.name || subject.branch ? (
                              <Chip
                                label={subject.branch_details?.name || subject.branch}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={subject.course_type_details?.name || subject.course_type || 'Standard'}
                              size="small"
                              color={
                                subject.course_type_details?.name === 'Core' || subject.course_type === 'Core'
                                  ? 'primary'
                                  : subject.course_type_details?.name === 'Elective' || subject.course_type === 'Elective'
                                    ? 'warning'
                                    : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(subject)}
                              title="Edit"
                            >
                              <IconEdit size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(subject.id)}
                              title="Delete"
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
          </>
        )}

        {/* Global Subjects Tab */}
        {activeTab === 'global' && (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Manage reusable subject names that can be assigned to multiple classes
              </Typography>
              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => {
                  setGlobalSubjectEditMode(false);
                  setGlobalSubjectForm({ name: '', description: '' });
                  setGlobalSubjectDialogOpen(true);
                }}
              >
                Add Global Subject
              </Button>
            </Stack>

            {globalSubjectLoading ? (
              <ActivityIndicator />
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {globalSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No global subjects found
                        </TableCell>
                      </TableRow>
                    ) : (
                      globalSubjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>
                            <Typography variant="subtitle2">{subject.name}</Typography>
                          </TableCell>
                          <TableCell>{subject.description || '-'}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setCurrentGlobalSubject(subject);
                                setGlobalSubjectForm({ name: subject.name, description: subject.description || '' });
                                setGlobalSubjectEditMode(true);
                                setGlobalSubjectDialogOpen(true);
                              }}
                            >
                              <IconEdit size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteGlobalSubject(subject.id)}
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
          </>
        )}

        {/* Class Subject Assignment Tab */}
        {activeTab === 'class_assignment' && (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <TextField
                select
                label="Filter by Class"
                value={selectedClassForFilter}
                onChange={(e) => {
                  setSelectedClassForFilter(e.target.value);
                  fetchClassSubjects(e.target.value);
                }}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Classes</MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.grade}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => {
                  setClassSubjectEditMode(false);
                  setClassSubjectForm({ class_fk: '', global_subject: '', subject_code: '', book_code: '', syllabus: '' });
                  setClassSubjectDialogOpen(true);
                }}
              >
                Assign Subject to Class
              </Button>
            </Stack>

            {classSubjectLoading ? (
              <ActivityIndicator />
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Subject Code</TableCell>
                      <TableCell>Book Reference</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No class subject assignments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      classSubjects.map((cs) => (
                        <TableRow key={cs.id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {cs.class_details?.grade}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {cs.class_details?.branch?.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {cs.global_subject_details?.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={cs.subject_code || 'Auto-generated'}
                              size="small"
                              color={cs.subject_code ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{cs.book_code || '-'}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setCurrentClassSubject(cs);
                                setClassSubjectForm({
                                  class_fk: cs.class_fk,
                                  global_subject: cs.global_subject,
                                  subject_code: cs.subject_code || '',
                                  book_code: cs.book_code || '',
                                  syllabus: cs.syllabus || ''
                                });
                                setClassSubjectEditMode(true);
                                setClassSubjectDialogOpen(true);
                              }}
                            >
                              <IconEdit size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClassSubject(cs.id)}
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
          </>
        )}
      </DrogaCard>

      {/* Legacy Subject Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Basic Info */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Subject Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Subject Code *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                fullWidth
                required
                helperText="Unique identifier for this subject"
                sx={{ minWidth: 200 }}
              />
            </Stack>

            {/* Class Connection Info */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Class Connection (Optional - for class-specific subjects)
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Class/Grade"
                value={formData.class_grade || ''}
                onChange={(e) => {
                  const classId = e.target.value;
                  setFormData({ ...formData, class_grade: classId, section: '' });
                  fetchSections(classId);
                }}
                fullWidth
                helperText={classes.length === 0 ? "Loading classes..." : "Select the class this subject belongs to"}
              >
                <MenuItem value="">None (General Subject)</MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls.id || cls.class_id} value={cls.id || cls.class_id}>
                    Grade {cls.grade} {cls.branch_details?.name || cls.branch_name || ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Section"
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                fullWidth
                disabled={!formData.class_grade || sections.length === 0}
                helperText={!formData.class_grade ? "Select a class first" : sections.length === 0 ? "No sections available" : "Select section (optional)"}
              >
                <MenuItem value="">All Sections (Class-wide)</MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Branch"
                value={formData.branch || ''}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                fullWidth
                helperText={branches.length === 0 ? "Loading branches..." : "Select the branch (optional)"}
              >
                <MenuItem value="">None</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Schedule Info */}
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Assignment Day"
                value={formData.assignment_day || ''}
                onChange={(e) => setFormData({ ...formData, assignment_day: e.target.value })}
                fullWidth
                helperText="Day when assignments are typically given"
              >
                <MenuItem value="">None</MenuItem>
                {daysOfWeek.map((day) => (
                  <MenuItem key={day} value={day}>
                    {day}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Course Type"
                value={formData.course_type || ''}
                onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                fullWidth
                helperText={courseTypes.length === 0 ? "No types available" : "Select course classification"}
              >
                <MenuItem value="">None (Standard)</MenuItem>
                {courseTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Enter subject description, syllabus info, or any additional details"
            />

            {/* Display Info */}
            {editMode && currentSubject && (
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Subject ID:</strong> {currentSubject.id}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Created:</strong> {currentSubject.created_at ? new Date(currentSubject.created_at).toLocaleString() : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Class:</strong> {currentSubject.class_grade_details?.grade || 'Not assigned to specific class'}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Subject Dialog */}
      <Dialog open={globalSubjectDialogOpen} onClose={() => setGlobalSubjectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{globalSubjectEditMode ? 'Edit Global Subject' : 'Add Global Subject'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Subject Name *"
              value={globalSubjectForm.name}
              onChange={(e) => setGlobalSubjectForm({ ...globalSubjectForm, name: e.target.value })}
              fullWidth
              required
              helperText="e.g., Mathematics, English, Physics"
            />
            <TextField
              label="Description"
              value={globalSubjectForm.description}
              onChange={(e) => setGlobalSubjectForm({ ...globalSubjectForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              helperText="Optional description"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGlobalSubjectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveGlobalSubject}>
            {globalSubjectEditMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Class Subject Assignment Dialog */}
      <Dialog open={classSubjectDialogOpen} onClose={() => setClassSubjectDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{classSubjectEditMode ? 'Edit Class Subject' : 'Assign Subject to Class'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Class *"
              value={classSubjectForm.class_fk}
              onChange={(e) => setClassSubjectForm({ ...classSubjectForm, class_fk: e.target.value })}
              fullWidth
              required
              disabled={classSubjectEditMode}
            >
              <MenuItem value="">-- Select Class --</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.grade} {cls.branch_details?.name ? `(${cls.branch_details.name})` : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Select Global Subject *"
              value={classSubjectForm.global_subject}
              onChange={(e) => setClassSubjectForm({ ...classSubjectForm, global_subject: e.target.value })}
              fullWidth
              required
              disabled={classSubjectEditMode}
            >
              <MenuItem value="">-- Select Subject --</MenuItem>
              {globalSubjects.map((subj) => (
                <MenuItem key={subj.id} value={subj.id}>
                  {subj.name}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Subject Code (Optional)"
                value={classSubjectForm.subject_code}
                onChange={(e) => setClassSubjectForm({ ...classSubjectForm, subject_code: e.target.value })}
                fullWidth
                helperText="e.g., MTH-09, ENG-10"
              />
              <TextField
                label="Book Code / Reference"
                value={classSubjectForm.book_code}
                onChange={(e) => setClassSubjectForm({ ...classSubjectForm, book_code: e.target.value })}
                fullWidth
                helperText="ISBN or book title"
              />
            </Stack>

            <TextField
              label="Syllabus / Content"
              value={classSubjectForm.syllabus}
              onChange={(e) => setClassSubjectForm({ ...classSubjectForm, syllabus: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Topics, content, or syllabus for this class"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassSubjectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveClassSubject}>
            {classSubjectEditMode ? 'Update' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

export default SubjectsPage;