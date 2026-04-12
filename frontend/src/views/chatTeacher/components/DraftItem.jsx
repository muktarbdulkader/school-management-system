import React from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
} from '@mui/material';

export function DraftItem({ receiverName, message, timestamp, onClick }) {
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ListItem
      button
      onClick={onClick}
      sx={{
        py: 1.5,
        px: 2,
        '&:hover': {
          bgcolor: 'primary.light',
          '& .MuiTypography-root': {
            color: 'text.primary',
          },
        },
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.2s ease',
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ width: 40, height: 40 }} />
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
              {receiverName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formattedTime}
            </Typography>
          </Box>
        }
        secondary={
          <Typography
            sx={{ display: 'block' }}
            component="span"
            variant="body2"
            color="text.secondary"
            noWrap
          >
            {message}
          </Typography>
        }
        sx={{ ml: 1 }}
      />
    </ListItem>
  );
}
