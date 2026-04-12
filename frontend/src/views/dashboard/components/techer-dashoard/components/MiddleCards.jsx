import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  Avatar,
} from '@mui/material';
import {
  WarningAmberOutlined,
  ErrorOutline,
  NotificationsNoneOutlined,
  PersonOutline,
  Circle,
} from '@mui/icons-material';

export default function MiddleCards() {
  return (
    <Grid item xs={12} md={6}>
      {/* Overdue Grading Card */}
      <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <WarningAmberOutlined
              sx={{ color: '#FFC107', mr: 1, fontSize: 20 }}
            />
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontWeight: 'medium' }}
            >
              Overdue Grading
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ErrorOutline sx={{ color: '#F44336', fontSize: 18, mr: 1 }} />
            <Typography variant="body2" color="text.primary">
              3 students haven't submitted
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WarningAmberOutlined
              sx={{ color: '#FFC107', fontSize: 18, mr: 1 }}
            />
            <Typography variant="body2" color="text.primary">
              2 need regrading
            </Typography>
          </Box>
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
            Go to Assignment
          </Button>
        </CardContent>
      </Card>

      {/* Notices from School Card */}
      <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Notices from School
            </Typography>
          }
          avatar={
            <NotificationsNoneOutlined
              sx={{ color: '#F44336', fontSize: 24 }}
            />
          }
          sx={{ pb: 0 }}
        />
        <CardContent sx={{ pt: 2 }}>
          <List disablePadding>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <Circle sx={{ fontSize: 8, color: '#F44336' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Curriculum meeting rescheduled
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Today at 4:00 PM
                  </Typography>
                }
              />
            </ListItem>
            <ListItem disablePadding sx={{ mb: 2 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <Circle sx={{ fontSize: 8, color: '#F44336' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    COVID alert for student Yohannes T.
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Required action
                  </Typography>
                }
              />
            </ListItem>
          </List>
          <Link
            href="#"
            underline="none"
            sx={{
              color: '#4263EB',
              fontWeight: 'medium',
              display: 'block',
              mt: 1,
            }}
          >
            View All Notices &gt;
          </Link>
        </CardContent>
      </Card>

      {/* Parent Requests Card */}
      <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Parent Requests
            </Typography>
          }
          avatar={<PersonOutline sx={{ color: '#2196F3', fontSize: 24 }} />}
          sx={{ pb: 0 }}
        />
        <CardContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            1 meeting pending:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#E0E0E0',
                color: 'text.primary',
                width: 36,
                height: 36,
                fontSize: 16,
                mr: 1.5,
                fontWeight: 'bold',
              }}
            >
              NN
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              Nati Negusse's Parent
            </Typography>
          </Box>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#4263EB',
              '&:hover': { bgcolor: '#3654D9' },
              width: '100%',
              py: 1.2,
            }}
          >
            Schedule Meeting
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );
}
