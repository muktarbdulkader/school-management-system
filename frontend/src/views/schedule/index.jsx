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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { IconRefresh, IconPlus, IconClock, IconBook, IconUser, IconSettings, IconTrash, IconEdit } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import ScheduleForm from './components/ScheduleForm';
import { hasPermission, PERMISSIONS } from 'config/rolePermissions';
import { useSelector } from 'react-redux';

const SchedulePage = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches, setBranches] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  const userData = useSelector((state) => {
    try {
      return state?.user?.user || state?.auth?.user || {};
    } catch (error) {
      console.error('Error accessing user data:', error);
      return {};
    }
  });

  const userRoles = userData.roles || userData.user_roles || [];
  const isSuperUser = userData.is_superuser || userData.is_super_user;

  // Check for superadmin role
  const hasSuperAdminRole = userRoles.some(r => {
    const roleName = (typeof r === 'string' ? r : (r.role?.name || r.name || '')).toLowerCase();
    return roleName.includes('super_admin') || roleName.includes('superadmin');
  });
  const isSuperAdmin = isSuperUser || hasSuperAdminRole;

  const canCreateSchedule = hasPermission(userRoles, PERMISSIONS.CREATE_SCHEDULE);
  const isStudent = userRoles.some(role => (typeof role === 'string' ? role : role.name)?.toLowerCase() === 'student');
  const isParent = userRoles.some(role => (typeof role === 'string' ? role : role.name)?.toLowerCase() === 'parent');
  const isAdmin = userRoles.some(role =>
    ['super_admin', 'superadmin', 'admin'].includes((typeof role === 'string' ? role : role.name)?.toLowerCase())
  );

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBranches();
    }
    fetchSchedules();
    if (isStudent) {
      fetchStudentInfo();
    }
  }, []);

  useEffect(() => {
    // Refetch when branch filter changes
    fetchSchedules();
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.branches}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBranches(data.data || data.results || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchStudentInfo = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.studentMe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStudentInfo(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      // Add branch_id filter for superadmin
      let url = `${Backend.api}${Backend.scheduleSlots}`;
      if (isSuperAdmin && selectedBranch && selectedBranch !== 'all') {
        url += `?branch_id=${selectedBranch}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Schedule data response:', data);
        // Handle different response formats
        let scheduleData = [];
        if (Array.isArray(data)) {
          scheduleData = data;
        } else if (data.data) {
          scheduleData = data.data;
        } else if (data.results) {
          scheduleData = data.results;
        }
        console.log('Extracted schedule data:', scheduleData);
        console.log('Number of schedules:', scheduleData.length);
        if (scheduleData.length > 0) {
          console.log('First schedule:', scheduleData[0]);
        }
        setSchedules(scheduleData);

        if (scheduleData.length === 0) {
          toast.info('No schedule found. Please contact administrator.');
        } else {
          toast.success(`Loaded ${scheduleData.length} schedule slots`);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch schedule:', errorText);
        toast.error('Failed to load schedule');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormOpen(true);
  };

  const handleDeleteClick = (schedule) => {
    setScheduleToDelete(schedule);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;
    if (!scheduleToDelete.id) {
      console.error('Schedule to delete has no ID:', scheduleToDelete);
      toast.error('Cannot delete: Invalid schedule ID');
      setDeleteDialogOpen(false);
      return;
    }

    try {
      const token = await GetToken();
      const deleteUrl = `${Backend.api}schedule_slots/${scheduleToDelete.id}/`;
      console.log('Deleting schedule at URL:', deleteUrl, 'scheduleToDelete:', scheduleToDelete);
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Schedule deleted successfully');
        fetchSchedules();
      } else {
        const errorText = await response.text();
        console.error('Failed to delete schedule:', errorText);
        toast.error('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    } finally {
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setScheduleToDelete(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingSchedule(null);
  };

  const filteredSchedules = selectedDay === 'all'
    ? schedules
    : schedules.filter(s => s.day_of_week === selectedDay);

  // Group schedules by day for better display
  const schedulesByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = schedules.filter(s => s.day_of_week === day).sort((a, b) => a.period_number - b.period_number);
    return acc;
  }, {});

  const getCurrentDaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return schedulesByDay[today] || [];
  };

  // Detect conflicts in schedule
  const detectConflicts = () => {
    const conflicts = [];
    schedules.forEach(schedule => {
      // Check for duplicate period in same class/section/day
      const sameSlot = schedules.filter(s =>
        s.id !== schedule.id &&
        s.day_of_week === schedule.day_of_week &&
        s.class_details?.id === schedule.class_details?.id &&
        s.section_details?.id === schedule.section_details?.id &&
        s.period_number === schedule.period_number
      );
      if (sameSlot.length > 0) {
        conflicts.push({
          type: 'period_conflict',
          schedule: schedule,
          conflictingWith: sameSlot,
          message: `Period ${schedule.period_number} on ${schedule.day_of_week} has multiple classes for Class ${schedule.class_details?.grade} Section ${schedule.section_details?.name}`
        });
      }

      // Check for teacher conflict
      if (schedule.teacher_details?.id) {
        const teacherConflict = schedules.filter(s =>
          s.id !== schedule.id &&
          s.day_of_week === schedule.day_of_week &&
          s.teacher_details?.id === schedule.teacher_details?.id &&
          s.period_number === schedule.period_number
        );
        if (teacherConflict.length > 0) {
          conflicts.push({
            type: 'teacher_conflict',
            schedule: schedule,
            conflictingWith: teacherConflict,
            message: `${schedule.teacher_details?.teacher_details?.user_details?.full_name} is assigned to multiple classes at Period ${schedule.period_number} on ${schedule.day_of_week}`
          });
        }
      }
    });
    return conflicts;
  };

  const conflicts = detectConflicts();
  const uniqueConflicts = conflicts.filter((conflict, index, self) =>
    index === self.findIndex(c => c.message === conflict.message)
  );

  // Schedule statistics
  const scheduleStats = {
    total: schedules.length,
    byDay: daysOfWeek.map(day => ({
      day,
      count: schedules.filter(s => s.day_of_week === day).length
    })).filter(d => d.count > 0),
    conflicts: uniqueConflicts.length
  };

  return (
    <PageContainer title="Schedule Management">
      {/* Student Info Card */}
      {isStudent && studentInfo && (
        <DrogaCard sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">Student</Typography>
              <Typography variant="h4">{studentInfo.user?.full_name || studentInfo.full_name}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">Class</Typography>
              <Typography variant="h4">{studentInfo.grade?.grade || 'Not Assigned'}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">Section</Typography>
              <Typography variant="h4">{studentInfo.section?.name || 'Not Assigned'}</Typography>
            </Grid>
          </Grid>
        </DrogaCard>
      )}

      {/* Schedule Statistics & Conflicts - For Admins */}
      {isAdmin && (
        <DrogaCard sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <IconBook size={20} color="primary" />
                </Box>
                <Box>
                  <Typography variant="h4">{scheduleStats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Schedules</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <IconClock size={20} color="success" />
                </Box>
                <Box>
                  <Typography variant="h4">{scheduleStats.byDay.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Days</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ p: 1, bgcolor: uniqueConflicts.length > 0 ? 'error.light' : 'success.light', borderRadius: 1 }}>
                  <IconUser size={20} color={uniqueConflicts.length > 0 ? 'error' : 'success'} />
                </Box>
                <Box>
                  <Typography variant="h4" color={uniqueConflicts.length > 0 ? 'error' : 'inherit'}>
                    {uniqueConflicts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {uniqueConflicts.length > 0 ? 'Conflicts Detected' : 'No Conflicts'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          {/* Conflict Alerts */}
          {uniqueConflicts.length > 0 && (
            <Box mt={2}>
              {uniqueConflicts.map((conflict, idx) => (
                <Alert key={idx} severity="error" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Conflict {idx + 1}:</strong> {conflict.message}
                  </Typography>
                </Alert>
              ))}
            </Box>
          )}
        </DrogaCard>
      )}

      {/* Today's Schedule Card */}
      {(isStudent || isParent) && getCurrentDaySchedule().length > 0 && (
        <DrogaCard sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Today's Schedule</Typography>
          <Grid container spacing={2}>
            {getCurrentDaySchedule().map((schedule) => (
              <Grid item xs={12} sm={6} md={4} key={schedule.id}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconClock size={18} />
                      <Typography variant="subtitle2">
                        {schedule.start_time} - {schedule.end_time}
                      </Typography>
                      <Chip label={`Period ${schedule.period_number}`} size="small" color="primary" />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconBook size={18} />
                      <Typography variant="body1" fontWeight="medium">
                        {schedule.subject?.name || schedule.slot_type_details?.name || 'Free Period'}
                      </Typography>
                    </Stack>
                    {schedule.teacher_details?.teacher_details?.user_details?.full_name && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconUser size={18} />
                        <Typography variant="body2" color="text.secondary">
                          {schedule.teacher_details.teacher_details.user_details.full_name}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DrogaCard>
      )}

      {/* Full Schedule Table */}
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h3">
            {isStudent || isParent ? 'My Weekly Schedule' : 'Class Schedule'}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<IconRefresh />}
              onClick={fetchSchedules}
              disabled={loading}
            >
              Refresh
            </Button>
            {canCreateSchedule && (
              <Button
                variant="contained"
                startIcon={<IconPlus />}
                onClick={() => setFormOpen(true)}
              >
                Add Schedule
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<IconSettings />}
                onClick={() => navigate('/schedule/slot-types')}
              >
                Manage Slot Types
              </Button>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Day</InputLabel>
            <Select
              value={selectedDay}
              label="Filter by Day"
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              <MenuItem value="all">All Days</MenuItem>
              {daysOfWeek.map(day => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {isSuperAdmin && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Branch</InputLabel>
              <Select
                value={selectedBranch}
                label="Filter by Branch"
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <MenuItem value="all">All Branches</MenuItem>
                {branches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <ActivityIndicator size={32} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Time</TableCell>
                  {!isStudent && !isParent && (
                    <>
                      <TableCell>Class</TableCell>
                      <TableCell>Section</TableCell>
                    </>
                  )}
                  <TableCell>Subject</TableCell>
                  <TableCell>Teacher</TableCell>
                  {canCreateSchedule && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canCreateSchedule ? 8 : 7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        {isStudent || isParent
                          ? 'No schedule found. Please ensure you are assigned to a class and section.'
                          : 'No schedule found. Click "Add Schedule" to create one.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <Chip
                          label={schedule.day_of_week}
                          size="small"
                          color={schedule.day_of_week === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          Period {schedule.period_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {schedule.start_time} - {schedule.end_time}
                        </Typography>
                      </TableCell>
                      {!isStudent && !isParent && (
                        <>
                          <TableCell>{schedule.class_details?.grade || 'N/A'}</TableCell>
                          <TableCell>{schedule.section_details?.name || 'N/A'}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {schedule.subject?.name || schedule.slot_type_details?.name || 'Free Period'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {schedule.teacher_details?.teacher_details?.user_details?.full_name || 'Not Assigned'}
                      </TableCell>
                      {canCreateSchedule && (
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(schedule)}
                              title="Edit Schedule"
                            >
                              <IconEdit size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(schedule)}
                              title="Delete Schedule"
                            >
                              <IconTrash size={18} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DrogaCard>

      {canCreateSchedule && (
        <ScheduleForm
          open={formOpen}
          onClose={handleFormClose}
          onSuccess={fetchSchedules}
          editingSchedule={editingSchedule}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Schedule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this schedule?
          </Typography>
          {scheduleToDelete && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                <strong>Day:</strong> {scheduleToDelete.day_of_week}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Period:</strong> {scheduleToDelete.period_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Subject:</strong> {scheduleToDelete.subject_details?.name || 'Free Period'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Class:</strong> {scheduleToDelete.class_details?.grade}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default SchedulePage;
