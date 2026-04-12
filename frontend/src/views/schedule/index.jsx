import React, { useEffect, useState } from 'react';
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
  Paper
} from '@mui/material';
import { IconRefresh, IconPlus, IconClock, IconBook, IconUser } from '@tabler/icons-react';
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
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  
  const userRoles = useSelector((state) => {
    try {
      return state?.user?.user?.roles || state?.auth?.user?.roles || [];
    } catch (error) {
      console.error('Error accessing user roles:', error);
      return [];
    }
  });
  
  const canCreateSchedule = hasPermission(userRoles, PERMISSIONS.CREATE_SCHEDULE);
  const isStudent = userRoles.some(role => role.toLowerCase() === 'student');
  const isParent = userRoles.some(role => role.toLowerCase() === 'parent');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchSchedules();
    if (isStudent) {
      fetchStudentInfo();
    }
  }, []);

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
      const response = await fetch(`${Backend.api}${Backend.scheduleSlots}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Schedule data:', data);
        const scheduleData = data.data || data.results || [];
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
          </Stack>
        </Stack>

        <FormControl sx={{ mb: 3, minWidth: 200 }}>
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
                          <Button size="small">Edit</Button>
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
          onClose={() => setFormOpen(false)}
          onSuccess={fetchSchedules}
        />
      )}
    </PageContainer>
  );
};

export default SchedulePage;
