import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  Fade,
} from '@mui/material';
import {
  CalendarToday,
  Alarm,
  CheckCircle,
  Warning,
  Assignment as AssignmentIcon,
  ArrowForward,
} from '@mui/icons-material';
import { getStatusColor } from 'utils/function';

const AssignmentCard = ({ assignment, index }) => {
  const getDueDateStatus = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { icon: <Warning sx={{ fontSize: 16 }} />, color: '#ef4444', label: 'Overdue' };
    if (diffDays <= 1) return { icon: <Alarm sx={{ fontSize: 16 }} />, color: '#f59e0b', label: 'Due Soon' };
    if (diffDays <= 3) return { icon: <CalendarToday sx={{ fontSize: 16 }} />, color: '#3b82f6', label: 'Upcoming' };
    return { icon: <CheckCircle sx={{ fontSize: 16 }} />, color: '#10b981', label: 'Scheduled' };
  };

  const status = getDueDateStatus(assignment.due_date);

  return (
    <Fade in timeout={300 + index * 100}>
      <Card
        sx={{
          mb: 2,
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            transform: 'translateX(8px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            borderColor: status.color,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: status.color,
          },
        }}
      >
        <CardContent sx={{ py: 2.5, px: 3, pl: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: `${status.color}15`,
                color: status.color,
                width: 48,
                height: 48,
              }}
            >
              <AssignmentIcon sx={{ fontSize: 24 }} />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1f2937' }}>
                  {assignment.title}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#6b7280', mb: 1.5, fontWeight: 500 }}>
                {assignment.subject}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  icon={status.icon}
                  label={`Due: ${assignment.due_date}`}
                  size="small"
                  sx={{
                    bgcolor: `${status.color}15`,
                    color: status.color,
                    fontWeight: 600,
                    borderRadius: 2,
                    '& .MuiChip-icon': {
                      color: 'inherit',
                    },
                  }}
                />

                {assignment.status && (
                  <Chip
                    label={assignment.status}
                    size="small"
                    sx={{
                      ...getStatusColor(assignment.status),
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  />
                )}
              </Box>
            </Box>

            <ArrowForward
              sx={{
                color: '#9ca3af',
                fontSize: 20,
                mt: 0.5,
                transition: 'all 0.3s ease',
                opacity: 0.5,
              }}
              className="hover-arrow"
            />
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default function UpcomingAssignments({
  assignments = [],
  onViewAll,
}) {
  if (assignments.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Upcoming Assignments
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(145deg, #f9fafb 0%, #f3f4f6 100%)',
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Avatar
              sx={{
                bgcolor: '#10b98115',
                color: '#10b981',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
              }}
            >
              <CheckCircle sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1f2937', mb: 1 }}>
              All Caught Up!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No upcoming assignments at the moment
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Upcoming Assignments
        </Typography>

        <Button
          variant="outlined"
          size="small"
          onClick={onViewAll}
          endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#e5e7eb',
            color: '#6b7280',
            '&:hover': {
              borderColor: '#3b82f6',
              color: '#3b82f6',
              bgcolor: '#eff6ff',
            },
          }}
        >
          View All
        </Button>
      </Box>

      <Box>
        {assignments.map((assignment, index) => (
          <AssignmentCard
            key={assignment.id || assignment.title}
            assignment={assignment}
            index={index}
          />
        ))}
      </Box>
    </Box>
  );
}
