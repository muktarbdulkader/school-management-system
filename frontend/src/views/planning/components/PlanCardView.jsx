import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Modal,
  useTheme,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Paper,
  Stack,
  IconButton,
  Collapse,
} from '@mui/material';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ClassIcon from '@mui/icons-material/Class';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArticleIcon from '@mui/icons-material/Article';
import GroupsIcon from '@mui/icons-material/Groups';
import QuizIcon from '@mui/icons-material/Quiz';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const PlanCard = ({ open, onClose, plan, onUpdated, onEdit, onDelete }) => {
  const theme = useTheme();
  const [loading] = useState(false);

  // expand state for sections
  const [expanded, setExpanded] = useState({
    aims: false,
    objectives: false,
    worked: false,
    improved: false,
    learner: false,
    activityDetails: false,
    activitySuccess: false,
    extra: false,
  });

  const toggle = (key) => setExpanded((s) => ({ ...s, [key]: !s[key] }));

  if (!plan) return null;

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return 'N/A';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs ? hrs + 'h ' : ''}${mins}min`;
  };

  const renderSuccessCriteria = (criteria) => {
    if (!criteria) return null;
    return criteria
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line, index) => (
        <ListItem key={index} sx={{ pl: 0 }}>
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ display: 'flex', gap: 1 }}>
                <Box
                  component="span"
                  sx={{ color: theme.palette.primary.main }}
                >
                  •
                </Box>
                <Box component="span">{line}</Box>
              </Typography>
            }
          />
        </ListItem>
      ));
  };

  const previewText = (text, len = 200) => {
    if (!text) return '';
    return text.length > len ? text.slice(0, len).trim() + '…' : text;
  };

  const renderLearnerActivities = (la) => {
    if (!la) return null;
    if (typeof la === 'object' && !Array.isArray(la)) {
      return Object.entries(la).map(([groupName, items]) => (
        <Box key={groupName} sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {groupName}
          </Typography>
          <List dense sx={{ mb: 1 }}>
            {(items || []).map((it, idx) => (
              <ListItem key={idx} sx={{ pl: 0 }}>
                <ListItemText primary={`• ${it}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      ));
    }
    if (Array.isArray(la)) {
      return (
        <List dense>
          {la.map((it, idx) => (
            <ListItem key={idx} sx={{ pl: 0 }}>
              <ListItemText primary={`• ${it}`} />
            </ListItem>
          ))}
        </List>
      );
    }
    return <Typography variant="body2">{String(la)}</Typography>;
  };

  if (loading) {
    return (
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 120,
            height: 120,
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            boxShadow: 24,
            p: 2,
          }}
        >
          <CircularProgress size={36} />
        </Box>
      </Modal>
    );
  }

  // Get first activity data if available
  const activity = plan?.activities?.[0];

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

  // Parse lesson plan evaluation to extract worked well and to be improved
  const parseLessonPlanEvaluation = (evaluationText) => {
    if (!evaluationText) return { worked_well: '', to_be_improved: '' };

    const result = { worked_well: '', to_be_improved: '' };

    // Split by "What Worked Well:" and "To Be Improved:"
    const workedWellMatch = evaluationText.match(/What Worked Well:\s*([\s\S]*?)(?=To Be Improved:|$)/i);
    const toBeImprovedMatch = evaluationText.match(/To Be Improved:\s*([\s\S]*?)$/i);

    if (workedWellMatch) {
      result.worked_well = workedWellMatch[1].trim();
    }
    if (toBeImprovedMatch) {
      result.to_be_improved = toBeImprovedMatch[1].trim();
    }

    // Fallback: if no patterns matched but text exists, use as worked_well
    if (!result.worked_well && !result.to_be_improved && evaluationText.trim()) {
      result.worked_well = evaluationText.trim();
    }

    return result;
  };

  const learnerActivities = parseLearnerActivities(activity?.learner_activity);
  const assessmentParts = parseFormativeAssessment(activity?.formative_assessment);

  // Get evaluation data from evaluations array
  const evaluation = plan?.evaluations?.[0] || plan?._evaluation;

  // Parse lesson_plan_evaluation if available
  const evaluationText = evaluation?.lesson_plan_evaluation || plan?.lesson_plan_evaluation;
  const parsedEvaluation = parseLessonPlanEvaluation(evaluationText);

  const workedWell = plan?.worked_well || evaluation?.worked_well || parsedEvaluation.worked_well;
  const toBeImproved = plan?.to_be_improved || evaluation?.to_be_improved || parsedEvaluation.to_be_improved;

  const evaluationExists =
    Boolean(plan?.section_details) ||
    Boolean(workedWell) ||
    Boolean(toBeImproved) ||
    Boolean(plan?.evaluations?.length > 0);

  const activityExists =
    Boolean(activity) ||
    Boolean(plan?.activities?.length > 0);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: 980 },
          bgcolor: 'background.paper',
          boxShadow: 28,
          borderRadius: 3,
          p: { xs: 3, sm: 4 },
          maxHeight: '92vh',
          overflowY: 'auto',
          outline: 'none',
        }}
      >
        {/* Top */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight={800}
              color={theme.palette.primary.main}
            >
              {plan?.unit_details?.category_details?.name || 'Untitled Unit'}
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {plan?.subunit_details?.name || 'Subunit'}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={plan?.learner_group_details?.grade || 'N/A'}
              color="primary"
              size="small"
              icon={<ClassIcon />}
            />
            <Chip
              label={
                plan?.date ? format(new Date(plan.date), 'MMM dd, yyyy') : 'N/A'
              }
              variant="outlined"
              size="small"
              icon={<EventIcon />}
            />
            <IconButton size="small" onClick={() => onEdit(plan)} title="Edit">
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={onDelete}
              title="Delete"
            >
              <DeleteIcon />
            </IconButton>
            <IconButton size="small" onClick={onClose} title="Close">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <Divider sx={{ mt: 2, mb: 3 }} />

        {/* meta */}
        <Grid container spacing={1} sx={{ mb: 3 }}>
          <Grid item>
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <AccessTimeIcon fontSize="small" />
              <Typography variant="caption">
                Duration: {formatDuration(plan?.duration)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item>
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="caption">
                Term: {plan?.term_details?.name || 'N/A'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item>
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="caption">
                Block: {plan?.block || 'N/A'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item>
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="caption">
                Week: {plan?.week || 'N/A'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item>
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <PersonIcon fontSize="small" />
              <Typography variant="caption">
                Teacher:{' '}
                {plan?.created_by_details?.teacher_details?.user_details
                  ?.full_name || 'N/A'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs />
        </Grid>

        {/* content */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              {/* Lesson Aims (expandable) */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Lesson Aims
                </Typography>
                {plan?.lesson_aims && plan.lesson_aims.length > 200 && (
                  <IconButton
                    onClick={() => toggle('aims')}
                    aria-expanded={expanded.aims}
                    size="small"
                    sx={{
                      transform: expanded.aims
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                      transition: 'transform 200ms',
                    }}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                )}
              </Box>

              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-line', color: 'text.primary', mb: 2 }}
              >
                {plan.lesson_aims ? (
                  <>
                    {!expanded.aims && plan.lesson_aims.length > 200
                      ? previewText(plan.lesson_aims)
                      : plan.lesson_aims}
                  </>
                ) : (
                  '—'
                )}
              </Typography>

              <Collapse in={expanded.aims} timeout="auto" unmountOnExit>
                {/* nothing extra — full text already shown above when expanded */}
              </Collapse>

              <Divider sx={{ mb: 2 }} />

              {/* Learning Objectives */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Learning Objectives
                </Typography>
                {plan?.learning_objectives &&
                  plan.learning_objectives.length > 200 && (
                    <IconButton
                      onClick={() => toggle('objectives')}
                      aria-expanded={expanded.objectives}
                      size="small"
                      sx={{
                        transform: expanded.objectives
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                        transition: 'transform 200ms',
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  )}
              </Box>

              {/* Learning Objectives Content */}
              {(plan?.learning_objectives || plan?.learning_objectives_details?.description) ? (
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'info.lighter',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'info.light',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}
                  >
                    {!expanded.objectives &&
                      (plan.learning_objectives || plan?.learning_objectives_details?.description || '').length > 200
                      ? previewText(plan.learning_objectives || plan?.learning_objectives_details?.description)
                      : (plan.learning_objectives || plan?.learning_objectives_details?.description)}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1.5,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    mb: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No learning objectives available for this lesson plan.
                  </Typography>
                </Box>
              )}

              <Collapse in={expanded.objectives} timeout="auto" unmountOnExit>
                {/* full text already shown when expanded */}
              </Collapse>

              {plan?.learning_objectives_details?.success_criteria && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ mb: 1 }}
                  >
                    Success Criteria
                  </Typography>
                  <List dense>
                    {renderSuccessCriteria(
                      plan.learning_objectives_details.success_criteria,
                    )}
                  </List>
                </>
              )}

              {plan?.learning_objectives_details?.framework_code && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Framework Code
                  </Typography>
                  <Typography variant="body2">
                    {plan.learning_objectives_details.framework_code}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            {/* Evaluation */}
            <Paper
              elevation={3}
              sx={{
                p: 2,
                borderRadius: 2,
                mb: 2,
                background: evaluationExists
                  ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
                  : 'transparent',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant="subtitle1" fontWeight={800}>
                  Evaluation
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {evaluationExists ? (
                    <Chip
                      label="Has Evaluation"
                      color="success"
                      size="small"
                      icon={<CheckCircleOutlineIcon />}
                    />
                  ) : (
                    <Chip label="No Evaluation" size="small" />
                  )}
                  {activityExists ? (
                    <Chip
                      label="Has Activity"
                      color="primary"
                      size="small"
                      icon={<MenuBookIcon />}
                    />
                  ) : null}
                </Stack>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}
              >
                <PersonIcon fontSize="small" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Section
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {plan?.section_details?.name ||
                      plan?.evaluations?.[0]?.section_details?.name ||
                      plan?._evaluation?.section_details?.name ||
                      'N/A'}
                  </Typography>
                  {(plan?.section_details?.room_number || plan?.evaluations?.[0]?.section_details?.room_number) && (
                    <Typography variant="caption" color="text.secondary">
                      Room {plan?.section_details?.room_number || plan?.evaluations?.[0]?.section_details?.room_number}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Worked well section */}
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: workedWell ? 'success.lighter' : 'grey.50',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: workedWell ? 'success.light' : 'grey.200',
                  mb: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': workedWell ? {
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)',
                  } : {},
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: workedWell ? 1 : 0,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      color: workedWell ? 'success.dark' : 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    ✓ What Worked Well
                  </Typography>
                  {workedWell && workedWell.length > 120 && (
                    <IconButton
                      onClick={() => toggle('worked')}
                      aria-expanded={expanded.worked}
                      size="small"
                      sx={{
                        transform: expanded.worked
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                        transition: 'transform 200ms',
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  )}
                </Box>

                {workedWell ? (
                  <Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>
                      {!expanded.worked && workedWell.length > 120
                        ? previewText(workedWell, 120)
                        : workedWell}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No feedback provided yet
                  </Typography>
                )}

                <Collapse in={expanded.worked} timeout="auto" unmountOnExit>
                  {/* full text already shown when expanded */}
                </Collapse>
              </Box>

              {/* To be improved section */}
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: toBeImproved ? 'warning.lighter' : 'grey.50',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: toBeImproved ? 'warning.light' : 'grey.200',
                  mb: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': toBeImproved ? {
                    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.15)',
                  } : {},
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: toBeImproved ? 1 : 0,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      color: toBeImproved ? 'warning.dark' : 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    ⚡ Areas for Improvement
                  </Typography>
                  {toBeImproved && toBeImproved.length > 120 && (
                    <IconButton
                      onClick={() => toggle('improved')}
                      aria-expanded={expanded.improved}
                      size="small"
                      sx={{
                        transform: expanded.improved
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                        transition: 'transform 200ms',
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  )}
                </Box>

                {toBeImproved ? (
                  <Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>
                      {!expanded.improved && toBeImproved.length > 120
                        ? previewText(toBeImproved, 120)
                        : toBeImproved}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No improvement areas specified
                  </Typography>
                )}

                <Collapse in={expanded.improved} timeout="auto" unmountOnExit>
                  {/* full text already shown when expanded */}
                </Collapse>
              </Box>

              <Divider sx={{ my: 2 }} />
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="caption" color="text.secondary">
                  Evaluation ID: {plan?.evaluation_id || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Updated:{' '}
                  {plan?.updated_at
                    ? format(new Date(plan.updated_at), 'MMM dd, yyyy')
                    : '—'}
                </Typography>
              </Stack>
            </Paper>

            {/* Activity */}
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant="subtitle1" fontWeight={800}>
                  Activity
                </Typography>
                {activityExists ? (
                  <Chip
                    label="Has Activity"
                    color="primary"
                    size="small"
                    icon={<MenuBookIcon />}
                  />
                ) : (
                  <Chip label="No Activity" size="small" />
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Activity details from backend activity data */}
              {activity ? (
                <>
                  {/* Learning Statement / Topic Content */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <ArticleIcon />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Learning Statement
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {activity?.topic_content || '—'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Activity Sheet */}
                  {assessmentParts.activity_sheet && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <ArticleIcon />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Activity Sheet
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {assessmentParts.activity_sheet}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No activity details available
                </Typography>
              )}

              {/* Learner activities (expandable) */}
              <Divider sx={{ my: 1 }} />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <GroupsIcon />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Learner Activities
                  </Typography>
                </Stack>
                {Object.keys(learnerActivities).length > 0 && (
                  <IconButton
                    onClick={() => toggle('learner')}
                    aria-expanded={expanded.learner}
                    size="small"
                    sx={{
                      transform: expanded.learner
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                      transition: 'transform 200ms',
                    }}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                )}
              </Box>

              <Collapse in={expanded.learner} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2 }}>
                  {Object.keys(learnerActivities).length > 0 ? (
                    <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 1.5, border: '1px solid', borderColor: 'primary.light' }}>
                      {renderLearnerActivities(learnerActivities)}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                      No learner activities specified
                    </Typography>
                  )}
                </Box>
              </Collapse>

              {/* Activity success criteria */}
              {assessmentParts.success_criteria && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <QuizIcon />
                      <Typography variant="subtitle2" fontWeight={700}>
                        Success Criteria
                      </Typography>
                    </Stack>
                    {assessmentParts.success_criteria.length > 120 && (
                      <IconButton
                        onClick={() => toggle('activitySuccess')}
                        aria-expanded={expanded.activitySuccess}
                        size="small"
                        sx={{
                          transform: expanded.activitySuccess
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 200ms',
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Collapse
                    in={expanded.activitySuccess}
                    timeout="auto"
                    unmountOnExit
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
                      {assessmentParts.success_criteria}
                    </Typography>
                  </Collapse>
                </>
              )}

              <Divider sx={{ my: 1 }} />

              {/* extras */}
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LightbulbIcon />
                    <Typography variant="caption" color="text.secondary">
                      Extra challenges
                    </Typography>
                  </Stack>
                  {(assessmentParts.extra_challenges || activity?.extra_challenges || plan?.extra_challenges) &&
                    (assessmentParts.extra_challenges?.length > 60 || activity?.extra_challenges?.length > 60 || plan?.extra_challenges?.length > 60) && (
                      <IconButton
                        onClick={() => toggle('extra')}
                        aria-expanded={expanded.extra}
                        size="small"
                        sx={{
                          transform: expanded.extra
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 200ms',
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    )}
                </Box>

                <Collapse in={expanded.extra} timeout="auto" unmountOnExit>
                  {/* Extra Challenges Content */}
                  {(assessmentParts.extra_challenges || activity?.extra_challenges || plan?.extra_challenges) ? (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1.5, border: '1px solid', borderColor: 'warning.light' }}>
                      <Typography variant="subtitle2" fontWeight={600} color="warning.dark" gutterBottom>
                        Challenge Activities
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>
                        {assessmentParts.extra_challenges || activity?.extra_challenges || plan?.extra_challenges}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                      No extra challenges specified
                    </Typography>
                  )}

                  {/* Accommodation */}
                  {assessmentParts.accomodation && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <AccessibilityNewIcon />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Accommodation
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-line' }}
                        >
                          {assessmentParts.accomodation}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {activity?.formative_assessment && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <QuizIcon />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Formative Assessment
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-line' }}
                        >
                          {activity.formative_assessment}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {activity?.materials && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Inventory2Icon />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Materials
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-line' }}
                        >
                          {activity.materials}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Collapse>
              </Box>

              {/* small activity meta */}
              <Divider sx={{ my: 2 }} />
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="caption" color="text.secondary">
                  Activity ID: {plan?.activity_id || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Updated:{' '}
                  {plan?.updated_at
                    ? format(new Date(plan.updated_at), 'MMM dd, yyyy')
                    : '—'}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* footer */}
        <Box
          sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => onEdit(plan)}
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onDelete}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
          <Button variant="text" onClick={onClose} startIcon={<CloseIcon />}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

PlanCard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  plan: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onUpdated: PropTypes.func,
};

export default PlanCard;
