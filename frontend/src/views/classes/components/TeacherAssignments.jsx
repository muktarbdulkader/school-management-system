import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Chip,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
  Button,
  LinearProgress,
  Typography,
  Stack,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { format } from 'date-fns';
import PageContainer from 'ui-component/MainPage';
import Search from 'ui-component/search';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import AddButton from 'ui-component/buttons/AddButton';
import { IconAdjustments } from '@tabler/icons-react';
import RightSlideIn from 'ui-component/modal/RightSlideIn';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import AddAssignments from './AddAssignments';

const getTypeColor = (type) => {
  switch (type) {
    case 'Worksheet':
      return 'primary';
    case 'Quiz':
      return 'secondary';
    case 'Project':
      return 'info';
    case 'Lab Report':
      return 'primary';
    case 'Exam':
      return 'warning';
    case 'Assignment':
      return 'success';
    default:
      return 'default';
  }
};

const getProgressColor = (percentage) => {
  if (percentage >= 80) return 'success';
  if (percentage >= 50) return 'warning';
  return 'error';
};

// Helper function to parse submitted string like "0/1"
const parseSubmitted = (submittedString) => {
  if (!submittedString) return { submitted: 0, total: 0 };

  const parts = submittedString.split('/');
  if (parts.length !== 2) return { submitted: 0, total: 0 };

  return {
    submitted: parseInt(parts[0], 10) || 0,
    total: parseInt(parts[1], 10) || 0,
  };
};

