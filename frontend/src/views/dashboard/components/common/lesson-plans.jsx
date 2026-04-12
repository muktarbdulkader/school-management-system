import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import { IconBook } from '@tabler/icons-react';

const DailyLessonPlans = ({ lessonPlans }) => {
  return (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <IconBook size={24} color="#2196f3" />
          <Typography variant="h4" fontWeight="bold">
            Daily Lesson Plans
          </Typography>
        </Box>
        
        {!lessonPlans || lessonPlans.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No lesson plans available for this period.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {lessonPlans.map((lesson, index) => (
              <React.Fragment key={lesson.id}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ 
                    px: 0, 
                    py: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {lesson.subject_id_name || lesson.subject_id?.name || 'Subject'}
                        </Typography>
                        <Chip 
                          label={new Date(lesson.created_at).toLocaleDateString()} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
                          Aim: {lesson.lesson_aims}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Unit: {lesson.unit_id_name || lesson.unit_id?.name || 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < lessonPlans.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyLessonPlans;
