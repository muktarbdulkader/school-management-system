import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Avatar,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import ClassIcon from '@mui/icons-material/Class';
import SubjectIcon from '@mui/icons-material/Subject';
import {
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

const ClassCard = ({
  name,
  class_section,
  schedule,
  student_count,
  last_activity,
  attendance_rate,
  attendanceColor,
  status,
  hasNewAssignment,
  handleFetchingObjectives,
  handleEnrollAll,
  classItem,
  icon,
  isAdmin,
}) => {
  const theme = useTheme();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '100%',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: '#c3e6cc',
              mr: 2,
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {' '}
            {/* minWidth:0 prevents overflow issues */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 0.5,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                lineHeight: 1.2,
              }}
            >
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Grade {class_section}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 0.5,
              alignItems: 'flex-end',
            }}
          >
            {hasNewAssignment && (
              <Chip
                label={isMobile ? 'New' : 'New Assignment'}
                size="small"
                sx={{
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 32 },
                }}
              />
            )}
            <Chip
              label={status}
              size="small"
              sx={{
                bgcolor: '#e8f5e8',
                color: '#2e7d32',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 32 },
              }}
            />
          </Box>
        </Box>

        {/* Info Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 3 },
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ScheduleIcon
              sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              {schedule}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleIcon
              sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              {student_count} Students
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarIcon
              sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              Last: {last_activity || 'NAN'}
            </Typography>
          </Box>
        </Box>

        {/* Attendance Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Attendance Rate
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {attendance_rate}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={typeof attendance_rate === 'number' && !isNaN(attendance_rate) ? attendance_rate : 0}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: '#f5f5f5',
              '& .MuiLinearProgress-bar': {
                bgcolor: attendanceColor,
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Buttons Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            startIcon={!isMobile && <ViewIcon />}
            onClick={() => {
              handleClassCardClick(classItem);
            }}
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              flexGrow: { xs: 1, sm: 0 },
            }}
          >
            {isMobile ? 'View' : 'View Details'}
          </Button>
          <Button
            variant="outlined"
            startIcon={!isMobile && <PeopleIcon />}
            onClick={() => {
              handleClassCardClick(classItem);
            }}
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              flexGrow: { xs: 1, sm: 0 },
            }}
          >
            {isMobile ? 'Attendance' : 'Attendance'}
          </Button>
          <Button
            variant="outlined"
            startIcon={!isMobile && <AssignmentIcon />}
            onClick={() => {
              handleClassCardClick(classItem);
            }}
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              flexGrow: { xs: 1, sm: 0 },
            }}
          >
            {isMobile ? 'Assignments' : 'Assignments'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              handleFetchingObjectives(classItem);
            }}
            startIcon={!isMobile && <ClassIcon />}
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              flexGrow: { xs: 1, sm: 0 },
            }}
          >
            {isMobile ? 'Objective' : 'Objective'}
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              color="success"
              onClick={async (e) => {
                e.stopPropagation();
                setIsEnrolling(true);
                await handleEnrollAll(classItem);
                setIsEnrolling(false);
              }}
              disabled={isEnrolling}
              startIcon={isEnrolling ? <CircularProgress size={20} color="inherit" /> : <PeopleIcon />}
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                flexGrow: { xs: 1, sm: 0 },
                whiteSpace: 'nowrap'
              }}
            >
              {isEnrolling ? 'Enrolling...' : 'Enroll All Students'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClassCard;