export default function AssignmentsDashboard({
  assignmentsData = [],
  refreshAssignments,
  classData,
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [add, setAdd] = useState(false);
  const [isAddingAssignments, setIsAddingAssignments] = useState(false);

  const [search, setSearch] = useState('');
  const [openAddAssignment, setOpenAddAssignment] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [teacherStudents, setTeacherStudents] = useState([]); // raw my_students data
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    last_page: 1,
    total: assignmentsData.length,
  });
  const [filterApplied, setFilterApplied] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [manageGroupModalOpen, setManageGroupModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    file_url: '',
    max_points: 100,
    is_group_assignment: false,
  });


  // Update pagination when assignmentsData changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: assignmentsData.length,
    }));
  }, [assignmentsData]);

  // const handleOpenAddAssignment = () => setOpenAddAssignment(true);
  // const handleCloseAddAssignment = () => setOpenAddAssignment(false);

  const handleAssignmentModalClose = () => {
    setAdd(false);
  };

  const handleFetchingTeacherClasses = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.teachersOverviewDashboard}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        const teacherSubjects = responseData.data?.subjects || [];

        // Extract unique classes
        const uniqueClasses = [...new Map(teacherSubjects.map(item => [item.class_id, {
          id: item.class_id,
          grade: item.class_name
        }])).values()];

        // Extract unique sections
        const uniqueSections = [...new Map(teacherSubjects.map(item => [item.section_id, {
          id: item.section_id,
          name: item.section_name
        }])).values()].filter(s => s.id);

        // Extract unique subjects
        const uniqueSubjects = [...new Map(teacherSubjects.map(item => [item.id, {
          id: item.id,
          name: item.name,
          code: item.code
        }])).values()];

        setTeacherSubjects(teacherSubjects);
        setClasses(uniqueClasses);
        setSections(uniqueSections);
        setSubjects(uniqueSubjects);
      } else {
        toast.warning(responseData.message || 'Could not load your teaching assignments');
      }
    } catch (error) {
      toast.error('Error loading your teaching assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchingStudents = async () => {
    setLoading(true);
    const token = await GetToken();
    // Use teacher's own student list, not the global students endpoint
    const Api = `${Backend.auth}${Backend.teachersMyStudents}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        const rawStudents = responseData.data || [];
        setTeacherStudents(rawStudents);
        // Transform to AddAssignments expected format
        const transformed = rawStudents.map((s) => ({
          id: s.student_id,
          user_details: {
            full_name: s.name,
            avatar: s.avatar || null,
          },
          grade_details: { grade: s.class },
          section_details: { name: s.section },
          // keep original fields too
          class: s.class,
          section: s.section,
        }));
        setStudents(transformed);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchingTeacherClasses();
    handleFetchingStudents();
    // Refresh assignments list when component mounts
    if (refreshAssignments) {
      refreshAssignments();
    }
  }, []);

  // Refresh assignments when classData changes (when navigating between classes)
  useEffect(() => {
    if (refreshAssignments && classData) {
      refreshAssignments();
    }
  }, [classData?.id, classData?.class_id, classData?.section_id]);

  const handleAddAssignmentClick = () => {
    setAdd(true);
    handleFetchingTeacherClasses();
    handleFetchingStudents();
  };

  const handleSubmitAssignment = async (lessonData, onSuccess) => {
    setIsAddingAssignments(true);
    const token = await GetToken();
    const Api = Backend.auth + Backend.assignments;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      // Build payload with ONLY the fields the backend serializer accepts
      const payload = {
        title: lessonData.title,
        description: lessonData.description || '',
        subject_id: lessonData.subject_id,
        assigned_date: lessonData.assigned_date || new Date().toISOString().split('T')[0],
        due_date: lessonData.due_date,
        class_id: lessonData.class_id || null,
        section: lessonData.section || null,
        is_group_assignment: Boolean(lessonData.is_group_assignment),
        students: lessonData.students || [],
        file_url: lessonData.file_url || null,
        max_score: lessonData.max_points || 100,
      };

      // Remove null values for optional fields to avoid backend validation issues
      if (!payload.section) delete payload.section;
      if (!payload.class_id) delete payload.class_id;
      if (!payload.file_url) delete payload.file_url;

      console.log('Submitting assignment payload:', payload);

      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('Assignment POST response:', responseData);

      if (response.ok && responseData.success) {
        toast.success('Assignment added successfully');
        if (onSuccess) onSuccess();
        handleAssignmentModalClose();
        if (refreshAssignments) {
          await refreshAssignments();
        }
      } else {
        // Extract and display validation errors
        const errors = responseData.errors;
        console.error('Validation errors:', errors);
        if (errors && typeof errors === 'object') {
          const messages = Object.entries(errors)
            .map(([field, msgs]) => {
              const msg = Array.isArray(msgs) ? msgs[0] : (typeof msgs === 'string' ? msgs : JSON.stringify(msgs));
              return `${field}: ${msg}`;
            })
            .join('\n');
          toast.error(messages || responseData.message || 'Validation failed');
        } else {
          toast.error(responseData.message || 'Failed to add assignment');
        }
      }
    } catch (error) {
      console.error('Assignment submission error:', error);
      toast.error('Network error — could not submit assignment');
    } finally {
      setIsAddingAssignments(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleOpeningFilterModal = () => {
    setOpenFilterModal(true);
  };

  const handleClosingFilterModal = () => {
    setOpenFilterModal(false);
  };

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState([]);

  const handleManageGroup = (assignment) => {
    setSelectedAssignment(assignment);
    setGroupMembers(assignment.students || []);
    setManageGroupModalOpen(true);
  };

  const handleCloseManageGroup = () => {
    setManageGroupModalOpen(false);
    setSelectedAssignment(null);
    setGroupMembers([]);
  };

  const handleViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedAssignment(null);
  };

  const handleOpenAddMembers = () => {
    // Get students from the class who are not already in the group
    const classStudents = students || [];
    const currentMemberIds = new Set(groupMembers.map(m => m.id));
    const available = classStudents.filter(s => !currentMemberIds.has(s.id));
    setAvailableStudents(available);
    setSelectedStudentsToAdd([]);
    setAddMemberModalOpen(true);
  };

  const handleCloseAddMembers = () => {
    setAddMemberModalOpen(false);
    setAvailableStudents([]);
    setSelectedStudentsToAdd([]);
  };

  const handleToggleStudentSelection = (studentId) => {
    setSelectedStudentsToAdd(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const handleAddMembers = async () => {
    if (!selectedAssignment || selectedStudentsToAdd.length === 0) return;

    try {
      const token = await GetToken();
      const Api = `${Backend.assignments}${selectedAssignment.id}/add_students/`;
      const header = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        student_ids: selectedStudentsToAdd
      };

      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`${selectedStudentsToAdd.length} student(s) added to group`);
        handleCloseAddMembers();
        handleCloseManageGroup();
        if (refreshAssignments) {
          await refreshAssignments();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add members');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error('Error adding members');
    }
  };

  const handleRemoveMember = async (studentId) => {
    if (!selectedAssignment) return;

    try {
      const token = await GetToken();
      const Api = `${Backend.assignments}${selectedAssignment.id}/remove_student/`;
      const header = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        student_id: studentId
      };

      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Student removed from group');
        setGroupMembers(prev => prev.filter(m => m.id !== studentId));
        if (refreshAssignments) {
          await refreshAssignments();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Error removing member');
    }
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setEditFormData({
      title: assignment.title || '',
      description: assignment.description || '',
      due_date: assignment.due_date || '',
      file_url: assignment.file_url || '',
      max_points: assignment.max_points || 100,
      is_group_assignment: assignment.is_group_assignment || false,
    });
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedAssignment(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateAssignment = async () => {
    try {
      const token = await GetToken();
      const Api = `${Backend.assignments}${selectedAssignment.id}/`;
      const header = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        title: editFormData.title,
        description: editFormData.description,
        due_date: editFormData.due_date,
        file_url: editFormData.file_url,
        max_score: editFormData.max_points,
      };

      const response = await fetch(Api, {
        method: 'PUT',
        headers: header,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Assignment updated successfully');
        handleCloseEditModal();
        if (refreshAssignments) {
          await refreshAssignments();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Error updating assignment');
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    if (!window.confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
      return;
    }

    try {
      const token = await GetToken();
      const Api = `${Backend.assignments}${assignment.id}/`;
      const header = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(Api, {
        method: 'DELETE',
        headers: header,
      });

      if (response.ok) {
        toast.success('Assignment deleted successfully');
        if (refreshAssignments) {
          await refreshAssignments();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Error deleting assignment');
    }
  };

  // Debug logging
  console.log('[AssignmentsDashboard] assignmentsData:', assignmentsData);
  console.log('[AssignmentsDashboard] classData:', classData);

  const filteredAssignments = assignmentsData.filter((assignment) =>
    assignment.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const paginatedAssignments = filteredAssignments.slice(
    pagination.page * pagination.per_page,
    (pagination.page + 1) * pagination.per_page,
  );

  return (
    <Box>
      <Grid container>
        <Grid item xs={12} padding={3}>
          <Grid item xs={10} md={12} marginBottom={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography sx={{ fontWeight: '500', fontSize: '20px' }}>
                Assignments ({assignmentsData.length})
              </Typography>
              <Box display="flex" gap={1}>
                {refreshAssignments && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={refreshAssignments}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                )}
                <AddButton
                  title="New Assignment"
                  startIcon={<AddIcon />}
                  onPress={handleAddAssignmentClick}
                />
              </Box>
            </Box>
          </Grid>
          <Grid container>
            <Grid item xs={12}>
              {loading ? (
                <Grid container>
                  <Grid
                    item
                    xs={12}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    <ActivityIndicator size={20} />
                  </Grid>
                </Grid>
              ) : error ? (
                <ErrorPrompt
                  title="Server Error"
                  message="Unable to retrieve assignments."
                />
              ) : paginatedAssignments.length === 0 ? (
                <Fallbacks
                  severity="evaluation"
                  title="No Assignments Yet"
                  description={classData ? `No assignments found for ${classData.name}. Click "New Assignment" to create one.` : "No assignments found. Click \"New Assignment\" to create one."}
                  sx={{ paddingTop: 6 }}
                />
              ) : (
                <TableContainer
                  sx={{
                    // minHeight: '66dvh',
                    border: 0.4,
                    borderColor: theme.palette.divider,
                    borderRadius: 2,
                    bgcolor: 'white',
                  }}
                >
                  <Table
                    aria-label="assignments table"
                    sx={{ minWidth: 650, bgcolor: 'white' }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Assignment</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Resources</TableCell>
                        <TableCell>Submission Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedAssignments.map((assignment) => {
                        const { submitted, total } = parseSubmitted(
                          assignment.submitted,
                        );
                        const percentage =
                          total > 0 ? Math.round((submitted / total) * 100) : 0;

                        return (
                          <TableRow
                            key={assignment.id}
                            sx={{
                              ':hover': {
                                backgroundColor: theme.palette.grey[50],
                              },
                            }}
                          >
                            <TableCell>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <DescriptionIcon
                                  sx={{ color: '#4285f4', fontSize: 20 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {assignment.title}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {assignment.class_name || classData?.name || assignment.class_fk?.name || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {assignment.due_date}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={assignment.is_group_assignment ? 'Group' : 'Individual'}
                                color={assignment.is_group_assignment ? 'info' : 'default'}
                                size="small"
                                sx={{ fontWeight: 500 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={assignment.type}
                                color={getTypeColor(assignment.type)}
                                size="small"
                                sx={{ fontWeight: 500 }}
                              />
                            </TableCell>
                            <TableCell>
                              {assignment.file_url ? (
                                <Button
                                  variant="text"
                                  size="small"
                                  href={assignment.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ textTransform: 'none', minWidth: 'auto' }}
                                >
                                  📎 File
                                </Button>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ minWidth: 200 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {submitted} / {total} submitted
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {percentage}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={percentage}
                                  color={getProgressColor(percentage)}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                {assignment.is_group_assignment && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="info"
                                    onClick={() => handleManageGroup(assignment)}
                                    sx={{
                                      textTransform: 'none',
                                      minWidth: 'auto',
                                      px: 1.5,
                                    }}
                                  >
                                    Manage Group
                                  </Button>
                                )}
                                {percentage > 0 && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => toast.info(`Grade assignment: ${assignment.title} - Feature coming soon`)}
                                    sx={{
                                      backgroundColor: '#4caf50',
                                      '&:hover': { backgroundColor: '#45a049' },
                                      textTransform: 'none',
                                      minWidth: 'auto',
                                      px: 2,
                                    }}
                                  >
                                    Grade
                                  </Button>
                                )}
                                <IconButton onClick={() => handleEditAssignment(assignment)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <DotMenu
                                  onDelete={() => handleDeleteAssignment(assignment)}
                                  onView={() => toast.info(`View details for: ${assignment.title}`)}
                                />
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={filteredAssignments.length}
                    page={pagination.page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pagination.per_page}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableContainer>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <AddAssignments
        add={add}
        isAdding={isAddingAssignments}
        onClose={handleAssignmentModalClose}
        onSubmit={handleSubmitAssignment}
        subjects={subjects}
        classes={classes}
        sections={sections}
        students={students}
        teacherSubjects={teacherSubjects}
        classData={classData}
      />

      {/* Manage Group Modal */}
      <Dialog
        open={manageGroupModalOpen}
        onClose={handleCloseManageGroup}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Manage Group - {selectedAssignment?.title}
            </Typography>
            <IconButton onClick={handleCloseManageGroup}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Group Members ({groupMembers.length} students)
            </Typography>
            {groupMembers.length === 0 ? (
              <Typography color="text.secondary">
                No students assigned to this group yet.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupMembers.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell>{member.full_name || member.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Chip size="small" label="Assigned" color="info" />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManageGroup}>Close</Button>
          <Button variant="contained" onClick={handleOpenAddMembers}>
            Add Members
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Assignment Modal */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit Assignment</Typography>
            <IconButton onClick={handleCloseEditModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={3}
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  name="due_date"
                  type="date"
                  value={editFormData.due_date}
                  onChange={handleEditFormChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Points"
                  name="max_points"
                  type="number"
                  value={editFormData.max_points}
                  onChange={handleEditFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="File URL"
                  name="file_url"
                  value={editFormData.file_url}
                  onChange={handleEditFormChange}
                  placeholder="https://example.com/document.pdf"
                  helperText="Optional link to external resource"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateAssignment}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Modal */}
      <Dialog
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Assignment Details</Typography>
            <IconButton onClick={handleCloseViewModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedAssignment && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>
                    {selectedAssignment.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Due Date</Typography>
                  <Typography variant="body1">{selectedAssignment.due_date}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Assigned Date</Typography>
                  <Typography variant="body1">{selectedAssignment.assigned_date}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Category</Typography>
                  <Chip
                    label={selectedAssignment.is_group_assignment ? 'Group' : 'Individual'}
                    color={selectedAssignment.is_group_assignment ? 'info' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Max Points</Typography>
                  <Typography variant="body1">{selectedAssignment.max_points}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedAssignment.description || 'No description'}</Typography>
                </Grid>
                {selectedAssignment.file_url && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">File URL</Typography>
                    <Button
                      variant="text"
                      href={selectedAssignment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📎 Open File
                    </Button>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Students ({selectedAssignment.student_count || 0})
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {selectedAssignment.students && selectedAssignment.students.length > 0 ? (
                      selectedAssignment.students.map((student, idx) => (
                        <Chip
                          key={idx}
                          label={student.name || student.full_name || 'Unknown'}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No students assigned
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewModal}>Close</Button>
          {selectedAssignment?.is_group_assignment && (
            <Button
              variant="contained"
              onClick={() => {
                handleCloseViewModal();
                handleManageGroup(selectedAssignment);
              }}
            >
              Manage Group
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Add Members Modal */}
      <Dialog
        open={addMemberModalOpen}
        onClose={handleCloseAddMembers}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Members to Group</Typography>
            <IconButton onClick={handleCloseAddMembers}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Select students to add to <strong>{selectedAssignment?.title}</strong>
            </Typography>
            {availableStudents.length === 0 ? (
              <Typography color="text.secondary">
                No available students to add. All students in this class are already in the group.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">Select</TableCell>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableStudents.map((student) => (
                      <TableRow
                        key={student.id}
                        selected={selectedStudentsToAdd.includes(student.id)}
                        onClick={() => handleToggleStudentSelection(student.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStudentsToAdd.includes(student.id)}
                            onChange={() => handleToggleStudentSelection(student.id)}
                          />
                        </TableCell>
                        <TableCell>{student.full_name || student.name || 'Unknown'}</TableCell>
                        <TableCell>{student.email || student.user?.email || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {selectedStudentsToAdd.length > 0 && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>{selectedStudentsToAdd.length}</strong> student(s) selected
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddMembers}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMembers}
            disabled={selectedStudentsToAdd.length === 0}
          >
            Add {selectedStudentsToAdd.length > 0 ? `(${selectedStudentsToAdd.length})` : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
