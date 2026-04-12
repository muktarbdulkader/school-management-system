import {
  Box,
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Download as DownloadIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import { hasPermission, PERMISSIONS } from 'config/rolePermissions';
import { useSelector } from 'react-redux';

function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]); // Teacher's assigned classes
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openSubmissionDialog, setOpenSubmissionDialog] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [openViewStudentsDialog, setOpenViewStudentsDialog] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [mySubmissions, setMySubmissions] = useState({}); // Track student's submissions by assignment ID
  const [submissionData, setSubmissionData] = useState({ submission_url: '' });
  const userRoles = useSelector((state) => state.user?.user?.roles || []);
  const currentUser = useSelector((state) => state.user?.user);
  const canCreateAssignment = hasPermission(userRoles, PERMISSIONS.CREATE_ASSIGNMENT);
  const canEditAssignment = hasPermission(userRoles, PERMISSIONS.EDIT_ASSIGNMENT);
  const canDeleteAssignment = hasPermission(userRoles, PERMISSIONS.DELETE_ASSIGNMENT);
  const canSubmitAssignment = hasPermission(userRoles, PERMISSIONS.SUBMIT_ASSIGNMENT);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: '',
    class_id: '',
    section: '',
    file_url: '',
  });

  useEffect(() => {
    if (canCreateAssignment) {
      fetchTeacherClasses(); // Fetch teacher's assigned classes first
    }
    fetchAssignments();
    if (canSubmitAssignment) {
      fetchMySubmissions(); // Fetch student's own submissions
    }
  }, [canCreateAssignment, canSubmitAssignment]);

  useEffect(() => {
    if (formData.class_id) {
      fetchSections(formData.class_id);
    }
  }, [formData.class_id]);

  const fetchTeacherClasses = async () => {
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.teachersOverviewDashboard}`;
      console.log('Fetching teacher classes from:', Api);
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('Teacher classes response:', responseData);

      if (responseData.success) {
        const teacherSubjects = responseData.data?.subjects || [];
        setTeacherClasses(teacherSubjects);

        if (teacherSubjects.length === 0) {
          toast.info('No teaching assignments found. Please contact admin to assign classes and subjects to you.');
          console.log('No teaching assignments - teacher needs TeacherAssignment records');
        }

        // Extract unique classes
        const uniqueClasses = [...new Map(teacherSubjects.map(item => [item.class_id, {
          id: item.class_id,
          grade: item.class_name
        }])).values()];

        // Extract unique subjects (all subjects teacher teaches)
        const uniqueSubjects = [...new Map(teacherSubjects.map(item => [item.id, {
          id: item.id,
          name: item.name,
          code: item.code
        }])).values()];

        setClasses(uniqueClasses);
        setSubjects(uniqueSubjects);

        console.log('Teacher can teach:', {
          classes: uniqueClasses,
          subjects: uniqueSubjects,
          teacherSubjects: teacherSubjects
        });
      } else {
        toast.warning(responseData.message || 'Could not load your teaching assignments');
        console.error('Failed to load teaching assignments:', responseData);
      }
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      toast.error('Error loading your teaching assignments');
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.api}${Backend.assignments}`;
      console.log('Fetching assignments from:', Api);
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('Assignments response:', responseData);

      if (responseData.success || response.ok) {
        const assignmentsList = responseData.data || responseData.results || [];
        console.log('Assignments list:', assignmentsList);
        console.log('Total assignments count:', responseData.count || assignmentsList.length);
        setAssignments(assignmentsList);
      } else {
        toast.warning(responseData.message || 'Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error(error.message || 'Error fetching assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (classId) => {
    try {
      const token = await GetToken();
      // Filter sections based on teacher's assigned classes
      const teacherSectionsForClass = teacherClasses
        .filter(tc => tc.class_id === classId)
        .map(tc => ({
          id: tc.section_id,
          name: tc.section_name
        }))
        .filter(s => s.id); // Remove null sections

      // Remove duplicates
      const uniqueSections = [...new Map(teacherSectionsForClass.map(item => [item.id, item])).values()];
      setSections(uniqueSections);

      console.log('Sections for class:', classId, uniqueSections);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const getAvailableSubjectsForClass = (classId) => {
    // Filter subjects that teacher teaches for this class
    const subjectsForClass = teacherClasses
      .filter(tc => tc.class_id === classId)
      .map(tc => ({
        id: tc.id, // This is the subject ID from the API
        name: tc.name,
        code: tc.code
      }));

    // Remove duplicates
    return [...new Map(subjectsForClass.map(item => [item.id, item])).values()];
  };

  const handleOpenDialog = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        title: assignment.title,
        description: assignment.description || '',
        subject_id: assignment.subject_id,
        assigned_date: assignment.assigned_date,
        due_date: assignment.due_date,
        class_id: assignment.class_id || '',
        section: assignment.section || '',
        file_url: assignment.file_url || '',
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        title: '',
        description: '',
        subject_id: '',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: '',
        class_id: '',
        section: '',
        file_url: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssignment(null);
  };

  const handleOpenSubmissionDialog = (assignment) => {
    setSubmittingAssignment(assignment);
    setSubmissionData({ submission_url: '' });
    setOpenSubmissionDialog(true);
  };

  const handleOpenViewStudentsDialog = async (assignment) => {
    setViewingAssignment(assignment);
    setOpenViewStudentsDialog(true);
    await fetchStudentSubmissions(assignment.id);
  };

  const handleCloseViewStudentsDialog = () => {
    setOpenViewStudentsDialog(false);
    setViewingAssignment(null);
    setStudentSubmissions([]);
  };

  const fetchStudentSubmissions = async (assignmentId) => {
    setLoadingSubmissions(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.api}${Backend.studentAssignments}?assignment_id=${assignmentId}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success || response.ok) {
        setStudentSubmissions(responseData.data || []);
      } else {
        toast.warning('Failed to fetch student submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const token = await GetToken();
      // Fetch all submissions for the current student
      const Api = `${Backend.api}${Backend.studentAssignments}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success || response.ok) {
        // Create a map of assignment_id -> submission for quick lookup
        const submissionsMap = {};
        (responseData.data || []).forEach(sub => {
          if (sub.assignment_id) {
            submissionsMap[sub.assignment_id] = sub;
          }
        });
        setMySubmissions(submissionsMap);
        console.log('My submissions loaded:', submissionsMap);
      }
    } catch (error) {
      console.error('Error fetching my submissions:', error);
    }
  };

  const hasSubmitted = (assignmentId) => {
    return !!mySubmissions[assignmentId];
  };

  const getMySubmission = (assignmentId) => {
    return mySubmissions[assignmentId];
  };

  const handleCloseSubmissionDialog = () => {
    setOpenSubmissionDialog(false);
    setSubmittingAssignment(null);
    setSubmissionData({ submission_url: '' });
  };

  const handleSubmitAssignment = async () => {
    if (!submissionData.submission_url) {
      toast.error('Please provide a submission URL');
      return;
    }

    try {
      const token = await GetToken();
      const Api = `${Backend.api}${Backend.studentAssignments}`;
      console.log('Submitting assignment to:', Api);

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const payload = {
        assignment_id: submittingAssignment.id,
        submission_url: submissionData.submission_url,
      };

      console.log('Submission payload:', payload);

      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('Submission response:', responseData);

      if (responseData.success || response.ok) {
        toast.success('Assignment submitted successfully');
        handleCloseSubmissionDialog();
        fetchAssignments(); // Refresh the list
        fetchMySubmissions(); // Refresh my submissions
      } else {
        const errorMsg = responseData.message || 'Failed to submit assignment';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error(error.message || 'Error submitting assignment');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.subject_id || !formData.due_date || !formData.class_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = await GetToken();
      const Api = editingAssignment
        ? `${Backend.api}${Backend.assignments}${editingAssignment.id}/`
        : `${Backend.api}${Backend.assignments}`;

      console.log('Submitting assignment to:', Api);
      console.log('Form data:', formData);

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, {
        method: editingAssignment ? 'PUT' : 'POST',
        headers: header,
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();
      console.log('Assignment save response:', responseData);
      console.log('Response status:', response.status);

      if (responseData.success || response.ok) {
        toast.success(
          editingAssignment
            ? 'Assignment updated successfully'
            : 'Assignment created successfully'
        );
        handleCloseDialog();
        fetchAssignments();
      } else {
        console.error('Save failed:', responseData);
        // Show detailed error message
        const errorMsg = responseData.message ||
          (responseData.errors ? JSON.stringify(responseData.errors) : null) ||
          (responseData.detail ? responseData.detail : null) ||
          'Failed to save assignment';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Error saving assignment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const token = await GetToken();
      const Api = `${Backend.api}${Backend.assignments}${id}/`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'DELETE', headers: header });

      if (response.ok || response.status === 204) {
        toast.success('Assignment deleted successfully');
        fetchAssignments();
      } else {
        toast.error('Failed to delete assignment');
      }
    } catch (error) {
      toast.error(error.message || 'Error deleting assignment');
    }
  };

  const getSubjectName = (assignment) => {
    // Use subject_details from API response if available
    if (assignment.subject_details) {
      return assignment.subject_details.name;
    }

    // Fallback: try to find in subjects array using subject_id
    const subjectId = assignment.subject_id;
    let subject = subjects.find((s) => s.id === subjectId);

    // If not found, try to find in teacherClasses
    if (!subject) {
      const teacherSubject = teacherClasses.find((tc) => tc.id === subjectId);
      if (teacherSubject) {
        return teacherSubject.name;
      }
    }

    return subject?.name || 'Unknown Subject';
  };

  const getClassName = (assignment) => {
    // Use class_details from API response if available
    if (assignment.class_details) {
      return assignment.class_details.grade;
    }

    // Fallback: try to find in classes array using class_id
    const classId = assignment.class_id;
    const classObj = classes.find((c) => c.id === classId);
    return classObj?.grade || 'Unknown Class';
  };

  const getSectionName = (assignment) => {
    // Use section_details from API response if available
    if (assignment.section_details) {
      return assignment.section_details.name;
    }

    // If no section assigned
    const sectionId = assignment.section;
    if (!sectionId) return 'All Sections';

    // Fallback: try to find in sections array
    const section = sections.find((s) => s.id === sectionId);
    if (!section) {
      // Try to find in teacherClasses
      const teacherSection = teacherClasses.find((tc) => tc.section_id === sectionId);
      if (teacherSection) {
        return teacherSection.section_name;
      }
    }
    return section?.name || 'Unknown Section';
  };

  const getTeacherName = (assignment) => {
    // Use assigned_by_details from API response if available
    if (assignment.assigned_by_details) {
      return assignment.assigned_by_details.full_name || assignment.assigned_by_details.email || 'Unknown Teacher';
    }
    return 'Not Assigned';
  };

  const getStatusColor = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'error';
    if (diffDays <= 3) return 'warning';
    return 'success';
  };

  const getStatusText = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    return `${diffDays} days left`;
  };

  const filterAssignments = () => {
    const today = new Date();

    switch (tabValue) {
      case 0: // All
        return assignments;
      case 1: // Active
        return assignments.filter(a => new Date(a.due_date) >= today);
      case 2: // Overdue
        return assignments.filter(a => new Date(a.due_date) < today);
      default:
        return assignments;
    }
  };

  const filteredAssignments = filterAssignments();

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: 3 }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Assignments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {canCreateAssignment ? 'Manage and track student assignments' : 'View and submit your assignments'}
            </Typography>
          </Box>
          {canCreateAssignment && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#4285f4' }}
            >
              Create Assignment
            </Button>
          )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`All (${assignments.length})`} />
            <Tab label={`Active (${assignments.filter(a => new Date(a.due_date) >= new Date()).length})`} />
            <Tab label={`Overdue (${assignments.filter(a => new Date(a.due_date) < new Date()).length})`} />
          </Tabs>
        </Box>

        {loading ? (
          <Typography>Loading assignments...</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Class/Section</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Teacher</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No assignments found. Click "Create Assignment" to add one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {assignment.title}
                        </Typography>
                        {assignment.description && (
                          <Typography variant="caption" color="text.secondary">
                            {assignment.description.substring(0, 50)}
                            {assignment.description.length > 50 ? '...' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getClassName(assignment)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getSectionName(assignment)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSubjectName(assignment)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {getTeacherName(assignment)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{assignment.due_date}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Assigned: {assignment.assigned_date}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(assignment.due_date)}
                          size="small"
                          color={getStatusColor(assignment.due_date)}
                        />
                      </TableCell>
                      <TableCell>
                        {canSubmitAssignment && !canEditAssignment ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {assignment.file_url && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                href={assignment.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<DownloadIcon />}
                              >
                                Download
                              </Button>
                            )}
                            {hasSubmitted(assignment.id) ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => {
                                  const sub = getMySubmission(assignment.id);
                                  if (sub?.submission_url) {
                                    window.open(sub.submission_url, '_blank');
                                  }
                                }}
                              >
                                Submitted
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handleOpenSubmissionDialog(assignment)}
                              >
                                Submit
                              </Button>
                            )}
                          </Box>
                        ) : (
                          <>
                            {canEditAssignment && (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenViewStudentsDialog(assignment)}
                                  sx={{ mr: 1 }}
                                  color="info"
                                  title="View Student Submissions"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(assignment)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                            {canDeleteAssignment && (
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(assignment.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  fullWidth
                  required
                  placeholder="e.g., Math Homework Chapter 5"
                />
                <TextField
                  select
                  label="Subject"
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  fullWidth
                  required
                >
                  {(formData.class_id ? getAvailableSubjectsForClass(formData.class_id) : subjects).map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                placeholder="Describe the assignment details..."
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Class"
                  value={formData.class_id}
                  onChange={(e) => {
                    const newClassId = e.target.value;
                    setFormData({
                      ...formData,
                      class_id: newClassId,
                      section: '',
                      subject_id: ''
                    });
                  }}
                  fullWidth
                  required
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.grade}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  fullWidth
                  required
                  disabled={!formData.class_id}
                  helperText={!formData.class_id ? "Please select a class first" : ""}
                >
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                label="Assigned Date"
                type="date"
                value={formData.assigned_date}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Assignment File URL"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                fullWidth
                placeholder="https://drive.google.com/file/... or any file link"
                helperText="Optional: Provide a link to assignment file (Google Drive, Dropbox, etc.)"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.title || !formData.subject_id || !formData.due_date || !formData.class_id || !formData.section}
            >
              {editingAssignment ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Students Dialog */}
        <Dialog open={openViewStudentsDialog} onClose={handleCloseViewStudentsDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Student Submissions - {viewingAssignment?.title}
          </DialogTitle>
          <DialogContent>
            {viewingAssignment && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Class: {getClassName(viewingAssignment)} | Section: {getSectionName(viewingAssignment)} | Subject: {getSubjectName(viewingAssignment)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Due Date: {viewingAssignment.due_date}
                </Typography>
              </Box>
            )}

            {loadingSubmissions ? (
              <Typography>Loading submissions...</Typography>
            ) : studentSubmissions.length === 0 ? (
              <Typography color="text.secondary">No submissions yet.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Student Code</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Submitted Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Submission</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {submission.student_details?.user_details?.full_name ||
                              submission.student_name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {submission.student_details?.student_id || submission.student_code || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {submission.submitted_date ? new Date(submission.submitted_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {submission.submission_url ? (
                            <Button
                              size="small"
                              variant="outlined"
                              href={submission.submission_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Submission
                            </Button>
                          ) : (
                            <Chip label="No Submission" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.grade !== null && submission.grade !== undefined ? (
                            <Chip label={`${submission.grade}%`} size="small" color="success" />
                          ) : (
                            <Chip label="Not Graded" size="small" color="warning" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewStudentsDialog}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Student Submission Dialog */}
        <Dialog open={openSubmissionDialog} onClose={handleCloseSubmissionDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogContent>
            {submittingAssignment && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {submittingAssignment.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Due: {submittingAssignment.due_date}
                </Typography>
              </Box>
            )}
            <TextField
              label="Submission URL"
              value={submissionData.submission_url}
              onChange={(e) => setSubmissionData({ ...submissionData, submission_url: e.target.value })}
              fullWidth
              required
              placeholder="https://drive.google.com/file/..."
              helperText="Provide a link to your completed assignment (Google Drive, Dropbox, etc.)"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSubmissionDialog}>Cancel</Button>
            <Button
              onClick={handleSubmitAssignment}
              variant="contained"
              disabled={!submissionData.submission_url}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <ToastContainer />
    </Box>
  );
}

export default AssignmentsPage;
