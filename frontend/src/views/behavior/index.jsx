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
  Tabs,
  Tab,
  Rating,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';

// Constants
const BEHAVIOR_CATEGORIES = ['Conduct', 'Participation', 'Cooperation', 'Respect', 'Responsibility', 'Attendance', 'Overall'];

// Initial form states
const INITIAL_INCIDENT_FORM = {
  student_id: '',
  description: '',
  incident_date: new Date().toISOString().split('T')[0],
};

const INITIAL_RATING_FORM = {
  student_id: '',
  category: 'Conduct',
  rating: 3,
  notes: '',
};

function BehaviorPage() {
  // State
  const [tabValue, setTabValue] = useState(0);
  const [behaviorRecords, setBehaviorRecords] = useState([]);
  const [behaviorRatings, setBehaviorRatings] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [openIncidentDialog, setOpenIncidentDialog] = useState(false);
  const [openRatingDialog, setOpenRatingDialog] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [editingRating, setEditingRating] = useState(null);

  // Form states
  const [incidentForm, setIncidentForm] = useState(INITIAL_INCIDENT_FORM);
  const [ratingForm, setRatingForm] = useState(INITIAL_RATING_FORM);

  // UI states
  const [error, setError] = useState(null);

  const user = useSelector((state) => state?.user?.user);

  // Helper Functions
  const getStudentName = useCallback((studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student?.user?.full_name || 'Unknown Student';
  }, [students]);

  const getStudentNameFromDetails = useCallback((studentDetails) => {
    if (studentDetails?.full_name) return studentDetails.full_name;
    if (studentDetails?.user_details?.full_name) return studentDetails.user_details.full_name;
    if (studentDetails?.user?.full_name) return studentDetails.user.full_name;
    return 'Unknown Student';
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }, []);

  // API Functions
  const fetchBehaviorRecords = useCallback(async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.auth}${Backend.behaviorIncidents}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setBehaviorRecords(data.data || []);
      } else {
        toast.warning(data.message || 'Failed to fetch behavior records');
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching behavior records:', error);
      toast.error(error.message || 'Error fetching behavior records');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBehaviorRatings = useCallback(async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.auth}${Backend.behaviorRatings}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setBehaviorRatings(data.data || []);
      } else {
        console.warn('Failed to fetch behavior ratings:', data.message);
        setBehaviorRatings([]);
      }
    } catch (error) {
      console.error('Error fetching behavior ratings:', error);
      setBehaviorRatings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.auth}${Backend.teachersMyStudents}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const studentsData = (data.data || []).map(student => ({
          id: student.student_id,
          user: { full_name: student.name },
          email: student.email,
          class: student.class,
          section: student.section
        }));

        setStudents(studentsData);

        if (studentsData.length === 0) {
          toast.info('No students found in your classes. Please ensure you are assigned to classes with students.');
        }
      } else {
        console.error('Failed to fetch students:', data);
        toast.warning(data.message || 'Failed to load students');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error loading students: ' + error.message);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchBehaviorRecords(),
      fetchBehaviorRatings(),
      fetchStudents()
    ]);
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  }, [fetchBehaviorRecords, fetchBehaviorRatings, fetchStudents]);

  // Incident Handlers
  const handleOpenIncidentDialog = useCallback(async (incident = null) => {
    if (students.length === 0) {
      await fetchStudents();
    }

    if (incident) {
      setEditingIncident(incident);
      setIncidentForm({
        student_id: incident.student_id,
        description: incident.description,
        incident_date: incident.incident_date,
      });
    } else {
      setEditingIncident(null);
      setIncidentForm(INITIAL_INCIDENT_FORM);
    }
    setOpenIncidentDialog(true);
  }, [students.length, fetchStudents]);

  const handleCloseIncidentDialog = useCallback(() => {
    setOpenIncidentDialog(false);
    setEditingIncident(null);
    setIncidentForm(INITIAL_INCIDENT_FORM);
  }, []);

  const handleSubmitIncident = useCallback(async () => {
    try {
      const token = await GetToken();
      const isEditing = !!editingIncident;
      const url = isEditing
        ? `${Backend.auth}${Backend.behaviorIncidents}${editingIncident.id}/`
        : `${Backend.auth}${Backend.behaviorIncidents}`;

      const payload = {
        ...incidentForm,
        reported_by: user?.id,
      };

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        toast.success(
          isEditing
            ? 'Behavior record updated successfully'
            : 'Behavior record added successfully'
        );
        handleCloseIncidentDialog();
        await fetchBehaviorRecords();
      } else {
        console.error('Save failed:', data);
        toast.error(data.message || 'Failed to save behavior record');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Error saving behavior record');
    }
  }, [incidentForm, editingIncident, user?.id, handleCloseIncidentDialog, fetchBehaviorRecords]);

  const handleDeleteIncident = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this behavior record?')) {
      return;
    }

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.auth}${Backend.behaviorIncidents}${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok || response.status === 204) {
        toast.success('Behavior record deleted successfully');
        await fetchBehaviorRecords();
      } else {
        toast.error('Failed to delete behavior record');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Error deleting behavior record');
    }
  }, [fetchBehaviorRecords]);

  // Rating Handlers
  const handleOpenRatingDialog = useCallback(async (rating = null) => {
    if (students.length === 0) {
      await fetchStudents();
    }

    if (rating) {
      setEditingRating(rating);
      setRatingForm({
        student_id: rating.student_id,
        category: rating.category,
        rating: rating.rating,
        notes: rating.notes || '',
      });
    } else {
      setEditingRating(null);
      setRatingForm(INITIAL_RATING_FORM);
    }
    setOpenRatingDialog(true);
  }, [students.length, fetchStudents]);

  const handleCloseRatingDialog = useCallback(() => {
    setOpenRatingDialog(false);
    setEditingRating(null);
    setRatingForm(INITIAL_RATING_FORM);
  }, []);

  const handleSubmitRating = useCallback(async () => {
    try {
      const token = await GetToken();
      const isEditing = !!editingRating;
      const url = isEditing
        ? `${Backend.auth}${Backend.behaviorRatings}${editingRating.id}/`
        : `${Backend.auth}${Backend.behaviorRatings}`;

      const payload = {
        ...ratingForm,
        rated_by: user?.id,
      };

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        toast.success(
          isEditing
            ? 'Behavior rating updated successfully'
            : 'Behavior rating added successfully'
        );
        handleCloseRatingDialog();
        await fetchBehaviorRatings();
      } else {
        console.error('Save failed:', data);
        toast.error(data.message || 'Failed to save behavior rating');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Error saving behavior rating');
    }
  }, [ratingForm, editingRating, user?.id, handleCloseRatingDialog, fetchBehaviorRatings]);

  const handleDeleteRating = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this behavior rating?')) {
      return;
    }

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.auth}${Backend.behaviorRatings}${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok || response.status === 204) {
        toast.success('Behavior rating deleted successfully');
        await fetchBehaviorRatings();
      } else {
        toast.error('Failed to delete behavior rating');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Error deleting behavior rating');
    }
  }, [fetchBehaviorRatings]);

  // Effects
  useEffect(() => {
    fetchBehaviorRecords();
    fetchBehaviorRatings();
    fetchStudents();
  }, [fetchBehaviorRecords, fetchBehaviorRatings, fetchStudents]);

  // Validation Functions
  const isIncidentFormValid = () => {
    return incidentForm.student_id && incidentForm.description && !loadingStudents && students.length > 0;
  };

  const isRatingFormValid = () => {
    return ratingForm.student_id && ratingForm.rating && !loadingStudents && students.length > 0;
  };

  // Render Functions
  const renderIncidentsTab = () => {
    if (loading && behaviorRecords.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Reported By</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {behaviorRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No behavior records found. Click "Add Behavior Note" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              behaviorRecords.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{formatDate(record.incident_date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.student_details?.full_name ||
                        record.student_details?.user_details?.full_name ||
                        record.student_details?.user?.full_name ||
                        getStudentName(record.student_id)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>
                    {record.reported_by_details?.full_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenIncidentDialog(record)}
                      sx={{ mr: 1 }}
                      aria-label="edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteIncident(record.id)}
                      color="error"
                      aria-label="delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderRatingsTab = () => {
    if (loading && behaviorRatings.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {behaviorRatings.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No behavior ratings found. Click "Rate Student" to add one.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          behaviorRatings.map((rating) => (
            <Grid item xs={12} md={6} lg={4} key={rating.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {getStudentNameFromDetails(rating.student_details) || getStudentName(rating.student_id)}
                      </Typography>
                      <Chip label={rating.category} size="small" color="primary" sx={{ mt: 0.5 }} />
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenRatingDialog(rating)}
                        aria-label="edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRating(rating.id)}
                        color="error"
                        aria-label="delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={rating.rating} readOnly max={5} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({rating.rating}/5)
                    </Typography>
                  </Box>

                  {rating.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {rating.notes}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Rated by: {rating.rated_by_details?.full_name || 'Unknown'} on {formatDate(rating.rated_on)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    );
  };

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Student Behavior Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track student behavior incidents and conduct ratings
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshAllData}
              disabled={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => tabValue === 0 ? handleOpenIncidentDialog() : handleOpenRatingDialog()}
              sx={{ bgcolor: '#4285f4' }}
            >
              {tabValue === 0 ? 'Add Behavior Note' : 'Rate Student'}
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Behavior Incidents" />
            <Tab label="Behavior Ratings" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 ? renderIncidentsTab() : renderRatingsTab()}

        {/* Incident Dialog */}
        <Dialog open={openIncidentDialog} onClose={handleCloseIncidentDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingIncident ? 'Edit Behavior Incident' : 'Add Behavior Incident'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {loadingStudents ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : students.length === 0 ? (
                <Alert severity="warning">
                  No students available. Please ensure you have students assigned to your classes.
                </Alert>
              ) : (
                <>
                  <TextField
                    select
                    label="Student"
                    value={incidentForm.student_id}
                    onChange={(e) => setIncidentForm({ ...incidentForm, student_id: e.target.value })}
                    fullWidth
                    required
                    SelectProps={{
                      MenuProps: { PaperProps: { style: { maxHeight: 300 } } }
                    }}
                  >
                    <MenuItem value="" disabled>Select a student</MenuItem>
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.user?.full_name || 'Unknown Student'}
                        {student.class && ` (${student.class}${student.section ? `-${student.section}` : ''})`}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Incident Date"
                    type="date"
                    value={incidentForm.incident_date}
                    onChange={(e) => setIncidentForm({ ...incidentForm, incident_date: e.target.value })}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="Description"
                    multiline
                    rows={4}
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    fullWidth
                    required
                    placeholder="Describe the behavior incident in detail..."
                    helperText="Include specific details about what happened"
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseIncidentDialog}>Cancel</Button>
            <Button
              onClick={handleSubmitIncident}
              variant="contained"
              disabled={!isIncidentFormValid()}
            >
              {editingIncident ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rating Dialog */}
        <Dialog open={openRatingDialog} onClose={handleCloseRatingDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRating ? 'Edit Behavior Rating' : 'Rate Student Behavior'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {loadingStudents ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : students.length === 0 ? (
                <Alert severity="warning">
                  No students available. Please ensure you have students assigned to your classes.
                </Alert>
              ) : (
                <>
                  <TextField
                    select
                    label="Student"
                    value={ratingForm.student_id}
                    onChange={(e) => setRatingForm({ ...ratingForm, student_id: e.target.value })}
                    fullWidth
                    required
                    disabled={!!editingRating}
                    helperText={editingRating ? "Student cannot be changed when editing" : ""}
                  >
                    <MenuItem value="" disabled>Select a student</MenuItem>
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.user?.full_name || 'Unknown Student'}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Category"
                    value={ratingForm.category}
                    onChange={(e) => setRatingForm({ ...ratingForm, category: e.target.value })}
                    fullWidth
                    required
                  >
                    {BEHAVIOR_CATEGORIES.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </TextField>

                  <Box>
                    <Typography component="legend" sx={{ mb: 1, fontWeight: 500 }}>
                      Rating
                    </Typography>
                    <Rating
                      value={ratingForm.rating}
                      onChange={(event, newValue) => {
                        setRatingForm({ ...ratingForm, rating: newValue || 0 });
                      }}
                      max={5}
                      size="large"
                    />
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {ratingForm.rating === 1 && 'Poor - Needs significant improvement'}
                        {ratingForm.rating === 2 && 'Fair - Below expectations'}
                        {ratingForm.rating === 3 && 'Good - Meeting expectations'}
                        {ratingForm.rating === 4 && 'Very Good - Exceeding expectations'}
                        {ratingForm.rating === 5 && 'Excellent - Outstanding behavior'}
                        {!ratingForm.rating && 'Select a rating'}
                      </Typography>
                    </Box>
                  </Box>

                  <TextField
                    label="Notes (Optional)"
                    multiline
                    rows={3}
                    value={ratingForm.notes}
                    onChange={(e) => setRatingForm({ ...ratingForm, notes: e.target.value })}
                    fullWidth
                    placeholder="Add any additional comments or observations..."
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRatingDialog}>Cancel</Button>
            <Button
              onClick={handleSubmitRating}
              variant="contained"
              disabled={!isRatingFormValid()}
            >
              {editingRating ? 'Update' : 'Submit Rating'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>

      {/* ToastContainer - Moved outside Container but inside Box */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Box>
  );
}

export default BehaviorPage;