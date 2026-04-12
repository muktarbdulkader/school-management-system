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

  const evaluationExists =
    Boolean(plan?.section_details) ||
    Boolean(plan?.worked_well) ||
    Boolean(plan?.to_be_improved);

  const activityExists =
    Boolean(plan?.learning_statement) ||
    Boolean(plan?.activity_sheet) ||
    Boolean(plan?.topic_content) ||
    Boolean(plan?.learner_activities) ||
    Boolean(plan?.success_criteria) ||
    Boolean(plan?.extra_challenges) ||
    Boolean(plan?.accomodation) ||
    Boolean(plan?.formative_assessment) ||
    Boolean(plan?.materials);

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
              <PersonIcon fontSize="small" />
              <Typography variant="caption">
                Teacher:{' '}
                {plan?.created_by_details?.teacher_details?.user_details
                  ?.full_name || 'N/A'}
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

              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-line', color: 'text.primary', mb: 2 }}
              >
                {plan?.learning_objectives
                  ? !expanded.objectives &&
                    plan.learning_objectives.length > 200
                    ? previewText(plan.learning_objectives)
                    : plan.learning_objectives
                  : 'No description available.'}
              </Typography>

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
                      plan?.created_by_details?.section_details?.name ||
                      'N/A'}
                  </Typography>
                  {plan?.section_details?.room_number && (
                    <Typography variant="caption" color="text.secondary">
                      Room {plan.section_details.room_number}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Worked well (expandable) */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  What worked well
                </Typography>
                {plan?.worked_well && plan.worked_well.length > 120 && (
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

              {plan?.worked_well ? (
                <Box sx={{ mb: 1.5, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {!expanded.worked && plan.worked_well.length > 120
                      ? previewText(plan.worked_well, 120)
                      : plan.worked_well}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mb: 1.5, opacity: 0.7 }}>
                  <Typography variant="body2">—</Typography>
                </Box>
              )}

              <Collapse in={expanded.worked} timeout="auto" unmountOnExit>
                {/* full text already shown when expanded */}
              </Collapse>

              {/* To be improved */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  To be improved
                </Typography>
                {plan?.to_be_improved && plan.to_be_improved.length > 120 && (
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

              {plan?.to_be_improved ? (
                <Box sx={{ mb: 1.5, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {!expanded.improved && plan.to_be_improved.length > 120
                      ? previewText(plan.to_be_improved, 120)
                      : plan.to_be_improved}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mb: 1.5, opacity: 0.7 }}>
                  <Typography variant="body2">—</Typography>
                </Box>
              )}

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

              {/* Activity details (grouped and expandable) */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <ArticleIcon />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Learning statement
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {!plan?.learning_statement
                        ? '—'
                        : plan.learning_statement.length > 180 &&
                            !expanded.activityDetails
                          ? previewText(plan.learning_statement, 180)
                          : plan.learning_statement}
                    </Typography>
                  </Box>
                </Box>

                {plan?.learning_statement &&
                  plan.learning_statement.length > 180 && (
                    <IconButton
                      onClick={() => toggle('activityDetails')}
                      aria-expanded={expanded.activityDetails}
                      size="small"
                      sx={{
                        transform: expanded.activityDetails
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
                in={expanded.activityDetails}
                timeout="auto"
                unmountOnExit
              >
                {/* Topic */}
                {plan?.topic_content && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <LightbulbIcon />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Topic
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {plan.topic_content}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Activity sheet */}
                {plan?.activity_sheet && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <ArticleIcon />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Activity sheet
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {plan.activity_sheet}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Collapse>

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
                {plan?.learner_activities && (
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
                <Box sx={{ mt: 1 }}>
                  {renderLearnerActivities(plan.learner_activities)}
                </Box>
              </Collapse>

              {/* Activity success criteria */}
              {plan?.success_criteria && (
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
                        Activity Success Criteria
                      </Typography>
                    </Stack>
                    {plan.success_criteria.length > 120 && (
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
                    <List dense>
                      {renderSuccessCriteria(plan.success_criteria)}
                    </List>
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
                  {plan?.extra_challenges &&
                    plan.extra_challenges.length > 60 && (
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
                  {plan?.extra_challenges && (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {plan.extra_challenges}
                    </Typography>
                  )}
                  {plan?.accomodation && (
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
                          {plan.accomodation}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {plan?.formative_assessment && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <QuizIcon />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Formative assessment
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-line' }}
                        >
                          {plan.formative_assessment}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {plan?.materials && (
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
                          {plan.materials}
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
