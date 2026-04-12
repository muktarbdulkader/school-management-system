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

const MessageDetailGroups = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>{'G'}</Avatar>
          <Box>
            <Typography variant="h6" component="div">
              {'Group Chat'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {0} participants
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            From: {'Unknown'}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            {''}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {'No message content'}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            sx={{ mr: 1 }}
          >
            Reply All
          </Button>
          <Button variant="outlined" color="secondary" size="small">
            View Participants
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MessageDetailGroups;
