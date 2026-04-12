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

const MessageDetailStarted = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>{'R'}</Avatar>
          <Box>
            <Typography variant="h6" component="div">
              To: {'Recipient'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {''}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {'No message content'}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Status: {'Sent'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

MessageDetailStarted.propTypes = {
  message: PropTypes.object.isRequired,
};

export default MessageDetailStarted;
