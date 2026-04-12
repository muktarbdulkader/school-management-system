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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { EventNote, CheckCircle, Pending, Cancel } from '@mui/icons-material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

export default function MeetingRequestsPage() {
  const [teachers, setTeachers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    teacher_id: '',
    preferred_date: null,
    purpose: '',
    notes: '',
  });

  const studentId = useSelector((state) => state.student.studentId);

  useEffect(() => {
    if (studentId) {
      fetchTeachers();
      fetchMeetings();
    }
  }, [studentId]);

  const fetchTeachers = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.teachers}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTeachers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.communicationMeetingRequests}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setMeetings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.teacher_id || !formData.preferred_date || !formData.purpose) {
      toast.warning('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.communicationMeetingRequests}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            student_id: studentId,
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Meeting request submitted successfully');
        setFormData({
          teacher_id: '',
          preferred_date: null,
          purpose: '',
          notes: '',
        });
        fetchMeetings();
      } else {
        toast.error(data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle />;
      case 'pending':
        return <Pending />;
      case 'rejected':
        return <Cancel />;
      default:
        return <EventNote />;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Meeting Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Request meetings with teachers and staff
          </Typography>
        </Box>

        {!studentId && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Please select a student from the dashboard
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Request Form */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  New Meeting Request
                </Typography>
                
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Teacher</InputLabel>
                    <Select
                      value={formData.teacher_id}
                      onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                      required
                    >
                      {teachers.map((teacher) => (
                        <MenuItem key={teacher.id} value={teacher.id}>
                          {teacher.user?.full_name} - {teacher.specialization || teacher.subject_specialties || 'Not Assigned'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <DateTimePicker
                    label="Preferred Date & Time"
                    value={formData.preferred_date}
                    onChange={(newValue) => setFormData({ ...formData, preferred_date: newValue })}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} required />}
                    minDate={new Date()}
                  />

                  <TextField
                    label="Purpose"
                    fullWidth
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    sx={{ mb: 2 }}
                    placeholder="e.g., Discuss academic progress"
                  />

                  <TextField
                    label="Additional Notes"
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    sx={{ mb: 2 }}
                    placeholder="Any specific topics you'd like to discuss..."
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={submitting || !studentId}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Submit Request'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Meeting History */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  My Meeting Requests
                </Typography>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : meetings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No meeting requests yet
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {meetings.map((meeting, index) => (
                      <React.Fragment key={meeting.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1">
                                  {meeting.teacher_name}
                                </Typography>
                                <Chip
                                  icon={getStatusIcon(meeting.status)}
                                  label={meeting.status || 'Pending'}
                                  size="small"
                                  color={getStatusColor(meeting.status)}
                                />
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" color="text.secondary">
                                  {meeting.purpose}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Requested: {new Date(meeting.preferred_date).toLocaleString()}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        {index < meetings.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
}
