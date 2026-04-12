import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Link,
  Container,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';

const GradientCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
  color: 'white',
  padding: theme.spacing(4),
  borderRadius: 16,
}));

const CalendarDay = styled(Box)(({ theme, status }) => {
  const getBackgroundColor = () => {
    switch (status) {
      case 'complete':
        return '#10B981'; // Green
      case 'partial':
        return '#F59E0B'; // Orange
      case 'missing':
        return '#EF4444'; // Red
      case 'today':
        return '#FFFFFF'; // White
      case 'empty':
        return 'rgba(254, 253, 255, 0.3)';
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'today':
        return '#000000'; // Black text
      case 'empty':
        return '#FFFFFF'; // lighter white text
      default:
        return '#FFFFFF';
    }
  };

  const getBorder = () => {
    if (status === 'today') {
      return '2px solid #2563EB'; // blue border for today
    }
    return 'none';
  };

  return {
    width: 48,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: getBackgroundColor(),
    color: getTextColor(),
    borderRadius: 10,
    fontSize: '14px',
    fontWeight: 500,
    cursor: status !== 'empty' ? 'pointer' : 'default',
    border: getBorder(),
    userSelect: 'none',
    '&:hover': {
      opacity: status !== 'empty' ? 0.8 : 1,
    },
  };
});

const LegendItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

const LegendDot = styled(Box)(({ color }) => ({
  width: 14,
  height: 14,
  borderRadius: '50%',
  backgroundColor: color,
}));

const AttendanceCalendar = ({
  studentsData,
  classData,
  headerData,
  subjectId,
}) => {
  const navigate = useNavigate();

  const calendarData = [
    { day: 1, status: 'complete' },
    { day: 2, status: 'complete' },
    { day: 3, status: 'complete' },
    { day: 4, status: 'empty' },
    { day: 5, status: 'empty' },
    { day: 6, status: 'complete' },
    { day: 7, status: 'complete' },
    { day: 8, status: 'partial' },
    { day: 9, status: 'complete' },
    { day: 10, status: 'complete' },
    { day: 11, status: 'empty' },
    { day: 12, status: 'empty' },
    { day: 13, status: 'complete' },
    { day: 14, status: 'complete' },
    { day: 15, status: 'complete' },
    { day: 16, status: 'missing' },
    { day: 17, status: 'complete' },
    { day: 18, status: 'empty' },
    { day: 19, status: 'empty' },
    { day: 20, status: 'complete' },
    { day: 21, status: 'today' },
    { day: 22, status: 'empty' },
    { day: 23, status: 'empty' },
    { day: 24, status: 'empty' },
    { day: 25, status: 'empty' },
    { day: 26, status: 'empty' },
    { day: 27, status: 'empty' },
    { day: 28, status: 'empty' },
    { day: 29, status: 'empty' },
    { day: 30, status: 'empty' },
    { day: 31, status: 'empty' },
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Attendance
        </Typography>
        <Link
          href="#"
          underline="none"
          color="primary"
          sx={{ fontWeight: 500 }}
        >
          View Full Attendance →
        </Link>
      </Box>

      {/* Calendar Card */}
      <GradientCard>
        {/* Calendar Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ mb: 1, color: 'white' }}
            >
              October 2023
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, color: 'white' }}>
              Current Month Attendance: 92%
            </Typography>
          </Box>
          <Button
            variant="contained"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)', // semi-transparent white
              backdropFilter: 'blur(10px)',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: 3,
              px: 3,
              py: 1,

              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(12px)',
              },
            }}
            onClick={() =>
              navigate('/classes/AttendanceMark', {
                state: {
                  students: studentsData,
                  className: classData?.name,
                  sectionName: headerData?.section_name,
                  subjectId: subjectId,
                  classId: classData.class_id,
                  sectionId: classData.section_id,
                },
              })
            }
          >
            Mark Today's Attendance
          </Button>
        </Box>

        {/* Days of Week Header */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {daysOfWeek.map((day) => (
            <Grid item xs key={day}>
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.7, fontWeight: 600, color: 'white' }}
                >
                  {day}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Grid */}
        <Grid container spacing={1} sx={{ mb: 3 }}>
          {calendarData.map((dayData) => (
            <Grid item xs={1.71} key={dayData.day}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CalendarDay status={dayData.status} sx={{ px: 8 }}>
                  {dayData.day}
                </CalendarDay>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <LegendItem>
            <LegendDot color="#10B981" />
            <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
              Complete
            </Typography>
          </LegendItem>
          <LegendItem>
            <LegendDot color="#F59E0B" />
            <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
              Partial
            </Typography>
          </LegendItem>
          <LegendItem>
            <LegendDot color="#EF4444" />
            <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
              Missing
            </Typography>
          </LegendItem>
          <LegendItem>
            <LegendDot color="#FFFFFF" />
            <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
              Today
            </Typography>
          </LegendItem>
        </Box>
      </GradientCard>
    </Container>
  );
};

export default AttendanceCalendar;
