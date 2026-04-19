import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, Divider, Chip, Collapse, IconButton, Grid, Paper, Stack, Tooltip } from '@mui/material';
import { IconBook, IconChevronDown, IconChevronUp, IconClock, IconUser, IconTarget, IconActivity } from '@tabler/icons-react';

const DailyLessonPlans = ({ lessonPlans }) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs ? `${hrs}h ${mins}min` : `${mins}min`;
  };

  // Parse learner activities from the combined text
  const parseLearnerActivities = (text) => {
    if (!text) return {};
    const groups = {};
    const lines = text.split('\n');
    lines.forEach(line => {
      const match = line.match(/^(group\d+):\s*(.+)/i);
      if (match) {
        const [, groupName, activities] = match;
        groups[groupName] = activities.split(';').map(a => a.trim()).filter(Boolean);
      }
    });
    return groups;
  };

  // Parse formative assessment to extract fields
  const parseFormativeAssessment = (text) => {
    if (!text) return {};
    const result = {};
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.startsWith('Success Criteria:')) {
        result.success_criteria = line.replace('Success Criteria:', '').trim();
      } else if (line.startsWith('Accommodation:')) {
        result.accomodation = line.replace('Accommodation:', '').trim();
      } else if (line.startsWith('Extra Challenges:')) {
        result.extra_challenges = line.replace('Extra Challenges:', '').trim();
      } else if (line.startsWith('Activity Sheet:')) {
        result.activity_sheet = line.replace('Activity Sheet:', '').trim();
      }
    });
    return result;
  };

  const renderActivities = (activities) => {
    if (!activities || activities.length === 0) return null;
    return activities.map((act, idx) => {
      const learnerGroups = parseLearnerActivities(act.learner_activity);
      const assessment = parseFormativeAssessment(act.formative_assessment);

      return (
        <Box key={idx} sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="600">
            Activity {act.order_number || idx + 1} {act.time_slot ? `• ${act.time_slot}` : ''}
          </Typography>

          {/* Topic Content / Learning Statement */}
          {act.topic_content && (
            <Box sx={{ mt: 0.5, mb: 1 }}>
              <Typography variant="body2" fontWeight="500">{act.topic_content}</Typography>
            </Box>
          )}

          {/* Learner Activities by Group */}
          {Object.keys(learnerGroups).length > 0 && (
            <Box sx={{ mt: 1, pl: 1 }}>
              <Typography variant="caption" color="text.secondary">Learner Activities:</Typography>
              {Object.entries(learnerGroups).map(([group, items]) => (
                <Box key={group} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" fontWeight="500" sx={{ textTransform: 'capitalize' }}>
                    {group}:
                  </Typography>
                  <List dense sx={{ pl: 2, m: 0 }}>
                    {items.map((item, i) => (
                      <ListItem key={i} sx={{ py: 0 }}>
                        <ListItemText primary={`• ${item}`} primaryTypographyProps={{ variant: 'caption' }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))}
            </Box>
          )}

          {/* Success Criteria */}
          {assessment.success_criteria && (
            <Box sx={{ mt: 1, pl: 1 }}>
              <Typography variant="caption" color="success.main" fontWeight="500">
                ✓ Success Criteria: {assessment.success_criteria.substring(0, 80)}...
              </Typography>
            </Box>
          )}
        </Box>
      );
    });
  };

  const renderEvaluations = (evaluations) => {
    if (!evaluations || evaluations.length === 0) return null;
    const ev = evaluations[0];
    return (
      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
        <Typography variant="subtitle2" fontWeight="600" color="success.dark">
          Teacher Evaluation
        </Typography>
        {ev.worked_well && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">What worked well:</Typography>
            <Typography variant="body2">{ev.worked_well}</Typography>
          </Box>
        )}
        {ev.to_be_improved && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">To be improved:</Typography>
            <Typography variant="body2">{ev.to_be_improved}</Typography>
          </Box>
        )}
      </Box>
    );
  };

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
                  onClick={() => toggleExpand(lesson.id)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {lesson.subject_details?.name || 'Subject'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {lesson.activities?.length > 0 && (
                            <Chip
                              icon={<IconActivity size={14} />}
                              label={`${lesson.activities.length} Activities`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {lesson.evaluations?.length > 0 && (
                            <Chip
                              label="Evaluated"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          <Chip
                            label={new Date(lesson.created_at).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <IconButton size="small">
                            {expandedId === lesson.id ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                          </IconButton>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
                          Aim: {lesson.lesson_aims}
                        </Typography>
                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Unit: {lesson.unit_details?.name || 'N/A'}
                              {lesson.subunit_details?.name && ` > ${lesson.subunit_details.name}`}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              <IconClock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              {formatDuration(lesson.duration)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    }
                  />
                </ListItem>

                {/* Expanded Details */}
                <Collapse in={expandedId === lesson.id} timeout="auto">
                  <Box sx={{ pl: 2, pr: 2, pb: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 1 }}>
                    {/* Teacher Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <IconUser size={16} style={{ marginRight: 8 }} />
                      <Typography variant="caption" color="text.secondary">
                        Teacher: {lesson.created_by_details?.teacher_details?.user_details?.full_name || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Learning Objectives */}
                    {lesson.learning_objectives_details && (
                      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight="600" color="primary">
                          <IconTarget size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Learning Objective
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {lesson.learning_objectives_details.framework_code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lesson.learning_objectives_details.description}
                        </Typography>
                      </Paper>
                    )}

                    {/* Activities */}
                    {lesson.activities && lesson.activities.length > 0 && (
                      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight="600" color="primary" sx={{ mb: 1 }}>
                          Lesson Activities
                        </Typography>
                        {renderActivities(lesson.activities)}
                      </Paper>
                    )}

                    {/* Evaluations */}
                    {renderEvaluations(lesson.evaluations)}

                    {/* Materials */}
                    {lesson.activities?.[0]?.materials && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">
                          Materials Needed:
                        </Typography>
                        <Typography variant="body2">{lesson.activities[0].materials}</Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>

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
