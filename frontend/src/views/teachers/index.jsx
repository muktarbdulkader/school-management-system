import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Grid,
  Paper
} from '@mui/material';
import {
  IconSearch, IconPlus, IconRefresh, IconEdit, IconTrash, IconEye
} from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-hot-toast';
import TeacherForm from './components/TeacherForm';
import AssignSubjectDialog from './components/AssignSubjectDialog';
import { IconBooks } from '@tabler/icons-react';

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.teachers}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Teachers API response:', data);

        // Handle different response formats
        const teachersData = data.data || data.results || [];
        console.log('Extracted teachers:', teachersData);

        setTeachers(teachersData);

        if (teachersData.length > 0) {
          toast.success(`${teachersData.length} teachers loaded successfully`);
        } else {
          toast.info('No teachers found in the system');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch teachers:', errorData);
        toast.error(errorData.message || 'Failed to load teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher?.user_details?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher?.teacher_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher?.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher?.subject_specialties?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigate = useNavigate();

  const handleAddTeacher = () => {
    navigate('/teachers/add');
  };

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedTeacher(null);
  };

  const handleOpenAssign = (teacher) => {
    setSelectedTeacher(teacher);
    setOpenAssignDialog(true);
  };

  const handleCloseAssign = () => {
    setOpenAssignDialog(false);
    setSelectedTeacher(null);
  };

  const handleViewTeacher = (teacher) => {
    setViewingTeacher(teacher);
    setViewDialogOpen(true);
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
    setViewingTeacher(null);
  };

  const handleFormSuccess = () => {
    fetchTeachers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this teacher? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.teachers}${id}/`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) { toast.success('Teacher deleted'); fetchTeachers(); }
      else toast.error('Failed to delete teacher');
    } catch { toast.error('Error deleting teacher'); }
    finally { setDeleting(null); }
  };

  return (
    <PageContainer title="Teachers Management">
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h3">Teachers</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<IconRefresh />}
              onClick={fetchTeachers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<IconPlus />}
              onClick={handleAddTeacher}
            >
              Add Teacher
            </Button>
          </Stack>
        </Stack>

        <TextField
          fullWidth
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={20} />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <ActivityIndicator size={32} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No teachers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>{teacher.teacher_id || 'N/A'}</TableCell>
                      <TableCell>{teacher.user_details?.full_name || 'N/A'}</TableCell>
                      <TableCell>{teacher.specialization || teacher.subject_specialties || 'Not Assigned'}</TableCell>
                      <TableCell>
                        <Chip
                          label={teacher.user_details?.is_active ? 'Active' : 'Inactive'}
                          color={teacher.user_details?.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewTeacher(teacher)}
                            >
                              <IconEye size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Assign Subject">
                            <IconButton size="small" color="secondary" onClick={() => handleOpenAssign(teacher)}>
                              <IconBooks size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => handleEditTeacher(teacher)}>
                              <IconEdit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(teacher.id)} disabled={deleting === teacher.id}>
                              {deleting === teacher.id ? <CircularProgress size={14} /> : <IconTrash size={16} />}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TeacherForm
          open={openForm}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
          teacher={selectedTeacher}
        />

        <AssignSubjectDialog
          open={openAssignDialog}
          onClose={handleCloseAssign}
          teacherId={selectedTeacher?.id}
          onAssignmentSuccess={fetchTeachers}
        />

        {/* View Teacher Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={handleCloseView} maxWidth="md" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {viewingTeacher?.user_details?.full_name?.charAt(0) || 'T'}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {viewingTeacher?.user_details?.full_name || 'Teacher Details'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {viewingTeacher?.teacher_id || viewingTeacher?.id}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {viewingTeacher && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Contact Information
                    </Typography>
                    <Typography variant="body2"><strong>Email:</strong> {viewingTeacher.user_details?.email || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Phone:</strong> {viewingTeacher.user_details?.phone || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Branch:</strong> {viewingTeacher.branch_name || viewingTeacher.branch_details?.name || 'N/A'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Professional Info
                    </Typography>
                    <Typography variant="body2"><strong>Specialization:</strong> {viewingTeacher.specialization || viewingTeacher.subject_specialties || 'Not Assigned'}</Typography>
                    <Typography variant="body2"><strong>Qualification:</strong> {viewingTeacher.qualification || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Experience:</strong> {viewingTeacher.years_of_experience ? `${viewingTeacher.years_of_experience} years` : 'N/A'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Account Status
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={viewingTeacher.user_details?.is_active ? 'Active' : 'Inactive'}
                        color={viewingTeacher.user_details?.is_active ? 'success' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={viewingTeacher.user_details?.role || 'Teacher'}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Joined: {viewingTeacher.joining_date ? new Date(viewingTeacher.joining_date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseView}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                handleCloseView();
                handleEditTeacher(viewingTeacher);
              }}
            >
              Edit Teacher
            </Button>
          </DialogActions>
        </Dialog>
      </DrogaCard>
    </PageContainer>
  );
};

export default TeachersPage;
