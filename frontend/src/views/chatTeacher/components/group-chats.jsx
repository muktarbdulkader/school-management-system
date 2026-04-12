import {
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PropTypes from 'prop-types';
import { Box } from '@mui/system';
import React from 'react';

const GroupChats = ({
  name,
  message,
  timestamp,
  is_read,
  onClick,
  isSelected,
}) => {
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleClick = () => {
    console.log('Group clicked:', { name, isSelected }); // Debug log
    onClick?.(); // Safe call
  };
  return (
    <ListItem
      button
      onClick={handleClick}
      sx={{
        py: 1.5,
        px: 2,
        '&:hover': {
          bgcolor: 'action.hover',
        },
        bgcolor: isSelected ? 'action.selected' : 'inherit',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <ListItemAvatar>
        <Avatar alt={name} sx={{ width: 40, height: 40 }} />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium">
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formattedTime}
            </Typography>
          </Box>
        }
        // secondary={
        //   <>
        //     <Typography
        //       sx={{ display: 'block' }}
        //       component="span"
        //       variant="body2"
        //       color="text.secondary"
        //       noWrap
        //     >
        //       {message}
        //     </Typography>
        //   </>
        // }
        sx={{ ml: 1 }}
      />
      {!is_read && (
        <FiberManualRecordIcon
          sx={{ fontSize: 10, color: 'primary.main', ml: 1 }}
        />
      )}
    </ListItem>
  );
};

GroupChats.propTypes = {
  name: PropTypes.string.isRequired,
  message: PropTypes.string,
  timestamp: PropTypes.string,
  is_read: PropTypes.bool,
  onClick: PropTypes.func,
  isSelected: PropTypes.bool,
};

export default GroupChats;
