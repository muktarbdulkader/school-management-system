import React, { useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Avatar,
  TextField,
  Chip,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/Error';
import { useState, useEffect } from 'react';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import { useSelector } from 'react-redux';

export function GroupChatArea({ group, onMessageSend, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const messagesContainerRef = useRef(null);
  const longPressTimeout = useRef(null);

  const currentUser = useSelector((state) => state.user.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (group) {
      fetchGroupMessages(group.id);
    }
  }, [group]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleLongPressStart = (e, message) => {
    if (isMobile && message.sender_id === currentUser.id) {
      longPressTimeout.current = setTimeout(() => {
        setContextMenu({
          mouseX: e.touches[0].clientX,
          mouseY: e.touches[0].clientY,
          message,
        });
      }, 600); // 600ms long press
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.groupChatsMessageConversation}${groupId}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch messages');
      }

      if (responseData.success) {
        // Add status: 'sent' to all fetched messages
        const messagesWithStatus = responseData.data.map((msg) => ({
          ...msg,
          status: 'sent',
          isUser: msg.sender_id === currentUser?.id,
        }));
        setMessages(messagesWithStatus.reverse());
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageAddition = async () => {
    if (editingMessage) {
      handleEditMessageSubmit();
      return;
    }

    if ((!newMessage.trim() && !file) || !group) return;

    const tempMessage = {
      id: Date.now(), // temporary ID
      sender_id: currentUser.id,
      senderName: currentUser.full_name,
      avatar: currentUser.avatar,
      message: newMessage,
      attachment: file ? URL.createObjectURL(file) : null,
      timestamp: new Date().toISOString(),
      status: 'sending', // status flag
    };

    // Add optimistic message
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setFileName('');
    setFile(null);
    setIsUploading(true);

    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.groupChatsMessage}`;

      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('message', newMessage);
      formData.append('sender', currentUser.id);
      formData.append('group', group.id);

      if (file) {
        formData.append('attachment', file);
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || 'Failed to send message');
      }

      // Replace temp message with the real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? {
                ...responseData.data,
                status: 'sent',
              }
            : msg,
        ),
      );

      if (onMessageSend) {
        onMessageSend();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message);

      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, status: 'failed' } : msg,
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !newMessage.trim() || !group) return;

    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.groupChatsMessage}${editingMessage.id}/`;

      const response = await fetch(Api, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          group: group.id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to edit message');
      }

      if (responseData.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editingMessage.id
              ? { ...msg, message: newMessage, edited: true }
              : msg,
          ),
        );
        setEditingMessage(null);
        setNewMessage('');
        toast.success('Message updated');
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error(error.message);
    }
  };

  const handleEditMessageSubmit = () => {
    handleEditMessage();
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.groupChatsMessage}${messageId}/`;

      const response = await fetch(Api, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to delete message');
      }

      if (responseData.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        toast.success('Message deleted');
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(error.message);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (event, message) => {
    event.preventDefault();
    if (message.sender_id === currentUser.id) {
      setContextMenu({
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
        message,
      });
    }
  };

  const handleStartEditing = (message) => {
    setEditingMessage(message);
    setNewMessage(message.message);
    setContextMenu(null);
  };

  const handleCancelEditing = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 150 * 1024 * 1024) {
        toast.error('File size exceeds 150MB limit');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMessageAddition();
    }
  };

  const renderStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <ScheduleIcon fontSize="small" />;
      case 'sent':
        return <DoneIcon fontSize="small" />;
      case 'delivered':
        return <DoneAllIcon fontSize="small" />;
      case 'read':
        return <DoneAllIcon fontSize="small" color="primary" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  if (!group) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a group to start chatting
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        height: '80vh',
      }}
    >
      {/* Header with back button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <IconButton
          onClick={onBack}
          size="large"
          sx={{
            mr: 1,
            display: { xs: 'inline-flex', md: 'none' },
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>

        <Avatar
          alt={group.name}
          src={group.avatarUrl || ''}
          sx={{ width: 40, height: 40, mr: 2 }}
        />

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" noWrap>
            {group.name}
          </Typography>
          {group.memberCount !== undefined && (
            <Typography variant="body2" color="text.secondary">
              {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', color: 'error.main', pt: 4 }}>
            <Typography>Failed to load messages</Typography>
            <Button
              variant="outlined"
              onClick={() => fetchGroupMessages(group.id)}
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          </Box>
        ) : messages.length > 0 ? (
          <Box
            ref={messagesContainerRef}
            sx={{
              height: '55vh',
              overflowY: 'auto',
              p: 2,
            }}
          >
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === currentUser.id;

              return (
                <Box
                  key={message.id || index}
                  sx={{
                    display: 'flex',
                    justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                    mb: 3,
                  }}
                  onContextMenu={(e) => handleContextMenu(e, message)}
                  onTouchStart={(e) => handleLongPressStart(e, message)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchMove={handleLongPressEnd}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      maxWidth: '75%',
                    }}
                  >
                    <Avatar
                      alt={message.senderName || message.sender}
                      src={message.avatar}
                      sx={{ width: 32, height: 32, mx: 1 }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight="medium"
                        sx={{
                          mb: 0.5,
                        }}
                      >
                        {isCurrentUser
                          ? 'You'
                          : message.sender || message.sender_id}
                      </Typography>

                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: message.isUser ? '#F0F9FF' : 'grey.100',
                          color: message.isUser ? '#000' : 'text.primary',
                          position: 'relative',
                        }}
                      >
                        {message.message && (
                          <Typography
                            sx={{
                              mb: message.attachment ? 1 : 0,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              overflowWrap: 'break-word',
                            }}
                          >
                            {message.message}
                          </Typography>
                        )}

                        {/* Status indicators for user's messages */}
                        {isCurrentUser && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mt: 0.5,
                            }}
                          >
                            {message.status === 'sending' && (
                              <CircularProgress size={14} sx={{ mr: 1 }} />
                            )}
                            {message.status === 'failed' && (
                              <Typography variant="caption" color="error">
                                Failed to send
                              </Typography>
                            )}
                          </Box>
                        )}

                        {message.attachment && (
                          <Box sx={{ mt: 1 }}>
                            {message.attachment.match(
                              /\.(jpeg|jpg|gif|png)$/,
                            ) ? (
                              <Box sx={{ maxWidth: 300 }}>
                                <a
                                  href={message.attachment}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={message.attachment}
                                    alt="Attachment"
                                    style={{
                                      maxWidth: '100%',
                                      height: 'auto',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      border: '1px solid #ddd',
                                    }}
                                  />
                                </a>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    mt: 0.5,
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={() =>
                                      window.open(message.attachment, '_blank')
                                    }
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    View Full Size
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="text"
                                    component="a"
                                    href={message.attachment}
                                    download
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    Download
                                  </Button>
                                </Box>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <InsertDriveFileIcon color="primary" />
                                <Typography variant="body2">
                                  {message.attachment.split('/').pop()}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="contained"
                                  component="a"
                                  href={message.attachment}
                                  download
                                  sx={{ ml: 1 }}
                                >
                                  Download
                                </Button>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isCurrentUser
                            ? 'flex-end'
                            : 'flex-start',
                          mt: 0.5,
                        }}
                      >
                        {message.edited && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mr: 0.5 }}
                          >
                            (edited)
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Typography
            sx={{ textAlign: 'center', color: 'text.secondary', pt: 4 }}
          >
            No messages in this group
          </Typography>
        )}
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 2,
          position: 'sticky',
          bottom: 0,
          backdropFilter: 'blur(8px)',
          gap: 1,
        }}
      >
        {editingMessage && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'primary.light',
              borderRadius: 1,
              p: 1,
              mb: 1,
            }}
          >
            <Typography variant="body2">Editing message</Typography>
            <IconButton size="small" onClick={handleCancelEditing}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {fileName && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'action.hover',
              borderRadius: 1,
              p: 1,
              animation: 'fadeIn 0.3s ease',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <InsertDriveFileIcon
              fontSize="small"
              color="primary"
              sx={{ mr: 1 }}
            />
            <Typography
              variant="body2"
              sx={{
                flexGrow: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fileName}
            </Typography>
            <IconButton
              size="small"
              onClick={handleRemoveFile}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'error.main',
                  bgcolor: 'rgba(244, 67, 54, 0.08)',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              editingMessage
                ? 'Edit your message...'
                : 'Type your message here...'
            }
            multiline
            maxRows={4}
            fullWidth
            size="small"
            disabled={isUploading}
          />

          <input
            accept="*"
            id="upload-file"
            type="file"
            hidden
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Tooltip title="Attach a file">
            <label htmlFor="upload-file">
              <IconButton component="span" size="large" disabled={isUploading}>
                <AttachFileIcon />
              </IconButton>
            </label>
          </Tooltip>

          <Tooltip title={editingMessage ? 'Save changes' : 'Send'}>
            <span>
              <IconButton
                color="primary"
                onClick={handleMessageAddition}
                disabled={(!newMessage.trim() && !file) || isUploading}
                size="large"
              >
                {isUploading ? (
                  <CircularProgress size={24} />
                ) : (
                  <SendRoundedIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => handleStartEditing(contextMenu?.message)}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteMessage(contextMenu?.message.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
