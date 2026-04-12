import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, Divider, Chip, Grid, Stack } from '@mui/material';
import { IconReportAnalytics, IconCalendarEvent } from '@tabler/icons-react';

const ExamsAndResults = ({ exams, results, assignments }) => {
  return (
    <Grid container spacing={2}>
      {/* Upcoming Exams (4 columns on md) */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', borderRadius: 2 }}>
          {/* ... existing content ... */}
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <IconCalendarEvent size={24} color="#f44336" />
              <Typography variant="h4" fontWeight="bold">
                Upcoming Exams
              </Typography>
            </Box>

            {!exams || exams.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No upcoming exams.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {exams.map((exam, index) => (
                  <React.Fragment key={exam.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ maxWidth: '60%' }}>
                              {exam.name}
                            </Typography>
                            <Chip 
                              label={exam.type} 
                              size="small" 
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Subject: {exam.subject}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {new Date(exam.start_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < exams.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Exam Results (4 columns on md) */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <IconReportAnalytics size={24} color="#4caf50" />
              <Typography variant="h4" fontWeight="bold">
                Exam Results
              </Typography>
            </Box>

            {!results || results.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No results yet.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {results.map((result, index) => (
                  <React.Fragment key={result.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ maxWidth: '70%' }}>
                              {result.subject_id_name || result.subject_id?.name || 'Subject'}
                            </Typography>
                            <Typography variant="h5" color={result.score >= (result.max_score / 2) ? 'success.main' : 'error.main'}>
                              {result.score}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Out of {result.max_score}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < results.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Assignment Grades (4 columns on md) */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <IconReportAnalytics size={24} color="#2196f3" />
              <Typography variant="h4" fontWeight="bold">
                Assignments
              </Typography>
            </Box>

            {!assignments || assignments.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No graded assignments.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {assignments.map((ass, index) => (
                  <React.Fragment key={ass.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ maxWidth: '70%' }}>
                              {ass.assignment_id_name || ass.assignment_id?.title || 'Assignment'}
                            </Typography>
                            <Typography variant="h5" color="primary">
                              {ass.grade}%
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {ass.assignment_id?.subject_id?.name || 'Subject'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < assignments.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ExamsAndResults;
