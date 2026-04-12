import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

const MessageDetailAll = ({ message }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {message.sender?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="h6" component="div">
              {message.sender || 'Unknown'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {message.timestamp
                ? format(new Date(message.timestamp), 'MMM d, yyyy h:mm a')
                : ''}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {message.message || 'No message content'}
        </Typography>
      </CardContent>
    </Card>
  );
};

MessageDetailAll.propTypes = {
  message: PropTypes.object.isRequired,
};

export default MessageDetailAll;
