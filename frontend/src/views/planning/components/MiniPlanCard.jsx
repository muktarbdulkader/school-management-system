import React from 'react';
import {
  Box,
  Grid,
  Typography,
  useTheme,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const MiniPlanCard = ({
  plan,
  onPress,
  onEdit,
  onDelete,
  sx,
  onGiveFeedback,
  onGiveActivities,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    event.stopPropagation(); // Prevent triggering onPress
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit && onEdit(plan);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete && onDelete(plan);
  };

  const truncate = (text, length = 50) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '…' : text;
  };

  // Check for activities and feedback in the plan data
  const hasActivities = plan?.activities?.length > 0 || plan?.lessonactivities_set?.length > 0 || plan?.has_activities;
  const hasFeedback = plan?.evaluations?.length > 0 || plan?.lessonplanevaluations_set?.length > 0 || plan?.has_feedback;

  // Determine status based on completion and date
  const getStatus = () => {
    // Use date or created_at as the plan date
    const dateValue = plan?.date || plan?.created_at;
    const planDate = dateValue ? new Date(dateValue) : null;
    const today = new Date();

    // If has both activities and feedback = Completed
    if (hasActivities && hasFeedback) {
      return { label: 'Completed', color: 'success', icon: <CheckCircleIcon />, bgColor: '#e8f5e9' };
    }

    // If has activities only = In Progress
    if (hasActivities) {
      return { label: 'In Progress', color: 'info', icon: <PlayCircleIcon />, bgColor: '#e3f2fd' };
    }

    // Date-based status for plans without activities/feedback
    if (!planDate) {
      return { label: 'Upcoming', color: 'warning', icon: <ScheduleIcon />, bgColor: '#fff3e0' };
    }

    if (planDate < today && planDate.toDateString() !== today.toDateString()) {
      return { label: 'Overdue', color: 'error', icon: <ScheduleIcon />, bgColor: '#ffebee' };
    }

    if (planDate.toDateString() === today.toDateString()) {
      return { label: 'Current', color: 'primary', icon: <PlayCircleIcon />, bgColor: '#e3f2fd' };
    }

    return { label: 'Upcoming', color: 'warning', icon: <ScheduleIcon />, bgColor: '#fff3e0' };
  };

  const status = getStatus();

  return (
    <DrogaCard
      sx={{
        ...sx,
        cursor: 'pointer',
        p: 2,
        borderRadius: 3,
        boxShadow: 2,
        position: 'relative',
        background: status.bgColor || '#fff',
        borderLeft: `4px solid ${theme.palette[status.color]?.main || theme.palette.warning.main}`,
        ':hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease',
        },
        transition: 'all 0.3s ease',
      }}
      onClick={() => onPress && onPress(plan)}
    >
      {/* Header with Menu */}
      <Box
        sx={{
          mb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: theme.palette.primary.main }}
          >
            {plan?.unit_details?.category_details?.name || 'Untitled Unit'}
          </Typography>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            sx={{ mt: 0.3 }}
          >
            {plan?.subunit_details?.name || 'Subunit'}
          </Typography>
        </Box>
        {(onEdit || onDelete) && (
          <>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && <MenuItem onClick={handleEdit}>Edit</MenuItem>}
              {onDelete && <MenuItem onClick={handleDelete}>Delete</MenuItem>}
            </Menu>
          </>
        )}
      </Box>

      {/* Class & Date */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item>
          <Chip
            label={`Class: ${plan?.learner_group_details?.grade || 'N/A'}`}
            color="primary"
            size="small"
          />
        </Grid>
        <Grid item>
          <Chip
            label={
              plan?.created_at
                ? format(new Date(plan.created_at), 'MMM dd, yyyy')
                : (plan?.date ? format(new Date(plan.date), 'MMM dd, yyyy') : 'No Date')
            }
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item>
          <Chip
            icon={status.icon}
            label={status.label}
            color={status.color}
            size="small"
            variant="filled"
          />
        </Grid>
      </Grid>

      {/* Description */}
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{
          mt: 1,
          lineHeight: 1.4,
          minHeight: 48,
        }}
      >
        {truncate(plan?.learning_objectives, 80)}
      </Typography>

      {/* Block & Week Info */}
      <Box sx={{ mt: 1, mb: 1 }}>
        <Grid container spacing={1}>
          {plan?.block && (
            <Grid item>
              <Chip
                label={`Block: ${plan.block}`}
                size="small"
                variant="outlined"
                color="info"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
          )}
          {plan?.week && (
            <Grid item>
              <Chip
                label={`Week: ${plan.week}`}
                size="small"
                variant="outlined"
                color="info"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
          )}
        </Grid>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      {/* Actions Section */}
      <Box
        sx={{
          mt: 2,
          textAlign: 'right',
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
        }}
      >
        {onGiveFeedback && (
          <Chip
            label={plan?.has_feedback ? 'Feedback Added ✓' : 'Add Feedback'}
            color={plan?.has_feedback ? 'success' : 'primary'}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onGiveFeedback(plan);
            }}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 500,
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              },
            }}
          />
        )}

        {onGiveActivities && (
          <Chip
            label={plan?.has_activities ? 'Activities Added ✓' : 'Add Activities'}
            color={plan?.has_activities ? 'success' : 'primary'}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onGiveActivities(plan);
            }}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 500,
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              },
            }}
          />
        )}
      </Box>
    </DrogaCard>
  );
};

MiniPlanCard.propTypes = {
  plan: PropTypes.object.isRequired,
  onPress: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  sx: PropTypes.object,
};

export default MiniPlanCard;
