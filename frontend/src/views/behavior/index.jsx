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
} from '@mui/material';
import { useState, useEffect } from 'react';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Star as StarIcon } from '@mui/icons-material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';

function BehaviorPage() {
  const [tabValue, setTabValue] = useState(0);
  const [behaviorRecords, setBehaviorRecords] = useState([]);
  const [behaviorRatings, setBehaviorRatings] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openRatingDialog, setOpenRatingDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingRating, setEditingRating] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
  });
  const [ratingFormData, setRatingFormData] = useState({
    student_id: '',
    category: 'Conduct',
    rating: 3,
    notes: '',
  });

  const user = useSelector((state) => state?.user?.user);

  useEffect(() => {
    fetchBehaviorRecords();
    fetchBehaviorRatings();
    fetchStudents();
  }, []);

  const fetchBehaviorRecords = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.behaviorIncidents}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setBehaviorRecords(responseData.data || []);
      } else {
        toast.warning(responseData.message || 'Failed to fetch behavior records');
      }
    } catch (error) {
      toast.error(error.message || 'Error fetching behavior records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Use the my_students endpoint which gets all students for the teacher
      const Api = `${Backend.auth}${Backend.teachersMyStudents}`;
      console.log('Fetching students from:', Api);
      
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      
      console.log('Students API response:', responseData);

      if (response.ok && responseData.success) {
        // The API returns student_id as the UUID, which is what we need for the form
        const studentsData = (responseData.data || []).map(student => ({
          id: student.student_id, // This is the UUID we need for student_id in forms
          user: {
            full_name: student.name
          },
          email: student.email,
          class: student.class,
          section: student.section
        }));
        
        setStudents(studentsData);
        console.log('Students loaded:', studentsData.length);
        
        if (studentsData.length === 0) {
          toast.info('No students found in your classes. Please ensure you are assigned to classes with students.');
        }
      } else {
        console.error('Failed to fetch students:', responseData);
        toast.warning(responseData.message || 'Failed to load students');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error loading students: ' + error.message);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenDialog = async (record = null) => {
    // Ensure students are loaded
    if (students.length === 0) {
      await fetchStudents();
    }
    
    if (record) {
      setEditingRecord(record);
      setFormData({
        student_id: record.student_id,
        description: record.description,
        incident_date: record.incident_date,
      });
    } else {
      setEditingRecord(null);
      setFormData({
        student_id: '',
        description: '',
        incident_date: new Date().toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRecord(null);
    setFormData({
      student_id: '',
      description: '',
      incident_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async () => {
    try {
      const token = await GetToken();
      const Api = editingRecord
        ? `${Backend.auth}${Backend.behaviorIncidents}${editingRecord.id}/`
        : `${Backend.auth}${Backend.behaviorIncidents}`;
      
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Add reported_by field (current user)
      const payload = {
        ...formData,
        reported_by: user?.id, // Add the current user as reporter
      };

      const response = await fetch(Api, {
        method: editingRecord ? 'PUT' : 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (responseData.success || response.ok) {
        toast.success(
          editingRecord
            ? 'Behavior record updated successfully'
            : 'Behavior record added successfully'
        );
        handleCloseDialog();
        fetchBehaviorRecords();
      } else {
        console.error('Save failed:', responseData);
        toast.error(responseData.message || 'Failed to save behavior record');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Error saving behavior record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this behavior record?')) {
      return;
    }

    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.behaviorIncidents}${id}/`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'DELETE', headers: header });

      if (response.ok || response.status === 204) {
        toast.success('Behavior record deleted successfully');
        fetchBehaviorRecords();
      } else {
        toast.error('Failed to delete behavior record');
      }
    } catch (error) {
      toast.error(error.message || 'Error deleting behavior record');
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student?.user?.full_name || 'Unknown Student';
  };

  const getStudentNameFromDetails = (studentDetails) => {
    if (studentDetails?.full_name) {
      return studentDetails.full_name;
    }
    if (studentDetails?.user_details?.full_name) {
      return studentDetails.user_details.full_name;
    }
    if (studentDetails?.user?.full_name) {
      return studentDetails.user.full_name;
    }
    return 'Unknown Student';
  };

  const fetchBehaviorRatings = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.behaviorRatings}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      console.log('Fetching behavior ratings from:', Api);
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      
      console.log('Behavior ratings response:', responseData);

      if (responseData.success) {
        setBehaviorRatings(responseData.data || []);
      } else {
        console.warn('Failed to fetch behavior ratings:', responseData.message);
        setBehaviorRatings([]);
      }
    } catch (error) {
      console.error('Error fetching behavior ratings:', error);
      setBehaviorRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRatingDialog = async (rating = null) => {
    if (students.length === 0) {
      await fetchStudents();
    }
    
    if (rating) {
      setEditingRating(rating);
      setRatingFormData({
        student_id: rating.student_id,
        category: rating.category,
        rating: rating.rating,
        notes: rating.notes || '',
      });
    } else {
      setEditingRating(null);
      setRatingFormData({
        student_id: '',
        category: 'Conduct',
        rating: 3,
        notes: '',
      });
    }
    setOpenRatingDialog(true);
  };

  const handleCloseRatingDialog = () => {
    setOpenRatingDialog(false);
    setEditingRating(null);
    setRatingFormData({
      student_id: '',
      category: 'Conduct',
      rating: 3,
      notes: '',
    });
  };

  const handleSubmitRating = async () => {
    try {
      const token = await GetToken();
      const Api = editingRating
        ? `${Backend.auth}${Backend.behaviorRatings}${editingRating.id}/`
        : `${Backend.auth}${Backend.behaviorRatings}`;
      
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const payload = {
        ...ratingFormData,
        rated_by: user?.id,
      };

      const response = await fetch(Api, {
        method: editingRating ? 'PUT' : 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (responseData.success || response.ok) {
        toast.success(
          editingRating
            ? 'Behavior rating updated successfully'
            : 'Behavior rating added successfully'
        );
        handleCloseRatingDialog();
        fetchBehaviorRatings();
      } else {
        console.error('Save failed:', responseData);
        toast.error(responseData.message || 'Failed to save behavior rating');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Error saving behavior rating');
    }
  };

  const handleDeleteRating = async (id) => {
    if (!window.confirm('Are you sure you want to delete this behavior rating?')) {
      return;
    }

    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.behaviorRatings}${id}/`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'DELETE', headers: header });

      if (response.ok || response.status === 204) {
        toast.success('Behavior rating deleted successfully');
        fetchBehaviorRatings();
      } else {
        toast.error('Failed to delete behavior rating');
      }
    } catch (error) {
      toast.error(error.message || 'Error deleting behavior rating');
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: 3 }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Student Behavior
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track student behavior, add notes, rate students, and generate reports
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => tabValue === 0 ? handleOpenDialog() : handleOpenRatingDialog()}
            sx={{ bgcolor: '#4285f4' }}
          >
            {tabValue === 0 ? 'Add Behavior Note' : 'Rate Student'}
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Behavior Incidents" />
            <Tab label="Behavior Ratings" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          loading ? (
            <Typography>Loading behavior records...</Typography>
          ) : (
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
                        <TableCell>{record.incident_date}</TableCell>
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
                            onClick={() => handleOpenDialog(record)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(record.id)}
                            color="error"
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
          )
        )}

        {tabValue === 1 && (
          loading ? (
            <Typography>Loading behavior ratings...</Typography>
          ) : (
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
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {getStudentNameFromDetails(rating.student_details) || getStudentName(rating.student_id)}
                            </Typography>
                            <Chip label={rating.category} size="small" color="primary" sx={{ mt: 0.5 }} />
                          </Box>
                          <Box>
                            <IconButton size="small" onClick={() => handleOpenRatingDialog(rating)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteRating(rating.id)} color="error">
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
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {rating.notes}
                          </Typography>
                        )}

                        <Typography variant="caption" color="text.secondary">
                          Rated by: {rating.rated_by_details?.full_name || 'Unknown'} on {rating.rated_on}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          )
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRecord ? 'Edit Behavior Record' : 'Add Behavior Record'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {loadingStudents ? (
                <Typography>Loading students...</Typography>
              ) : students.length === 0 ? (
                <Typography color="error">
                  No students available. Please add students first.
                </Typography>
              ) : (
                <>
                  <TextField
                    select
                    label="Student"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    fullWidth
                    required
                  >
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.user?.full_name || 'Unknown'}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Incident Date"
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    fullWidth
                    required
                    placeholder="Describe the behavior incident..."
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loadingStudents || students.length === 0 || !formData.student_id || !formData.description}
            >
              {editingRecord ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Behavior Rating Dialog */}
        <Dialog open={openRatingDialog} onClose={handleCloseRatingDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRating ? 'Edit Behavior Rating' : 'Rate Student Behavior'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {loadingStudents ? (
                <Typography>Loading students...</Typography>
              ) : students.length === 0 ? (
                <Typography color="error">
                  No students available. Please add students first.
                </Typography>
              ) : (
                <>
                  <TextField
                    select
                    label="Student"
                    value={ratingFormData.student_id}
                    onChange={(e) => setRatingFormData({ ...ratingFormData, student_id: e.target.value })}
                    fullWidth
                    required
                    disabled={editingRating !== null}
                    helperText={editingRating ? "Student cannot be changed when editing" : ""}
                  >
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.user?.full_name || 'Unknown'}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Category"
                    value={ratingFormData.category}
                    onChange={(e) => setRatingFormData({ ...ratingFormData, category: e.target.value })}
                    fullWidth
                    required
                  >
                    <MenuItem value="Conduct">Conduct</MenuItem>
                    <MenuItem value="Participation">Participation</MenuItem>
                    <MenuItem value="Cooperation">Cooperation</MenuItem>
                    <MenuItem value="Respect">Respect</MenuItem>
                    <MenuItem value="Responsibility">Responsibility</MenuItem>
                    <MenuItem value="Attendance">Attendance</MenuItem>
                    <MenuItem value="Overall">Overall Behavior</MenuItem>
                  </TextField>

                  <Box>
                    <Typography component="legend" sx={{ mb: 1 }}>Rating</Typography>
                    <Rating
                      value={ratingFormData.rating}
                      onChange={(event, newValue) => {
                        setRatingFormData({ ...ratingFormData, rating: newValue });
                      }}
                      max={5}
                      size="large"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent
                    </Typography>
                  </Box>

                  <TextField
                    label="Notes (Optional)"
                    multiline
                    rows={3}
                    value={ratingFormData.notes}
                    onChange={(e) => setRatingFormData({ ...ratingFormData, notes: e.target.value })}
                    fullWidth
                    placeholder="Add any additional comments..."
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
              disabled={loadingStudents || students.length === 0 || !ratingFormData.student_id || !ratingFormData.rating}
            >
              {editingRating ? 'Update' : 'Submit Rating'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <ToastContainer />
    </Box>
  );
}

export default BehaviorPage;
