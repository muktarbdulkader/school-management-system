import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Fade,
} from '@mui/material';
import {
  RateReview,
  EventNote,
  TrendingUp,
  BeachAccess,
  School,
  Chat,
  Assignment,
  ChildCare,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const QuickActionCard = ({ action, index }) => {
  const navigate = useNavigate();

  return (
    <Fade in timeout={300 + index * 100}>
      <Card
        onClick={() => navigate(action.path)}
        sx={{
          cursor: 'pointer',
          height: '100%',
          background: `linear-gradient(135deg, ${action.gradient[0]} 0%, ${action.gradient[1]} 100%)`,
          borderRadius: 3,
          border: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            '& .action-icon': {
              transform: 'scale(1.1) rotate(5deg)',
            },
            '& .action-arrow': {
              opacity: 1,
              transform: 'translateX(0)',
            },
          },
        }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Avatar
              className="action-icon"
              sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                color: 'white',
                width: 48,
                height: 48,
                transition: 'transform 0.3s ease',
                backdropFilter: 'blur(10px)',
              }}
            >
              {action.icon}
            </Avatar>
            <ArrowForward
              className="action-arrow"
              sx={{
                color: 'white',
                opacity: 0.6,
                transition: 'all 0.3s ease',
                transform: 'translateX(-8px)',
                fontSize: 20,
              }}
            />
          </Box>

          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: '1rem',
              mb: 0.5,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {action.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            {action.description}
          </Typography>

          {action.badge && (
            <Chip
              size="small"
              label={action.badge}
              sx={{
                mt: 1.5,
                bgcolor: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
                backdropFilter: 'blur(10px)',
              }}
            />
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

export default function QuickActions() {
  const navigate = useNavigate();
  const studentId = useSelector((state) => state.student?.studentId);

  const actions = [
    {
      icon: <ChildCare />,
      title: 'Child Profile',
      description: 'View progress & reports',
      path: studentId ? `/child-profile/${studentId}` : '/',
      gradient: ['#667eea', '#764ba2'],
      badge: 'View',
    },
    {
      icon: <RateReview />,
      title: 'Rate Teachers',
      description: 'Provide feedback',
      path: '/teacher-ratings',
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      icon: <EventNote />,
      title: 'Request Meeting',
      description: 'Schedule with teachers',
      path: '/meeting-requests',
      gradient: ['#4facfe', '#00f2fe'],
    },
    {
      icon: <Chat />,
      title: 'Messages',
      description: 'Chat with teachers',
      path: '/messages',
      gradient: ['#43e97b', '#38f9d7'],
      badge: 'New',
    },
    {
      icon: <Assignment />,
      title: 'Announcements',
      description: 'School notices',
      path: '/announcements',
      gradient: ['#fa709a', '#fee140'],
    },
    {
      icon: <BeachAccess />,
      title: 'Leave Requests',
      description: 'Submit requests',
      path: '/leave-requests',
      gradient: ['#30cfd0', '#330867'],
    },
    {
      icon: <School />,
      title: 'School Blog',
      description: 'Latest news',
      path: '/blog',
      gradient: ['#a8edea', '#fed6e3'],
    },
    {
      icon: <TrendingUp />,
      title: 'Performance',
      description: 'Track grades',
      path: '/grades',
      gradient: ['#ff9a9e', '#fecfef'],
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        Quick Actions
      </Typography>

      <Grid container spacing={2.5}>
        {actions.slice(0, 6).map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <QuickActionCard action={action} index={index} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
