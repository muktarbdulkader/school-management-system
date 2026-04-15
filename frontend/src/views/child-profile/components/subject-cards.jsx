// subject-cards.js
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from '@mui/icons-material';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import { SubjectDetailModal } from './SubjectDetail';

export function SubjectCards({ data, studentId, userRole = 'parent' }) {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teacherAssignmentsOpen, setTeacherAssignmentsOpen] = useState(false);
  const [assignmentsData, setAssignmentsData] = useState(null);
  const isTeacher = userRole === 'teacher';

  // Format subjects data
  const formattedSubjects = data.subjects.map((subject) => ({
    id: subject.id,
    subject_id: subject.subject_id,
    name: subject.subject_name,
    instructor: subject.teacher_name,
    progress: subject.progress || 0,
    lastUpdated: new Date(subject.enrolled_on).toLocaleDateString(),
  }));

  // Function to handle view details click (parent view)
  const handleViewDetails = async (subject) => {
    setSelectedSubject(subject);
    setDialogOpen(true);
    setLoading(true);
    setError(null);

    try {
      const token = await GetToken();
      const apiUrl = `${Backend.auth}${Backend.parentStudentsParentSubjectObjectives}${studentId}/${subject.subject_id}/`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subject details');
      }

      const responseData = await response.json();

      if (responseData.success) {
        setDetailData(responseData.data);
      } else {
        throw new Error(responseData.message || 'No subject details available');
      }
    } catch (err) {
      setError('Failed to load subject details. Please try again.');
      console.error('Error loading subject details:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Teacher-specific: view assignments with submissions
  const handleViewTeacherAssignments = async (subject) => {
    setSelectedSubject(subject);
    setTeacherAssignmentsOpen(true);
    setLoading(true);
    setError(null);
    setAssignmentsData(null);

    try {
      const token = await GetToken();
      const apiUrl = `${Backend.auth}${Backend.teacherSubjectAssignments}${studentId}/${subject.subject_id}/`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to view assignments for this student.');
        }
        throw new Error('Failed to fetch assignments');
      }

      const responseData = await response.json();

      if (responseData.success) {
        setAssignmentsData(responseData.data);
      } else {
        throw new Error(responseData.message || 'No assignments available');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading assignments:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSubject(null);
    setDetailData(null);
  };

  const handleCloseTeacherAssignments = () => {
    setTeacherAssignmentsOpen(false);
    setSelectedSubject(null);
    setAssignmentsData(null);
  };

  // Handle file download
  const handleDownload = (downloadUrl, fileName) => {
    if (!downloadUrl) {
      toast.error('No file available for download');
      return;
    }
    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'assignment_submission';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading file...');
  };

  return (
    <>
      <Grid container spacing={3} mb={2}>
        {formattedSubjects.map((subject, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    fontWeight="600"
                    gutterBottom
                  >
                    {subject.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Instructor: {subject.instructor}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3, flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h4"
                      component="span"
                      fontWeight="bold"
                      color="primary.main"
                    >
                      {subject.progress}%
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={subject.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>

                  {/* Teacher-only: Subject assignment stats */}
                  {isTeacher && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Assignment Status
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography variant="caption" color="success.main">
                          Submitted: {Math.floor(Math.random() * 5) + 3}
                        </Typography>
                        <Typography variant="caption" color="warning.main">
                          Pending: {Math.floor(Math.random() * 3)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                    onClick={() => isTeacher ? handleViewTeacherAssignments(subject) : handleViewDetails(subject)}
                  >
                    {isTeacher ? 'View Assignments & Submissions' : 'View Details'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Enrolled on: {subject.lastUpdated}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Parent Detail Dialog */}
      <SubjectDetailModal
        open={dialogOpen}
        onClose={handleCloseDialog}
        subject={selectedSubject}
        studentId={studentId}
        loading={loading}
        error={error}
        detailData={detailData}
      />

      {/* Teacher Assignments Dialog with Submissions */}
      <Dialog
        open={teacherAssignmentsOpen}
        onClose={handleCloseTeacherAssignments}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                {isTeacher ? 'Teacher View: ' : ''}
                {selectedSubject?.name} - Assignments & Submissions
              </Typography>
              {assignmentsData?.student && (
                <Typography variant="body2" color="text.secondary">
                  Student: {assignmentsData.student.full_name} | Grade: {assignmentsData.student.grade} | Section: {assignmentsData.student.section}
                </Typography>
              )}
            </Box>
            <Button onClick={handleCloseTeacherAssignments} size="small">
              Close
            </Button>
          </Box>
          {assignmentsData && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Chip size="small" label={`Total: ${assignmentsData.total_count}`} />
              <Chip size="small" color="success" label={`Submitted: ${assignmentsData.submitted_count}`} />
              <Chip size="small" color="warning" label={`Pending: ${assignmentsData.pending_count}`} />
            </Box>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          ) : assignmentsData?.assignments?.length > 0 ? (
            <List>
              {assignmentsData.assignments.map((assignment) => {
                const submission = assignment.submission;
                const isSubmitted = submission?.submitted;
                const hasFile = !!submission?.download_url;

                return (
                  <ListItem
                    key={assignment.id}
                    sx={{
                      mb: 2,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: isSubmitted ? 'success.lighter' : 'background.paper',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {isSubmitted ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <UncheckedIcon color="disabled" fontSize="small" />
                          )}
                          <Typography variant="subtitle1" fontWeight="600">
                            {assignment.title}
                          </Typography>
                          <Chip
                            size="small"
                            color={isSubmitted ? 'success' : 'default'}
                            label={isSubmitted ? 'Submitted' : 'Not Submitted'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {assignment.description || 'No description'}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                            {assignment.max_score && ` | Max Score: ${assignment.max_score}`}
                          </Typography>
                          {isSubmitted && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                              <Typography variant="caption" color="success.main" fontWeight="500">
                                Submitted on: {submission.submitted_date ? new Date(submission.submitted_date).toLocaleString() : 'Unknown'}
                              </Typography>
                              {submission.grade !== null && submission.grade !== undefined && (
                                <Typography variant="caption" display="block" color="primary.main">
                                  Grade: {submission.grade}
                                </Typography>
                              )}
                              {submission.feedback && (
                                <Typography variant="caption" display="block">
                                  Feedback: {submission.feedback}
                                </Typography>
                              )}
                              {submission.text_submission && (
                                <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                  Text: {submission.text_submission}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    {isSubmitted && hasFile && (
                      <IconButton
                        color="primary"
                        onClick={() => handleDownload(submission.download_url, submission.file_name)}
                        title="Download Submission"
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No assignments found for this subject
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
