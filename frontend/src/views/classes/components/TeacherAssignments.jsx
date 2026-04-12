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
  Description as DescriptionIcon,
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
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [add, setAdd] = useState();
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
  }, []);

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
      };

      // Remove null values for optional fields to avoid backend validation issues
      if (!payload.section) delete payload.section;
      if (!payload.class_id) delete payload.class_id;

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

  const filteredAssignments = assignmentsData.filter((assignment) =>
    assignment.title.toLowerCase().includes(search.toLowerCase()),
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
              <AddButton
                title="New Assignment"
                startIcon={<AddIcon />}
                onPress={handleAddAssignmentClick}
              />
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
                  title="Assignments Not Found"
                  description="The list of assignments will be listed here."
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
                                {assignment.due_date}
                              </Typography>
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
                                {percentage > 0 && (
                                  <Button
                                    variant="contained"
                                    size="small"
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
                                <IconButton>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <DotMenu />
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
      />
    </Box>
  );
}
