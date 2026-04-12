import {
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const MessageAll = ({ fetchMessages, onMessageSelect, selectedMessageId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const getMessages = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationChats}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch triage rooms');
      }

      if (responseData.success) {
        setMessages(responseData.data);
        console.log('Updated messages:', responseData.data);
        setPagination({
          ...pagination,
          last_page: responseData.last_page || 1,
          total: responseData.total || responseData.data.length,
        });
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Messages updated:', messages);
  }, [messages]);

  useEffect(() => {
    getMessages();
  }, [fetchMessages]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box p={4}>
        <Typography color="error">Error loading messages</Typography>
      </Box>
    );
  if (!messages.length)
    return (
      <Box p={4}>
        <Typography>No messages available</Typography>
      </Box>
    );

  return (
    <Box sx={{ p: 2, maxWidth: '100%', mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg) => (
          <Card
            key={msg.id}
            sx={{
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
              cursor: 'pointer',
              backgroundColor:
                selectedMessageId === msg.id
                  ? 'action.selected'
                  : 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            onClick={() => onMessageSelect(msg)}
          >
            <CardContent sx={{ p: '16px !important' }}>
              <ListItem sx={{ p: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {msg.sender?.charAt(0) || 'A'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mr: 1 }}
                      >
                        {msg.sender || 'Unknown'}
                      </Typography>
                      <Typography variant="caption">
                        {msg.timestamp
                          ? format(new Date(msg.timestamp), 'h:mm a')
                          : ''}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.message || 'No message content'}
                    </Typography>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

MessageAll.propTypes = {
  fetchMessages: PropTypes.func.isRequired,
  onMessageSelect: PropTypes.func.isRequired,
  selectedMessageId: PropTypes.string,
};
export default MessageAll;
