import React from 'react';
import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  Box,
} from '@mui/material';
import {
  CheckCircleOutline,
  MailOutline,
  DescriptionOutlined,
  CalendarTodayOutlined,
  Circle,
} from '@mui/icons-material';

export default function RightCards() {
  return (
    <Grid item xs={12} md={6}>
      {/* Calendar Card */}
      <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Calendar
            </Typography>
          }
          sx={{ pb: 0 }}
        />
        <CardContent sx={{ pt: 2 }}>
          <Typography
            variant="subtitle2"
            align="center"
            sx={{ mb: 2, fontWeight: 'medium' }}
          >
            Hamle 2016 EC
          </Typography>
          <Grid container spacing={0} sx={{ textAlign: 'center' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <Grid item xs={1.71} key={day}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 'bold' }}
                >
                  {day}
                </Typography>
              </Grid>
            ))}
            {Array.from({ length: 30 }, (_, i) => i + 1).map((date) => (
              <Grid item xs={1.71} key={date} sx={{ p: 0.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    bgcolor: date === 26 ? '#4263EB' : 'transparent',
                    color: date === 26 ? 'white' : 'text.primary',
                    fontWeight: date === 26 ? 'bold' : 'normal',
                    position: 'relative',
                    transition: 'background-color 0.2s, color 0.2s',
                    '&:hover': {
                      bgcolor: date !== 26 ? '#E8F0FE' : undefined,
                      cursor: date !== 26 ? 'pointer' : undefined,
                    },
                  }}
                >
                  <Typography variant="body2">{date}</Typography>
                  {(date === 5 ||
                    date === 12 ||
                    date === 19 ||
                    date === 26) && (
                    <Circle
                      sx={{
                        fontSize: 6,
                        color: '#4263EB',
                        position: 'absolute',
                        bottom: 4,
                      }}
                    />
                  )}
                  {(date === 23 || date === 24 || date === 25) && (
                    <Circle
                      sx={{
                        fontSize: 6,
                        color: '#F44336',
                        position: 'absolute',
                        bottom: 4,
                      }}
                    />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Upcoming Card */}
      <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Upcoming
            </Typography>
          }
          sx={{ pb: 0 }}
        />
        <CardContent sx={{ pt: 2 }}>
          <List disablePadding>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <Circle sx={{ fontSize: 8, color: '#4263EB' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Parent-Teacher Meeting
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    28 Hamle - 2:00 PM
                  </Typography>
                }
              />
            </ListItem>
            <ListItem disablePadding>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <Circle sx={{ fontSize: 8, color: '#F44336' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Staff Meeting
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    23 Hamle - 4:00 PM
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Recent Activity
            </Typography>
          }
          sx={{ pb: 0 }}
        />
        <CardContent sx={{ pt: 2 }}>
          <List disablePadding>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <CheckCircleOutline sx={{ fontSize: 18, color: '#4CAF50' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Class Completed
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Grade 10 Mathematics - Period 1<br />
                    Today, 11:45 AM
                  </Typography>
                }
              />
            </ListItem>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <MailOutline sx={{ fontSize: 18, color: '#2196F3' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    New Message
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="caption" color="text.secondary">
                      From: Hiwot Girma (Parent)
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      Today, 10:22 AM
                    </Typography>
                    <br />
                    <Link
                      href="#"
                      underline="none"
                      sx={{ color: '#4263EB', fontSize: 12 }}
                    >
                      Read Message
                    </Link>
                  </>
                }
              />
            </ListItem>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <DescriptionOutlined sx={{ fontSize: 18, color: '#FFC107' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Assignment Due
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="caption" color="text.secondary">
                      Grade 9 Algebra homework needs grading
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      Yesterday, 4:30 PM
                    </Typography>
                    <br />
                    <Link
                      href="#"
                      underline="none"
                      sx={{ color: '#4263EB', fontSize: 12 }}
                    >
                      Review Now
                    </Link>
                  </>
                }
              />
            </ListItem>
            <ListItem disablePadding>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <CalendarTodayOutlined
                  sx={{ fontSize: 18, color: '#9C27B0' }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Meeting Scheduled
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Department Meeting - Room 105
                    <br />
                    Tomorrow, 2:00 PM
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Grid>
  );
}
