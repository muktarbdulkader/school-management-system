import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  Box,
  Divider,
  Typography,
  Chip,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Circle, Visibility } from '@mui/icons-material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import TimelineCardSkeleton from './TimelineCardSkeleton';

const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

// Helper function to determine status based on current time
const getStatus = (startTime, periodNumber, currentPeriod) => {
  if (periodNumber === currentPeriod) return 'live';
  if (periodNumber < currentPeriod) return 'Complete';
  return 'Upcoming';
};

const getStatusStyles = (status) => {
  switch (status) {
    case 'live':
      return {
        color: '#4263EB',
        dividerColor: '#4263EB',
        cardProps: { bgcolor: '#E8F0FE', borderColor: '#4263EB' },
        chipProps: { bgcolor: '#4263EB', color: 'white' },
        buttonProps: { variant: 'contained' },
      };
    case 'Complete':
      return {
        color: 'text.disabled',
        dividerColor: 'divider',
        cardProps: { borderColor: '#E0E0E0' },
        chipProps: { bgcolor: '#E0E0E0', color: 'text.primary' },
        buttonProps: { variant: 'outlined' },
      };
    case 'Upcoming':
      return {
        color: 'text.disabled',
        dividerColor: 'divider',
        cardProps: { borderColor: '#E0E0E0' },
        chipProps: { bgcolor: '#FFF3E0', color: '#FB8C00' },
        buttonProps: { variant: 'outlined' },
      };
    default:
      return {
        color: 'text.disabled',
        dividerColor: 'divider',
        cardProps: { borderColor: '#E0E0E0' },
        chipProps: { bgcolor: '#E0E0E0', color: 'text.primary' },
        buttonProps: { variant: 'outlined' },
      };
  }
};

// Helper function to get button text based on status
const getButtonText = (status) => {
  switch (status) {
    case 'live':
      return 'Mark Attendance';
    case 'Complete':
      return 'View Class';
    case 'Upcoming':
      return 'Start Class';
    default:
      return 'View Details';
  }
};

