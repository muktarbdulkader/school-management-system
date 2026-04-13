import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
} from '@mui/material';
import { Person, School, Class, Subject, Event } from '@mui/icons-material';
import DrogaModal from 'ui-component/modal/DrogaModal';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const TeacherDetailView = ({ open, onClose, teacherId }) => {
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && teacherId) {
      fetchTeacherDetail();
    }
  }, [open, teacherId]);

  const fetchTeacherDetail = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.auth}${Backend.teacherAssignmentDetail}${teacherId}/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        setTeacherData(result.data);
      } else {
        toast.error(result.message || 'Failed to load teacher details');
      }
    } catch (error) {
      toast.error('Error fetching teacher details');
    } finally {
      setLoading(false);
    }
  };

  if (!teacherData) {
    return (
      <DrogaModal open={open} handleClose={onClose} title="Teacher Details" hideActionButtons>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>{loading ? 'Loading...' : 'No data available'}</Typography>
        </Box>
      </DrogaModal>
    );
  }

  const { teacher, summary, assignments } = teacherData;

  return (
    <DrogaModal open={open} handleClose={onClose} title={`Teacher: ${teacher.name}`} hideActionButtons>
      <Box sx={{ width: 900, maxWidth: '100%', maxHeight: '80vh', overflow: 'auto' }}>
        {/* Teacher Profile Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h5" fontWeight="bold">
                  {teacher.name}
                </Typography>
                <Typography color="text.secondary">{teacher.email}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Teacher ID: {teacher.teacher_id}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={teacher.is_active ? 'Active' : 'Inactive'}
                    color={teacher.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {teacher.phone || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {teacher.email || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Class color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h4">{summary.unique_classes}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Classes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Subject color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h4">{summary.unique_subjects}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Subjects
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <School color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h4">{summary.unique_sections}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sections
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Event color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h4">{summary.total_assignments}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Assignments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Lists */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Classes Teaching ({summary.classes_list.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {summary.classes_list.length === 0 ? (
                <Typography color="text.secondary">No classes assigned</Typography>
              ) : (
                summary.classes_list.map((cls) => (
                  <Chip key={cls} label={cls} color="primary" variant="outlined" />
                ))
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Subjects Teaching ({summary.subjects_list.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {summary.subjects_list.length === 0 ? (
                <Typography color="text.secondary">No subjects assigned</Typography>
              ) : (
                summary.subjects_list.map((subj) => (
                  <Chip key={subj} label={subj} color="secondary" variant="outlined" />
                ))
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Sections ({summary.sections_list.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {summary.sections_list.length === 0 ? (
                <Typography color="text.secondary">No sections assigned</Typography>
              ) : (
                summary.sections_list.map((sec) => (
                  <Chip key={sec} label={sec} variant="outlined" />
                ))
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Assignments Table */}
        <Typography variant="h6" gutterBottom>
          Detailed Assignments
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Class</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Term</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No assignments found. Click "Assign Subject" to add classes and subjects for this teacher.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment, index) => (
                  <TableRow key={index}>
                    <TableCell>{assignment.class.grade}</TableCell>
                    <TableCell>{assignment.section.name}</TableCell>
                    <TableCell>{assignment.subject.name}</TableCell>
                    <TableCell>{assignment.term?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.is_active ? 'Active' : 'Inactive'}
                        color={assignment.is_active ? 'success' : 'default'}
                        size="small"
                      />
                      {assignment.is_primary && (
                        <Chip label="Primary" color="primary" size="small" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DrogaModal>
  );
};

TeacherDetailView.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  teacherId: PropTypes.string,
};

export default TeacherDetailView;
