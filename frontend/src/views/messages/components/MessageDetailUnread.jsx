import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

const MessageDetailUnread = () => {
  return (
    <Card sx={{ height: '100%', bgcolor: 'action.hover' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>{'U'}</Avatar>
          <Box>
            <Typography variant="h6" component="div">
              {'Unknown'}
              <Box component="span" sx={{ ml: 1, color: 'warning.main' }}>
                • Unread
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {''}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography
          variant="body1"
          sx={{ whiteSpace: 'pre-line', fontWeight: 500 }}
        >
          {'No message content'}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary" size="small">
            Mark as Read
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MessageDetailUnread;