export default function TimelineCard({ scheduleData = [], loading = false }) {
  const navigate = useNavigate();
  const [loadingItem, setLoadingItem] = useState(null);
  const [loadingUnit, setLoadingUnit] = useState(null);

  const handleViewDetails = async (scheduleItem) => {
    setLoadingItem(scheduleItem.period_number);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.learningObjectivesTeacherObjectives}${scheduleItem.class_id}/${scheduleItem.section_id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        const { class: classInfo, objectives } = responseData.data;
        navigate('/learning-objectives', {
          state: {
            classData: classInfo,
            objectives,
            class_id: scheduleItem.class_id,
            section_id: scheduleItem.section_id,
          },
        });
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingItem(null);
    }
  };

  const handleViewClassUnit = async (scheduleItem) => {
    setLoadingUnit(scheduleItem.period_number);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.teachersClassUnits}${scheduleItem.class_id}/${scheduleItem.section_id}/${scheduleItem.subject_id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        navigate('/teachers-class-units', {
          state: {
            classData: responseData.data,
          },
        });
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingUnit(null);
    }
  };

  // inside TimelineCard component, after your other handlers
  const handlePrimaryButtonClick = (scheduleItem, status) => {
    // status values: 'live', 'Complete', 'Upcoming'
    if (status === 'live') {
      const parts = scheduleItem.class.split(" - ");
      const [className, sectionName] = parts.length === 2 ? parts : [scheduleItem.class, ''];
      // Prepare payload for AttendanceMark page
      const payload = {
        classId: scheduleItem.class_id,
        sectionId: scheduleItem.section_id,
        subjectId: scheduleItem.subject_id,
        className: className,
        sectionName: sectionName,
        // optional: if you already have roster here, include students: rosterArray
        // students: rosterArray
      };
      try {
        sessionStorage.setItem('attendance_redirect', JSON.stringify(payload));
      } catch (e) {
        console.warn('sessionStorage not available', e);
      }
      navigate('/classes/AttendanceMark');
      return;
    }

    if (status === 'Complete') {
      // Navigate to ClassDetail — adjust path if your route differs
      navigate('/classes/components/ClassDetail', {
        state: {
          classId: scheduleItem.class_id,
          sectionId: scheduleItem.section_id,
          subjectId: scheduleItem.subject_id,
          periodNumber: scheduleItem.period_number,
          item: scheduleItem, // pass everything if you want
        },
      });
      return;
    }

    // Upcoming: we don't have anything to do — show a small hint (or do nothing)
    toast.info('Start Class is not implemented yet.');
  };

  const currentPeriod = 2;

  if (loading) {
    return <TimelineCardSkeleton />;
  }

  if (!scheduleData || scheduleData.length === 0) {
    return (
      <Card
        sx={{ borderRadius: 3, boxShadow: 3, mb: 3, p: 3, textAlign: 'center' }}
      >
        <Typography variant="h6" color="text.secondary">
          No schedule data available
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Today's Timeline
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 2 }}>
        <List disablePadding>
          {scheduleData.map((scheduleItem, index) => {
            const status = getStatus(
              scheduleItem.start_time,
              scheduleItem.period_number,
              currentPeriod,
            );
            const styles = getStatusStyles(status);

            return (
              <ListItem
                key={scheduleItem.period_number || index}
                sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, px: 0 }}
              >
                {/* Timeline indicator */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mr: 2,
                  }}
                >
                  <Circle sx={{ fontSize: 10, color: styles.color }} />
                  {index !== scheduleData.length - 1 && (
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        height: 90,
                        borderColor: styles.dividerColor,
                        borderStyle: 'dashed',
                      }}
                    />
                  )}
                </Box>

                {/* Card content */}
                <Card
                  variant="outlined"
                  sx={{
                    flexGrow: 1,
                    borderRadius: 2,
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    ...styles.cardProps,
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      width: '100%',
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(scheduleItem.start_time)} -{' '}
                        {scheduleItem.end_time
                          ? formatTime(scheduleItem.end_time)
                          : 'N/A'}
                      </Typography>
                      <Typography
                        variant="h7"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          mt: 0.5,
                        }}
                      >
                        Period {scheduleItem.period_number}:{' '}
                        {scheduleItem.subject || 'not specified'} -{' '}
                        {scheduleItem.class || 'not specified'}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {scheduleItem.location || 'not specified'}
                      </Typography>
                    </Box>
                    <Chip
                      label={status}
                      size="small"
                      sx={{ ml: 1, fontWeight: 'medium', ...styles.chipProps }}
                    />
                  </Box>

                  {/* Buttons */}
                  <Box
                    sx={{
                      p: 2,
                      pt: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => handleViewDetails(scheduleItem)}
                        disabled={loadingItem === scheduleItem.period_number}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: '#4263EB',
                            bgcolor: 'transparent',
                          },
                          textTransform: 'none',
                          fontWeight: 'normal',
                        }}
                      >
                        {loadingItem === scheduleItem.period_number ? (
                          <CircularProgress size={16} />
                        ) : (
                          'View Details'
                        )}
                      </Button>

                      <Button
                        size="small"
                        onClick={() => handleViewClassUnit(scheduleItem)}
                        disabled={loadingUnit === scheduleItem.period_number}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: '#4263EB',
                            bgcolor: 'transparent',
                          },
                          textTransform: 'none',
                          fontWeight: 'normal',
                        }}
                      >
                        {loadingUnit === scheduleItem.period_number ? (
                          <CircularProgress size={16} />
                        ) : (
                          'View Class Unit'
                        )}
                      </Button>
                    </Box>

                    <Button
                      size="small"
                      onClick={() =>
                        handlePrimaryButtonClick(scheduleItem, status)
                      }
                      sx={{
                        borderColor: '#4263EB',
                        color: status === 'live' ? 'white' : '#4263EB',
                        '&:hover': {
                          borderColor: '#3654D9',
                          bgcolor: status === 'live' ? '#3654D9' : '#E8F0FE',
                        },
                        ...styles.buttonProps,
                      }}
                    >
                      {getButtonText(status)}
                    </Button>
                  </Box>
                </Card>
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}
