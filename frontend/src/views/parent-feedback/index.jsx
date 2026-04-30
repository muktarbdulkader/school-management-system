import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Rating,
  Avatar,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Feedback,
  Send,
  History,
  Person,
  School,
  Close,
  Star,
  AdminPanelSettings,
  FilterList,
} from '@mui/icons-material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import PageContainer from 'ui-component/MainPage';
import dayjs from 'dayjs';

export default function ParentFeedbackPage() {
  const [teachers, setTeachers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [allFeedbacks, setAllFeedbacks] = useState([]); // For super admin
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterParent, setFilterParent] = useState('');

  const [formData, setFormData] = useState({
    teacher_id: '',
    subject: '',
    message: '',
    rating: 0,
  });

  const studentId = useSelector((state) => state.student?.studentId);
  const user = useSelector((state) => state.user?.user);
  const userRoles = user?.roles || [];

  // Normalize roles to handle both string and object formats
  const normalizedRoles = userRoles.map(role =>
    typeof role === 'string' ? role.toLowerCase() : role?.name?.toLowerCase()
  ).filter(Boolean);

  const isSuperAdmin = normalizedRoles.includes('super_admin') || normalizedRoles.includes('admin');
  const isParent = normalizedRoles.includes('parent');

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllFeedbacks();
    } else {
      fetchChildren();
    }
  }, [isSuperAdmin]);

  // Fetch teachers when child is selected
  useEffect(() => {
    if (selectedChild && !isSuperAdmin) {
      fetchTeachersForChild(selectedChild);
    }
  }, [selectedChild, isSuperAdmin]);

  const fetchChildren = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.parentChildren}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log('[ParentFeedback] Children data:', data);

      if (data.success) {
        const childrenData = data.data || data.results || [];
        console.log('[ParentFeedback] Parsed children:', childrenData);
        setChildren(childrenData);
        if (childrenData.length > 0) {
          const firstChild = childrenData[0];
          const childId = firstChild.student_details?.id || firstChild.student?.id || firstChild.student_id || firstChild.id;
          console.log('[ParentFeedback] First child ID:', childId);
          setSelectedChild(childId);
          // Fetch teachers for first child immediately
          fetchTeachersForChild(childId);
        }
      } else {
        console.error('[ParentFeedback] Failed to fetch children:', data.message);
        toast.error('Failed to load your children');
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Failed to load your children');
    }
  };

  const fetchTeachersForChild = async (childId) => {
    if (!childId) {
      console.warn('[ParentFeedback] No childId provided');
      return;
    }

    try {
      const token = await GetToken();
      console.log('[ParentFeedback] Fetching teachers for child:', childId);

      // Use the same endpoint as teacher-ratings page
      const res = await fetch(`${Backend.api}${Backend.parentAvailableTeachers}${childId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const list = data.data?.teachers || data.data || [];
        console.log('[ParentFeedback] Teachers loaded:', list);
        setTeachers(list);
      } else {
        console.error('[ParentFeedback] Failed to load teachers:', res.status);
        setTeachers([]);
        toast.error('Failed to load teachers for selected child');
      }

      fetchFeedbacks();
    } catch (error) {
      console.error('Error fetching teachers for child:', error);
      setTeachers([]);
      toast.error('Failed to load teachers');
      fetchFeedbacks();
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.auth}${Backend.parentFeedback}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setFeedbacks(data.data?.feedback_list || []);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFeedbacks = async () => {
    // Super admin fetches all feedbacks
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.auth}communication/feedbacks/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAllFeedbacks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching all feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teacher_id || !formData.subject || !formData.message) {
      toast.warning('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.auth}${Backend.parentFeedback}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedbacked: formData.teacher_id,
            subject: formData.subject,
            message: formData.message,
            rating: formData.rating || null,
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Feedback submitted successfully');
        setFormData({
          teacher_id: '',
          subject: '',
          message: '',
          rating: 0,
        });
        fetchFeedbacks();
        setActiveTab(1); // Switch to history tab
      } else {
        toast.error(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setViewDialogOpen(true);
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.user === teacherId || t.user_id === teacherId || t.id === teacherId);
    return teacher?.name || teacher?.user_details?.full_name || teacher?.full_name || 'Unknown Teacher';
  };

  // Super Admin View - All Parent Feedbacks
  const renderSuperAdminView = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AdminPanelSettings color="primary" />
          <Typography variant="h6">
            All Parent Feedback
          </Typography>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Filter by parent name..."
            value={filterParent}
            onChange={(e) => setFilterParent(e.target.value)}
            InputProps={{ startAdornment: <FilterList fontSize="small" sx={{ mr: 1 }} /> }}
          />
          <TextField
            size="small"
            placeholder="Filter by teacher name..."
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            InputProps={{ startAdornment: <FilterList fontSize="small" sx={{ mr: 1 }} /> }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Parent</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Message Preview</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allFeedbacks
                  .filter(fb => {
                    const parentMatch = !filterParent ||
                      (fb.parent_name || '').toLowerCase().includes(filterParent.toLowerCase());
                    const teacherMatch = !filterTeacher ||
                      (fb.feedbacked_name || '').toLowerCase().includes(filterTeacher.toLowerCase());
                    return parentMatch && teacherMatch;
                  })
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((feedback) => (
                    <TableRow key={feedback.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <Person fontSize="small" />
                          </Avatar>
                          <Typography variant="body2">
                            {feedback.parent_name || 'Unknown Parent'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{feedback.feedbacked_name || 'Unknown Teacher'}</TableCell>
                      <TableCell>{feedback.subject}</TableCell>
                      <TableCell>
                        {feedback.rating ? (
                          <Chip
                            icon={<Star fontSize="small" />}
                            label={feedback.rating}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {dayjs(feedback.submitted_at).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {feedback.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewFeedback(feedback)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {allFeedbacks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No feedback records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={allFeedbacks.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderChildSelector = () => {
    if (children.length === 0) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Select Student
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {children.map((child) => {
            // Handle various data structures for child ID
            const childId = child.id || child.student_details?.id || child.student?.id || child.student_id;
            // Handle various data structures for child name
            const childName = child.full_name ||
              child.student_details?.full_name ||
              child.student_details?.name ||
              child.student_name ||
              child.user?.full_name ||
              'Unknown Child';
            // Get grade/section info - use _details fields which contain actual objects with names
            // The raw grade/section fields are UUIDs, so we need to use grade_details/section_details
            let grade = 'N/A';
            let section = 'N/A';

            // Try grade_details first (this contains the actual grade object with name)
            if (child.grade_details) {
              grade = child.grade_details.grade || child.grade_details.name;
            } else if (child.student_details?.grade_details) {
              grade = child.student_details.grade_details.grade || child.student_details.grade_details.name;
            } else if (child.grade) {
              // Fallback: if grade is an object, extract name
              grade = typeof child.grade === 'object' ? child.grade.grade || child.grade.name : child.grade;
            } else if (child.student_details?.grade) {
              grade = typeof child.student_details.grade === 'object' ? child.student_details.grade.grade || child.student_details.grade.name : child.student_details.grade;
            }

            // Try section_details first (this contains the actual section object with name)
            if (child.section_details) {
              section = child.section_details.name || child.section_details.section;
            } else if (child.student_details?.section_details) {
              section = child.student_details.section_details.name || child.student_details.section_details.section;
            } else if (child.section) {
              // Fallback: if section is an object, extract name
              section = typeof child.section === 'object' ? child.section.name || child.section.section : child.section;
            } else if (child.student_details?.section) {
              section = typeof child.student_details.section === 'object' ? child.student_details.section.name || child.student_details.section.section : child.student_details.section;
            }
            const isSelected = selectedChild === childId;

            return (
              <Card
                key={childId}
                onClick={() => setSelectedChild(childId)}
                sx={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  bgcolor: isSelected ? '#e3f2fd' : 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: '#1976d2'
                  }
                }}
              >
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'grey.300' }}>
                      <Person />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {childName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Grade {grade || 'N/A'} • Section {section || 'N/A'}
                      </Typography>
                    </Box>
                    <Button
                      variant={isSelected ? "contained" : "outlined"}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChild(childId);
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderSubmitForm = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Feedback color="primary" />
          Submit New Feedback
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {renderChildSelector()}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Teacher *</InputLabel>
            <Select
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              required
              disabled={teachers.length === 0}
            >
              {teachers.length === 0 ? (
                <MenuItem disabled>
                  {selectedChild ? 'No teachers found for selected child' : 'Please select a child first'}
                </MenuItem>
              ) : (
                teachers.map((teacher) => {
                  // Handle various data structures for teacher
                  // TeacherSerializer returns 'user' (User ID), 'user_details', 'name', 'id' (Teacher ID)
                  const teacherId = teacher.user || teacher.user_id || teacher.user_details?.id || teacher.id;
                  const teacherName = teacher.name ||
                    teacher.user_details?.full_name ||
                    teacher.teacher_name ||
                    teacher.full_name ||
                    'Unknown Teacher';
                  const subject = teacher.subject ||
                    teacher.subjects?.[0] ||
                    teacher.subject_details?.map(s => s.name || s.code).join(', ') ||
                    teacher.subjects_list?.[0] ||
                    'N/A';

                  return (
                    <MenuItem key={teacherId} value={teacherId}>
                      {teacherName} ({subject})
                    </MenuItem>
                  );
                })
              )}
            </Select>
          </FormControl>

          <TextField
            label="Subject *"
            fullWidth
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="e.g., Teaching Quality, Communication, Concern"
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Rating (Optional)
            </Typography>
            <Rating
              value={formData.rating}
              onChange={(e, newValue) => setFormData({ ...formData, rating: newValue })}
              size="large"
              icon={<Star fontSize="inherit" />}
            />
          </Box>

          <TextField
            label="Your Feedback Message *"
            fullWidth
            multiline
            rows={4}
            required
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Please provide your detailed feedback about the teacher..."
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderFeedbackHistory = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History color="primary" />
          My Feedback History
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : feedbacks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No feedback submitted yet
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => setActiveTab(0)}
            >
              Submit Your First Feedback
            </Button>
          </Box>
        ) : (
          <List>
            {feedbacks.map((feedback, index) => (
              <React.Fragment key={feedback.id || index}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderRadius: 1,
                  }}
                  onClick={() => handleViewFeedback(feedback)}
                >
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {feedback.subject}
                        </Typography>
                        {feedback.rating && (
                          <Chip
                            icon={<Star fontSize="small" />}
                            label={feedback.rating}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        <Chip
                          label={dayjs(feedback.submitted_at).format('MMM D, YYYY')}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          To: {feedback.feedbacked_name || getTeacherName(feedback.feedbacked)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {feedback.message}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < feedbacks.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  return (
    <PageContainer title="Parent Feedback">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {isSuperAdmin ? 'Parent Feedback Management' : 'Parent Feedback'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isSuperAdmin
              ? 'View and manage all parent feedback submitted to teachers'
              : 'Share your feedback about teachers and school staff'}
          </Typography>
        </Box>

        {!user && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Please log in to {isSuperAdmin ? 'view feedback' : 'submit feedback'}
          </Alert>
        )}

        {isSuperAdmin ? (
          // Super Admin View - All Feedbacks
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderSuperAdminView()}
            </Grid>
          </Grid>
        ) : (
          // Parent View - Submit Form and History
          <>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab
                  icon={<Send />}
                  label="Submit Feedback"
                  iconPosition="start"
                />
                <Tab
                  icon={<History />}
                  label="Feedback History"
                  iconPosition="start"
                />
              </Tabs>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12} md={activeTab === 0 ? 8 : 12}>
                {activeTab === 0 ? renderSubmitForm() : renderFeedbackHistory()}
              </Grid>

              {activeTab === 0 && (
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School color="primary" />
                        Guidelines
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Your feedback helps us improve the quality of education and communication.
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Be specific about your observations
                        </Typography>
                        <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Focus on constructive feedback
                        </Typography>
                        <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Mention particular incidents or patterns
                        </Typography>
                        <Typography component="li" variant="body2" color="text.secondary">
                          Your feedback is confidential
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {feedbacks.length > 0 && (
                    <Card sx={{ mt: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Your Stats
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h3" color="primary">
                            {feedbacks.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Feedback<br />Submitted
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              )}
            </Grid>
          </>
        )}

        {/* View Feedback Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Feedback Details</Typography>
              <IconButton onClick={() => setViewDialogOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedFeedback && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedFeedback.subject}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {isSuperAdmin && selectedFeedback.parent_name && (
                    <Chip
                      icon={<Person fontSize="small" />}
                      label={`From: ${selectedFeedback.parent_name}`}
                      size="small"
                      color="info"
                    />
                  )}
                  <Chip
                    icon={<Person fontSize="small" />}
                    label={`To: ${selectedFeedback.feedbacked_name || getTeacherName(selectedFeedback.feedbacked)}`}
                    size="small"
                  />
                  <Chip
                    label={dayjs(selectedFeedback.submitted_at).format('MMM D, YYYY h:mm A')}
                    size="small"
                    variant="outlined"
                  />
                  {selectedFeedback.rating && (
                    <Chip
                      icon={<Star fontSize="small" />}
                      label={`${selectedFeedback.rating}/5`}
                      size="small"
                      color="warning"
                    />
                  )}
                </Box>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {selectedFeedback.message}
                  </Typography>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PageContainer>
  );
}
