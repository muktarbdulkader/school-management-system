import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Link,
  Box,
  Skeleton,
} from '@mui/material';
import {
  AccessTime,
  AssignmentOutlined,
  ChatBubbleOutline,
  WarningAmberOutlined,
} from '@mui/icons-material';

const cardStyles = {
  borderRadius: 3,
  boxShadow: 3,
  transition: 'transform 0.2s',
  '&:hover': { transform: 'translateY(-5px)' },
};

const CardSkeleton = () => (
  <Grid item xs={12} sm={6} md={3}>
    <Card sx={cardStyles}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton width="50%" height={20} sx={{ ml: 1 }} />
        </Box>
        <Skeleton variant="text" width="80%" height={32} />
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="rectangular" height={40} sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  </Grid>
);

export default function TopCards({ cardsData, loading }) {
  if (loading) {
    return Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />);
  }

  if (!cardsData) return null;

  const cardData = [
    {
      icon: <AccessTime sx={{ color: '#4CAF50', mr: 1, fontSize: 20 }} />,
      title: 'Next Class In',
      content: cardsData.next_class
        ? `${cardsData.next_class.time_remaining} – ${cardsData.next_class.grade} <br /> ${cardsData.next_class.subject}`
        : 'No upcoming class',
      action: cardsData.next_class && (
        <Button
          variant="contained"
          sx={{
            bgcolor: '#4263EB',
            '&:hover': { bgcolor: '#3654D9' },
            width: '100%',
            mt: 2,
            py: 1.2,
          }}
        >
          Prepare
        </Button>
      ),
    },
    {
      icon: (
        <AssignmentOutlined sx={{ color: '#FFC107', mr: 1, fontSize: 20 }} />
      ),
      title: 'Pending Grading Tasks',
      content: `${cardsData.unchecked_assignments.count} Assignments <br /> Unchecked`,
      action: (
        <Link
          href="#"
          underline="none"
          sx={{
            color: '#4263EB',
            fontWeight: 'medium',
            display: 'block',
            mt: 2,
          }}
        >
          Go to Grading &gt;
        </Link>
      ),
    },
    {
      icon: (
        <ChatBubbleOutline sx={{ color: '#2196F3', mr: 1, fontSize: 20 }} />
      ),
      title: 'Unread Messages',
      content: `${cardsData.parent_feedbacks} Parent Requests`,
      subtitle:
        cardsData.parent_feedbacks > 0
          ? 'Latest: Today, 10:45 AM'
          : 'No new messages',
      action: (
        <Link
          href="#"
          underline="none"
          sx={{
            color: '#4263EB',
            fontWeight: 'medium',
            display: 'block',
            mt: 2,
          }}
        >
          View Messages &gt;
        </Link>
      ),
    },
    {
      icon: (
        <WarningAmberOutlined sx={{ color: '#F44336', mr: 1, fontSize: 20 }} />
      ),
      title: 'Progress Alerts',
      content: '3 Students Falling Behind',
      subtitle: '1 Critical, 2 Moderate',
      action: (
        <Link
          href="#"
          underline="none"
          sx={{
            color: '#4263EB',
            fontWeight: 'medium',
            display: 'block',
            mt: 2,
          }}
        >
          View Details &gt;
        </Link>
      ),
    },
  ];

  return cardData.map((card, index) => (
    <Grid item xs={12} sm={6} md={3} key={index}>
      <Card sx={cardStyles}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {card.icon}
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontWeight: 'medium' }}
            >
              {card.title}
            </Typography>
          </Box>
          <Typography
            variant="h5"
            component="div"
            sx={{ fontWeight: 'bold', mb: 1, lineHeight: 1.3 }}
            dangerouslySetInnerHTML={{ __html: card.content }}
          />
          {card.subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {card.subtitle}
            </Typography>
          )}
          {card.action}
        </CardContent>
      </Card>
    </Grid>
  ));
}
