import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Avatar,
  Radio,
  LinearProgress,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Pagination,
  useMediaQuery,
  useTheme,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Search,
  // ContentCopy,
  // Print,
  // Description,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import CommentDialog from './components/CommentModel';

const readRedirectPayload = () => {
  try {
    const raw = sessionStorage.getItem('attendance_redirect');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export default function AttendanceTracker() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user?.user);
  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : r?.name || '').toLowerCase());
  const isTeacher = userRoles.includes('teacher');
  const isAdmin = userRoles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'staff'].includes(r));

  // If user is admin but not teacher, they should only see "Monitoring Mode"
  const isMonitoringOnly = isAdmin && !isTeacher;
  const initialData = location.state || readRedirectPayload();
  const [activeClassId, setActiveClassId] = useState(initialData?.classId || '');
  const [activeSectionId, setActiveSectionId] = useState(initialData?.sectionId || '');
  const [activeSubjectId, setActiveSubjectId] = useState(initialData?.subjectId || '');
  const [activeClassName, setActiveClassName] = useState(initialData?.className || '');
  const [activeSectionName, setActiveSectionName] = useState(initialData?.sectionName || '');
  const [myClasses, setMyClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const {
    students = [],
  } = initialData || {};
  const [studentsState, setStudents] = useState(students);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkAction, setBulkAction] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentTargetId, setCommentTargetId] = useState(null);
  const [commentInitialText, setCommentInitialText] = useState('');
  const [commentPendingAttendance, setCommentPendingAttendance] =
    useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await GetToken();
        const header = { Authorization: `Bearer ${token}`, accept: 'application/json' };

        if (isAdmin) {
          // Admins fetch all classes
          const classesRes = await fetch(`${Backend.api}${Backend.classes}`, { headers: header });
          const classesData = await classesRes.json();
          if (classesData.success || Array.isArray(classesData)) {
            const cls = classesData.data || classesData.results || classesData;
            setAllClasses(cls);
            if (!activeClassId && cls.length > 0) setActiveClassId(cls[0].id);
          }
        } else {
          // Teachers fetch their specific assignments
          const teacherAssignmentsRes = await fetch(`${Backend.auth}${Backend.teachersOverviewDashboard}`, { headers: header });
          const data = await teacherAssignmentsRes.json();

          if (data.success && data.data?.subjects?.length > 0) {
            setMyClasses(data.data.subjects);

            if (!activeClassId && !activeSubjectId) {
              const firstClass = data.data.subjects[0];
              setActiveClassId(firstClass.class_id);
              setActiveSectionId(firstClass.section_id || 'null');
              setActiveSubjectId(firstClass.id);
              setActiveClassName(firstClass.class_name);
              setActiveSectionName(firstClass.section_name || 'All');
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial attendance data:', err);
      }
    };

    fetchInitialData();
  }, [isAdmin, activeClassId, activeSubjectId]);

  // Handle Admin dependent fetches (Sections then Subjects)
  useEffect(() => {
    if (isAdmin && activeClassId) {
      const fetchSections = async () => {
        const token = await GetToken();
        const res = await fetch(`${Backend.api}${Backend.sections}?class_id=${activeClassId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const sections = data.data || data.results || data;
        setAvailableSections(sections);
        if (sections.length > 0) setActiveSectionId(sections[0].id);
        else setActiveSectionId('null');
      };
      fetchSections();
    }
  }, [isAdmin, activeClassId]);

  useEffect(() => {
    if (isAdmin && activeClassId) {
      const fetchSubjects = async () => {
        const token = await GetToken();
        const res = await fetch(`${Backend.api}${Backend.subjects}?class_id=${activeClassId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const subjects = data.data || data.results || data;
        setAvailableSubjects(subjects);
        if (subjects.length > 0) setActiveSubjectId(subjects[0].id);
      };
      fetchSubjects();
    }
  }, [isAdmin, activeClassId]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!activeClassId || !activeSubjectId) return;

      try {
        const token = await GetToken();
        const header = {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        };
        const today = new Date().toISOString().split('T')[0];

        const actualSectionId = activeSectionId === 'null' || !activeSectionId ? 'null' : activeSectionId;
        const attendanceApi = `${Backend.api}${Backend.teachersAttendanceDashboard}${activeClassId}/${actualSectionId}/${activeSubjectId}/?date=${today}`;

        console.log('Fetching attendance from:', attendanceApi);

        const res = await fetch(attendanceApi, {
          method: 'GET',
          headers: header,
        });

        if (!res.ok) {
          console.error('Attendance API failed with status:', res.status);
          toast.error(`Failed to fetch attendance. Status: ${res.status}`);
          return;
        }

        const result = await res.json();
        console.log('Fetched attendance API response:', result);

        if (result.success && Array.isArray(result?.data?.students)) {
          // Map API records to the shape we use
          const apiStudents = result.data.students.map((rec) => {
            // Normalize status to lowercase
            let status = (rec.status ?? '').toString().toLowerCase();
            if (status === 'excused') status = 'permission';
            if (status === 'no permission' || status === 'no_permission') status = 'noPermission';

            return {
              id: rec.id ?? rec.student_id ?? rec.user_id,
              name: rec.name ?? rec.full_name ?? '',
              studentId: rec.student_id || rec.studentId || 'N/A',
              avatar: rec.avatar ?? null,
              attendance_status: status || null,
              attendance_comment: rec.comment ?? rec.attendance_comment ?? '',
            };
          });

          setStudents(apiStudents);
        } else {
          toast.info('No students found for this class/section/subject');
          setStudents([]);
        }
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        toast.error('Error fetching attendance: ' + (err.message || err));
      }
    };

    if (activeClassId && activeSubjectId) {
      fetchAttendance();
    } else {
      console.warn('Missing required parameters');
    }
  }, [activeClassId, activeSectionId, activeSubjectId]);

  // console.log('Initial students', studentsState);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate attendance statistics
  const attendanceStats = studentsState.reduce(
    (acc, student) => {
      if (student.attendance_status === 'present') acc.present++;
      else if (student.attendance_status === 'late') acc.late++;
      else if (student.attendance_status === 'absent') acc.absent++;
      else if (student.attendance_status === 'permission') acc.permission++;
      else if (student.attendance_status === 'noPermission') acc.noPermission++;
      return acc;
    },
    { present: 0, late: 0, absent: 0, permission: 0, noPermission: 0 },
  );

  const totalMarked = Object.values(attendanceStats).reduce(
    (sum, count) => sum + count,
    0,
  );
  const totalStudents = studentsState.length;
  const progressPercentage = Math.round((totalMarked / totalStudents) * 100);

  const updateAttendance = (studentId, attendance) => {
    const normalized = String(attendance).toLowerCase(); // e.g. 'permission' or 'nopermission'
    const requiresComment = ['permission', 'nopermission'];

    if (requiresComment.includes(normalized)) {
      // open dialog to collect comment before saving attendance
      const existing = studentsState.find(
        (s) => String(s.id) === String(studentId),
      );
      const existingComment = existing?.attendance_comment ?? '';
      openCommentDialog(studentId, existingComment, normalized);
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, attendance_status: attendance }
          : student,
      ),
    );
    // set
    setFilteredStudents((prev) =>
      prev.map((student) =>
        String(student.id) === String(studentId)
          ? { ...student, attendance_status: attendance }
          : student,
      ),
    );
  };

  const markAllAs = (attendance) => {
    setStudents((prev) => prev.map((student) => ({ ...student, attendance_status: attendance })));
    setFilteredStudents((prev) => prev.map((student) => ({ ...student, attendance_status: attendance })));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Get only students who have attendance marked (selected)
      const markedStudents = studentsState.filter(
        (student) =>
          student.attendance_status !== undefined &&
          student.attendance_status !== null,
      );
      // Check if no students are marked
      if (markedStudents.length === 0) {
        toast.warning('Please mark attendance for at least one student');
        setIsSubmitting(false);
        return;
      }

      if (!bulkAction) {
        // Use individual API for students (each with their own status)
        const attendanceData = markedStudents.map((student) => {
          let status;
          switch (student.attendance_status) {
            case 'present':
              status = 'Present';
              break;
            case 'late':
              status = 'Late';
              break;
            case 'absent':
              status = 'Absent';
              break;
            case 'permission':
              status = 'Excused';
              break;
            case 'noPermission':
              status = 'No permission';
              break;
            default:
              status = 'Absent';
              break;
          }

          return {
            student_id: student.id,
            status: status,
            comment: student.comment || '',
          };
        });

        const actualSectionId = activeSectionId === 'null' || !activeSectionId ? 'null' : activeSectionId;
        const individualApi = `${Backend.auth}${Backend.teachersMarkAttendance}/${activeClassId}/${actualSectionId}/${activeSubjectId}/`;

        const payload = {
          attendance: attendanceData,
          date: new Date().toISOString().split('T')[0],
        };
        console.log('From individual attendance mark', payload);

        const response = await fetch(individualApi, {
          method: 'POST',
          headers: header,
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (result.success) {
          toast.success(
            `Attendance submitted successfully for ${markedStudents.length} student(s)!`,
          );
        } else {
          toast.warning(
            `Individual submission failed: ${result.message || 'Error'}`,
          );
        }
      } else {
        // Use bulk API for multiple students
        const actualSectionId = activeSectionId === 'null' || !activeSectionId ? 'null' : activeSectionId;
        const bulkApi = `${Backend.auth}${Backend.teachersBulkMarkAttendance}/${activeClassId}/${actualSectionId}/${activeSubjectId}/`;

        // Prepare attendance data for bulk submission
        const attendanceData = markedStudents.map((student) => {
          let status;
          switch (student.attendance_status) {
            case 'present':
              status = 'Present';
              break;
            case 'late':
              status = 'Late';
              break;
            case 'absent':
              status = 'Absent';
              break;
            case 'permission':
              status = 'Permission';
              break;
            case 'noPermission':
              status = 'No Permission';
              break;
            default:
              status = 'Absent';
              break;
          }

          return {
            student_id: student.id,
            status: status,
            comment: student.comment || '',
          };
        });

        const checkIfAllSame = (arr) => arr.every((val) => val === arr[0]);
        const allStatuses = attendanceData.map((a) => a.status);
        const a = checkIfAllSame(allStatuses) ? allStatuses[0] : 'Mixed';
        const attendanceSet = new Set(allStatuses);
        const payload = {
          status: a,
          date: new Date().toISOString().split('T')[0],
        };
        const response = await fetch(bulkApi, {
          method: 'POST',
          headers: header,
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Attendance submitted successfully for ${markedStudents.length} students!`,
          );
        } else {
          toast.warning(`Bulk submission failed: ${result.message || 'Error'}`);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setFilteredStudents(
      studentsState.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(student.studentId)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ),
    );
  }, [studentsState, searchTerm]);

  const openCommentDialog = (
    studentId,
    initialText = '',
    attendanceForSave = null,
  ) => {
    setCommentDialogOpen(true);
    setCommentTargetId(studentId);
    setCommentInitialText(initialText || '');
    setCommentPendingAttendance(attendanceForSave);
  };

  const closeCommentDialog = () => {
    setCommentDialogOpen(false);
    setCommentTargetId(null);
    setCommentInitialText('');
    setCommentPendingAttendance(null);
  };

  // onSave handler
  const handleCommentSave = ({ studentId, comment, attendance }) => {
    // update students state: set attendance and attendance_comment
    setStudents((prev) =>
      prev.map((s) =>
        String(s.id) === String(studentId)
          ? {
            ...s,
            attendance_status: attendance ?? s.attendance_status,
            comment: comment,
          }
          : s,
      ),
    );
    closeCommentDialog();
  };

  return (
    <Box
      sx={{
        maxWidth: '1200px',
        mx: 'auto',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        bgcolor: '#f8f9fa',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            sx={{
              fontWeight: 'bold',
              color: 'text.primary',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' },
            }}
          >
            {isAdmin ? 'Attendance Monitor' : 'Mark Attendance'} {activeClassName ? ` - ${activeClassName}` : ''} {activeSectionName && activeSectionName !== 'All' ? ` - ${activeSectionName}` : ''}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 2,
              mt: 0.5
            }}
          >
            {new Date().toISOString().split('T')[0]}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 1, minWidth: 400, flexWrap: 'wrap' }}>
            {isAdmin ? (
              <>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={activeClassId}
                    label="Class"
                    onChange={(e) => {
                      const cId = e.target.value;
                      setActiveClassId(cId);
                      const cls = allClasses.find(c => c.id === cId);
                      if (cls) setActiveClassName(cls.name);
                    }}
                  >
                    {allClasses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={activeSectionId}
                    label="Section"
                    onChange={(e) => setActiveSectionId(e.target.value)}
                  >
                    <MenuItem value="null">All Sections</MenuItem>
                    {availableSections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={activeSubjectId}
                    label="Subject"
                    onChange={(e) => setActiveSubjectId(e.target.value)}
                  >
                    {availableSubjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </>
            ) : (
              <FormControl size="small" fullWidth>
                <InputLabel>Select Class to Mark</InputLabel>
                <Select
                  value={activeSubjectId ? `${activeClassId}|${activeSectionId}|${activeSubjectId}` : ''}
                  label="Select Class to Mark"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const [cId, sId, subId] = val.split('|');
                    const targetSubject = myClasses.find(c => c.id === subId && c.class_id === cId);
                    if (targetSubject) {
                      setActiveClassId(cId);
                      setActiveSectionId(sId);
                      setActiveSubjectId(subId);
                      setActiveClassName(targetSubject.class_name);
                      setActiveSectionName(targetSubject.section_name || 'All');
                    }
                  }}
                >
                  {myClasses.map((subj) => (
                    <MenuItem key={`${subj.class_id}|${subj.section_id || 'null'}|${subj.id}`} value={`${subj.class_id}|${subj.section_id || 'null'}|${subj.id}`}>
                      {subj.class_name} {subj.section_name ? `- ${subj.section_name}` : ''} ({subj.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: 'success.main',
                    borderRadius: '50%',
                  }}
                />
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Present
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {attendanceStats.present}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: 'warning.main',
                    borderRadius: '50%',
                  }}
                />
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Late
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {attendanceStats.late}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: 'error.main',
                    borderRadius: '50%',
                  }}
                />
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Absent
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {attendanceStats.absent}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: 'info.main',
                    borderRadius: '50%',
                  }}
                />
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    With Permission
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {attendanceStats.permission}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: 'info.main',
                    borderRadius: '50%',
                  }}
                />
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    NO Permission
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {attendanceStats.noPermission}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {totalMarked} of {totalStudents} students marked
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {progressPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {isMonitoringOnly ? "Status Overview:" : "Mark all as:"}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={isMonitoringOnly}
                  onClick={() => {
                    markAllAs('present');
                    setBulkAction(true);
                  }}
                >
                  Present
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    markAllAs('late');
                    setBulkAction(true);
                  }}
                >
                  Late
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    markAllAs('absent');
                    setBulkAction(true);
                  }}
                >
                  Absent
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    markAllAs('permission');
                    setBulkAction(true);
                  }}
                >
                  Permission
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    markAllAs('noPermission');
                    setBulkAction(true);
                  }}
                >
                  No Permission
                </Button>
              </Box>
            </Box>
            <TextField
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ width: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <TableContainer>
          <Table>
            {!isMobile && (
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell
                    sx={{ fontWeight: 'medium', color: 'text.primary' }}
                  >
                    Student
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'medium', color: 'text.primary' }}
                  >
                    Present
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'medium', color: 'text.primary' }}
                  >
                    Late
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'medium', color: 'text.primary' }}
                  >
                    Absent
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'medium', color: 'text.primary' }}
                  >
                    Permission
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'medium', color: 'text.primary' }}
                  >
                    No Permission
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'medium', color: 'text.primary' }}
                  >
                    Comment
                  </TableCell>
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  sx={{
                    '&:hover': { bgcolor: 'grey.50' },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: isMobile ? 'flex' : 'table-row',
                    flexDirection: isMobile ? 'column' : 'initial',
                    alignItems: isMobile ? 'flex-start' : 'initial',
                    p: isMobile ? 2 : 0,
                  }}
                >
                  <TableCell
                    sx={{
                      width: isMobile ? '100%' : 'auto',
                      borderBottom: isMobile ? 'none' : 'initial',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        {!isMobile && (
                          <Avatar
                            src={student.avatar || '/placeholder.svg'}
                            alt={student.name}
                            sx={{ width: 40, height: 40 }}
                          />
                        )}
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 'medium', color: 'text.primary' }}
                          >
                            {student.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}
                          >
                            {student.studentId}
                          </Typography>
                        </Box>
                      </Box>
                      {isMobile && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            openCommentDialog(
                              student.studentId,
                              student.attendance_comment ?? '',
                              null,
                            )
                          }
                        >
                          <CommentIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>

                  {isMobile ? (
                    <Box
                      sx={{
                        display: 'flex',
                        width: '100%',
                        flexDirection: 'column',
                        borderTop: '1px solid #eee',
                        // pt: 1,
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1,
                        }}
                      >
                        <Avatar
                          src={student.avatar || '/placeholder.svg'}
                          alt={student.name}
                          sx={{ width: 40, height: 40, mt: 4 }}
                        />
                        {isMonitoringOnly ? (
                          <Chip
                            label={student.attendance_status?.toUpperCase() || 'NOT MARKED'}
                            color={
                              student.attendance_status === 'present' ? 'success' :
                                student.attendance_status === 'absent' ? 'error' :
                                  student.attendance_status === 'late' ? 'warning' : 'default'
                            }
                            sx={{ mt: 4 }}
                          />
                        ) : (
                          <>
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={
                                    student.attendance_status === 'Present' ||
                                    student.attendance_status === 'present'
                                  }
                                  onChange={() =>
                                    updateAttendance(student.id, 'present')
                                  }
                                  size="small"
                                  disabled={isMonitoringOnly}
                                  sx={{
                                    color: 'success.main',
                                    '&.Mui-checked': { color: 'success.main' },
                                  }}
                                />
                              }
                              label="Present"
                              labelPlacement="start"
                              sx={{
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            />
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={
                                    student.attendance_status === 'late ' ||
                                    student.attendance_status === 'Late'
                                  }
                                  onChange={() =>
                                    updateAttendance(student.id, 'late')
                                  }
                                  size="small"
                                  sx={{
                                    color: 'warning.main',
                                    '&.Mui-checked': { color: 'warning.main' },
                                  }}
                                />
                              }
                              label="Late"
                              labelPlacement="start"
                              sx={{
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            />
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={
                                    student.attendance_status === 'absent' ||
                                    student.attendance_status === 'Absent'
                                  }
                                  onChange={() =>
                                    updateAttendance(student.id, 'absent')
                                  }
                                  size="small"
                                  sx={{
                                    color: 'error.main',
                                    '&.Mui-checked': { color: 'error.main' },
                                  }}
                                />
                              }
                              label="Absent"
                              labelPlacement="start"
                              sx={{
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            />
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={
                                    student.attendance_status === 'permission' ||
                                    student.attendance_status === 'Permission'
                                  }
                                  onChange={() =>
                                    updateAttendance(student.id, 'permission')
                                  }
                                  size="small"
                                  sx={{
                                    color: 'info.main',
                                    '&.Mui-checked': { color: 'info.main' },
                                  }}
                                />
                              }
                              label="Permission"
                              labelPlacement="start"
                              sx={{
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            />
                          </>
                        )}
                        <FormControlLabel
                          control={
                            <Radio
                              checked={
                                student.attendance_status === 'noPermission' ||
                                student.attendance_status === 'No Permission'
                              }
                              onChange={() =>
                                updateAttendance(student.id, 'noPermission')
                              }
                              size="small"
                              sx={{
                                color: 'error.main',
                                '&.Mui-checked': { color: 'error.main' },
                              }}
                            />
                          }
                          label="No Permission"
                          labelPlacement="start"
                          sx={{
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            ml: 'auto',
                          }}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <TableCell align="center">
                        <Radio
                          checked={
                            student.attendance_status === 'Present' ||
                            student.attendance_status === 'present'
                          }
                          onChange={() =>
                            updateAttendance(student.id, 'present')
                          }
                          sx={{
                            color: 'success.main',
                            '&.Mui-checked': { color: 'success.main' },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Radio
                          checked={
                            student.attendance_status === 'late' ||
                            student.attendance_status === 'Late'
                          }
                          onChange={() => updateAttendance(student.id, 'late')}
                          sx={{
                            color: 'warning.main',
                            '&.Mui-checked': { color: 'warning.main' },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Radio
                          checked={
                            student.attendance_status === 'absent' ||
                            student.attendance_status === 'Absent'
                          }
                          onChange={() =>
                            updateAttendance(student.id, 'absent')
                          }
                          sx={{
                            color: 'error.main',
                            '&.Mui-checked': { color: 'error.main' },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Radio
                          checked={
                            student.attendance_status === 'Excused' ||
                            student.attendance_status === 'excused' ||
                            student.attendance_status === 'permission' ||
                            student.attendance_status === 'Permission'
                          }
                          onChange={() =>
                            updateAttendance(student.id, 'permission')
                          }
                          sx={{
                            color: 'info.main',
                            '&.Mui-checked': { color: 'info.main' },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Radio
                          checked={
                            student.attendance_status === 'No Permission' ||
                            student.attendance_status === 'noPermission'
                          }
                          onChange={() =>
                            updateAttendance(student.id, 'noPermission')
                          }
                          disabled={isMonitoringOnly}
                          sx={{
                            color: 'error.main',
                            '&.Mui-checked': { color: 'error.main' },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() =>
                            openCommentDialog(
                              student.id,
                              student.attendance_comment ?? '',
                              null,
                            )
                          }
                        >
                          <CommentIcon />
                        </IconButton>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Pagination and Actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Showing 1 to {filteredStudents.length} of {totalStudents} students
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Pagination count={1} page={1} disabled />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
        {!isMonitoringOnly && (
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : 'Submit Attendance'}
          </Button>
        )}
      </Box>
      {/* Comment Dialog */}
      <CommentDialog
        open={commentDialogOpen}
        onClose={closeCommentDialog}
        onSave={handleCommentSave}
        studentId={commentTargetId}
        initialText={commentInitialText}
        pendingAttendance={commentPendingAttendance}
        requireComment={true}
      />
      {/* Toast Container */}
      <ToastContainer />
    </Box>
  );
}
