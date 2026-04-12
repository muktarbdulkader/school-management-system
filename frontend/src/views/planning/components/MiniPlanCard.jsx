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

  return (
    <DrogaCard
      sx={{
        ...sx,
        cursor: 'pointer',
        p: 2,
        borderRadius: 3,
        boxShadow: 2,
        position: 'relative',
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
              plan?.date ? format(new Date(plan.date), 'MMM dd, yyyy') : 'N/A'
            }
            variant="outlined"
            size="small"
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
            label="Add Feedback"
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering onPress
              onGiveFeedback(plan);
            }}
          />
        )}

        {onGiveActivities && (
          <Chip
            label="Add Activities"
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering onPress
              onGiveActivities(plan);
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
