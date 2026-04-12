import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Avatar,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  Person,
  AccessTime,
  School,
  PlayCircle,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import Fallbacks from 'utils/components/Fallbacks';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import { getStatusColor } from 'utils/function';

const ClassCard = ({ classItem, index, onClick }) => {
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.split(':').slice(0, 2).join(':');
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'in progress':
        return <PlayCircle sx={{ fontSize: 16 }} />;
      case 'completed':
        return <CheckCircle sx={{ fontSize: 16 }} />;
      default:
        return <Schedule sx={{ fontSize: 16 }} />;
    }
  };

  const getProgressValue = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 100;
      case 'in progress':
        return 50;
      default:
        return 0;
    }
  };

  const getProgressColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'in progress':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <Fade in timeout={300 + index * 100}>
      <Card
        onClick={() => onClick?.(classItem)}
        sx={{
          minWidth: 320,
          flexShrink: 0,
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid',
          borderColor: classItem.status === 'In Progress' ? '#3b82f6' : 'divider',
          boxShadow: classItem.status === 'In Progress'
            ? '0 4px 20px rgba(59, 130, 246, 0.15)'
            : '0 2px 10px rgba(0,0,0,0.04)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          },
          '&::before': classItem.status === 'In Progress' ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          } : {},
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: classItem.status === 'In Progress' ? '#3b82f6' : '#f3f4f6',
                  color: classItem.status === 'In Progress' ? 'white' : '#6b7280',
                  width: 40,
                  height: 40,
                }}
              >
                <School sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#1f2937', lineHeight: 1.2 }}>
                  {classItem.subject || 'Class'}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Period {classItem.period_number}
                </Typography>
              </Box>
            </Box>
            <Chip
              icon={getStatusIcon(classItem.status)}
              label={classItem.status || 'Scheduled'}
              size="small"
              sx={{
                bgcolor: classItem.status === 'In Progress' ? '#dbeafe' : '#f3f4f6',
                color: classItem.status === 'In Progress' ? '#1d4ed8' : '#6b7280',
                fontWeight: 600,
                textTransform: 'capitalize',
                borderRadius: 2,
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
          </Box>

          {/* Time */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              p: 1.5,
              bgcolor: '#f9fafb',
              borderRadius: 2,
            }}
          >
            <AccessTime sx={{ fontSize: 18, color: '#6b7280' }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: '#4b5563' }}>
              {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
            </Typography>
          </Box>

          {/* Teacher */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: '#e5e7eb' }}>
              <Person sx={{ fontSize: 16, color: '#6b7280' }} />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#374151' }}>
                {classItem.teacher_name || classItem.teacher_id || 'Teacher'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {classItem?.current_unit?.name || 'Current Unit'}
              </Typography>
            </Box>
          </Box>

          {/* Attendance Status */}
          {classItem?.attendance_status && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={classItem.attendance_status}
                size="small"
                sx={{
                  ...getStatusColor(classItem.attendance_status),
                  fontWeight: 600,
                  borderRadius: 1.5,
                }}
              />
            </Box>
          )}

          {/* Progress */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" fontWeight={600} sx={{ color: '#6b7280' }}>
                Class Progress
              </Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: getProgressColor(classItem.status) }}>
                {classItem.status === 'completed' ? 'Completed' : classItem.status === 'In Progress' ? 'In Progress' : 'Upcoming'}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getProgressValue(classItem.status)}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#e5e7eb',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getProgressColor(classItem.status),
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default function TodaysClasses({
  classes = [],
  onClassClick,
  loading = false,
  error = false,
}) {
  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Today's Classes
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Today's Classes
        </Typography>
        <ErrorPrompt
          title="Error Loading Schedule"
          message="There was an error loading today's schedule"
          size={100}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Today's Classes
      </Typography>

      {classes.length === 0 ? (
        <Fallbacks
          severity="info"
          title="No Classes Scheduled"
          description="There are no classes scheduled for today"
          sx={{ paddingTop: 6 }}
          size={100}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 2.5,
            overflowX: 'auto',
            pb: 2,
            px: 0.5,
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f3f4f6',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#d1d5db',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: '#9ca3af',
              },
            },
          }}
        >
          {classes.map((classItem, index) => (
            <ClassCard
              key={`${classItem.period_number}-${classItem.subject}`}
              classItem={classItem}
              index={index}
              onClick={onClassClick}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
