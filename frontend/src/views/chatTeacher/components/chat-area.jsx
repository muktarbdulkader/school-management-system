import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/Error';
import { useState, useEffect, useRef } from 'react';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import { useSelector } from 'react-redux';

export function ChatArea({
  conversation,
  onMessageAddition,
  onBack,
  studentContext,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const messagesContainerRef = useRef(null);
  const longPressTimeout = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const currentUser = useSelector((state) => state.user.user);

  // Get student ID directly from studentContext
  const studentId = studentContext?.student_id;
  const otherUserId = conversation?.other_user?.id;

  // useEffect(() => {
  //   console.log('ChatArea useEffect triggered:', {
  //     conversation: !!conversation,
  //     studentId,
  //     otherUserId,
  //   });

  //   if (conversation && studentId && otherUserId) {
  //     fetchConversationMessages(otherUserId, studentId);
  //   }
  // }, [conversation, studentId, otherUserId]);
  useEffect(() => {
    console.log('ChatArea useEffect triggered:', {
      conversation: !!conversation,
      studentId,
      otherUserId,
    });

    if (conversation && otherUserId) {
      // For teacher conversations, pass only the teacher ID
      // For student conversations, pass both teacher ID and student ID
      if (studentId) {
        fetchConversationMessages(otherUserId, studentId);
      } else {
        fetchConversationMessages(otherUserId);
      }
    }
  }, [conversation, studentId, otherUserId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const fetchConversationMessages = async (userId, studentId = null) => {
    console.log('fetchConversationMessages called with:', {
      userId,
      studentId,
    });

    // For teacher conversations, we don't need studentId
    if (!userId) {
      console.error('Missing userId:', { userId, studentId });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();

      // Build the API endpoint based on whether we have a studentId or not
      let Api;
      if (studentId) {
        // For student-parent conversations: /api/chats/conversation/{teacher_id}/{student_id}
        Api = `${Backend.auth}${Backend.chatsConversation}${userId}/${studentId}`;
      } else {
        // For teacher-teacher conversations: /api/chats/conversation/{teacher_id}
        Api = `${Backend.auth}${Backend.chatsConversation}${userId}`;
      }

      console.log('API Endpoint:', Api);

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch messages');
      }

      if (responseData.success) {
        const formattedMessages = responseData.data.map((message) => ({
          ...message,
          isUser: message.sender_id === currentUser?.id,
        }));

        console.log('Formatted messages:', formattedMessages);
        setMessages(formattedMessages.reverse());
        setError(false);
      } else {
        toast.warning(responseData.message);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(error.message);
      setError(true);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // const handleMessageAddition = async () => {
  //   if (editingMessage) {
  //     handleEditMessageSubmit();
  //     return;
  //   }

  //   if ((!newMessage.trim() && !file) || !conversation || !studentId) return;

  //   const tempMessage = {
  //     id: Date.now(),
  //     sender_id: currentUser.id,
  //     sender: currentUser.full_name,
  //     avatar: currentUser.avatar,
  //     message: newMessage,
  //     attachment: file ? URL.createObjectURL(file) : null,
  //     timestamp: new Date().toISOString(),
  //     isUser: true,
  //     status: 'sending',
  //     student_context: { student_id: studentId },
  //   };

  //   // Add optimistic message
  //   setMessages((prev) => [...prev, tempMessage]);
  //   setNewMessage('');
  //   setFile(null);
  //   setFileName('');

  //   try {
  //     const token = await GetToken();
  //     const Api = `${Backend.auth}${Backend.communicationChats}`;

  //     const formData = new FormData();
  //     formData.append('receiver', conversation.other_user.id);
  //     formData.append('student_id', studentId);
  //     if (newMessage.trim()) formData.append('message', newMessage);
  //     if (file) formData.append('attachment', file);

  //     const headers = { Authorization: `Bearer ${token}` };

  //     const response = await fetch(Api, {
  //       method: 'POST',
  //       headers,
  //       body: formData,
  //     });

  //     const responseData = await response.json();

  //     if (!response.ok || !responseData.success) {
  //       throw new Error(responseData.message || 'Failed to send message');
  //     }

  //     setMessages((prev) =>
  //       prev.map((msg) =>
  //         msg.id === tempMessage.id
  //           ? {
  //               ...responseData.data,
  //               isUser: true,
  //               status: 'sent',
  //             }
  //           : msg,
  //       ),
  //     );

  //     if (onMessageAddition) {
  //       onMessageAddition({ other_user_id: conversation.other_user.id });
  //     }
  //   } catch (error) {
  //     console.error('Error sending message:', error);
  //     toast.error(error.message);

  //     setMessages((prev) =>
  //       prev.map((msg) =>
  //         msg.id === tempMessage.id ? { ...msg, status: 'failed' } : msg,
  //       ),
  //     );
  //   }
  // };

  // const handleEditMessage = async () => {
  //   if (!editingMessage || !newMessage.trim() || !conversation || !studentId)
  //     return;

  //   try {
  //     const token = await GetToken();
  //     const Api = `${Backend.auth}${Backend.communicationChats}${editingMessage.id}/`;

  //     const response = await fetch(Api, {
  //       method: 'PUT',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         message: newMessage,
  //         receiver: conversation.other_user.id,
  //         student_id: studentId,
  //       }),
  //     });

  //     const responseData = await response.json();

  //     if (!response.ok) {
  //       throw new Error(responseData.message || 'Failed to edit message');
  //     }

  //     if (responseData.success) {
  //       setMessages((prev) =>
  //         prev.map((msg) =>
  //           msg.id === editingMessage.id
  //             ? { ...msg, message: newMessage, edited: true }
  //             : msg,
  //         ),
  //       );
  //       setEditingMessage(null);
  //       setNewMessage('');
  //       toast.success('Message updated');
  //     } else {
  //       toast.warning(responseData.message);
  //     }
  //   } catch (error) {
  //     console.error('Error editing message:', error);
  //     toast.error(error.message);
  //   }
  // };

  const handleMessageAddition = async () => {
    if (editingMessage) {
      handleEditMessageSubmit();
      return;
    }

    // Remove the studentId requirement for teacher conversations
    if ((!newMessage.trim() && !file) || !conversation) return;

    const tempMessage = {
      id: Date.now(),
      sender_id: currentUser.id,
      sender: currentUser.full_name,
      avatar: currentUser.avatar,
      message: newMessage,
      attachment: file ? URL.createObjectURL(file) : null,
      timestamp: new Date().toISOString(),
      isUser: true,
      status: 'sending',
      // Only include student_context if we have a studentId
      ...(studentId && { student_context: { student_id: studentId } }),
    };

    // Add optimistic message
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setFile(null);
    setFileName('');

    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.communicationChats}`;

      const formData = new FormData();
      formData.append('receiver', conversation.other_user.id);

      // Only append student_id if we have one (for student conversations)
      if (studentId) {
        formData.append('student_id', studentId);
      }

      if (newMessage.trim()) formData.append('message', newMessage);
      if (file) formData.append('attachment', file);

      const headers = { Authorization: `Bearer ${token}` };

      const response = await fetch(Api, {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || 'Failed to send message');
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? {
                ...responseData.data,
                isUser: true,
                status: 'sent',
              }
            : msg,
        ),
      );

      if (onMessageAddition) {
        onMessageAddition({ other_user_id: conversation.other_user.id });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, status: 'failed' } : msg,
        ),
      );
    }
  };

  const handleEditMessage = async () => {
    // Remove the studentId requirement for teacher conversations
    if (!editingMessage || !newMessage.trim() || !conversation) return;

    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.communicationChats}${editingMessage.id}/`;

      const requestBody = {
        message: newMessage,
        receiver: conversation.other_user.id,
      };

      // Only include student_id if we have one (for student conversations)
      if (studentId) {
        requestBody.student_id = studentId;
      }

      const response = await fetch(Api, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
      const Api = `${Backend.auth}${Backend.communicationChats}${messageId}/`;

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

  const handleLongPressStart = (e, message) => {
    if (isMobile && message.isUser) {
      longPressTimeout.current = setTimeout(() => {
        setContextMenu({
          mouseX: e.touches[0].clientX,
          mouseY: e.touches[0].clientY,
          message,
        });
      }, 600);
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const handleContextMenu = (event, message) => {
    event.preventDefault();
    if (message.isUser) {
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

  if (!conversation) {
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
          Select a conversation to start chatting
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
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        {isMobile && (
          <IconButton
            aria-label="Back"
            onClick={onBack}
            size="medium"
            sx={{ p: 0 }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
        )}

        <Avatar
          alt={conversation.other_user.full_name}
          src={conversation.other_user.avatar}
          sx={{ width: 48, height: 48 }}
        />

        <Typography variant="h6" fontWeight="bold">
          {conversation.other_user.full_name}
        </Typography>

        {/* Show student name from studentContext */}
        {studentContext && (
          <Typography
            variant="body2"
            sx={{ ml: 'auto', color: 'text.secondary' }}
          >
            {studentContext.student_name}
          </Typography>
        )}
      </Box>

      {/* Messages area */}
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
              onClick={() => {
                if (studentId) {
                  fetchConversationMessages(otherUserId, studentId);
                } else {
                  fetchConversationMessages(otherUserId);
                }
              }}
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
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
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
                    flexDirection: message.isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    maxWidth: '75%',
                  }}
                >
                  <Avatar
                    alt={message.sender}
                    sx={{ width: 32, height: 32, mx: 1 }}
                    src={message.avatar}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight="medium"
                      sx={{
                        textAlign: message.isUser ? 'right' : 'left',
                        mb: 0.5,
                      }}
                    >
                      {message.sender}
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
                      {message.isUser && (
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
                          {message.attachment.match(/\.(jpeg|jpg|gif|png)$/) ? (
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
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                gap: 1,
                                width: '100%',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  flex: 1,
                                  width: '100%',
                                }}
                              >
                                <InsertDriveFileIcon color="primary" />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    flex: 1,
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {message.attachment.split('/').pop()}
                                </Typography>
                              </Box>

                              <Button
                                size="small"
                                variant="contained"
                                component="a"
                                href={message.attachment}
                                download
                                sx={{
                                  alignSelf: { xs: 'stretch', sm: 'center' },
                                  mt: { xs: 1, sm: 0 },
                                }}
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
                        justifyContent: message.isUser
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
                      {message.isUser && (
                        <Box sx={{ ml: 0.5 }}>
                          {renderStatusIcon(message.status)}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            sx={{ textAlign: 'center', color: 'text.secondary', pt: 4 }}
          >
            No messages in this conversation
          </Typography>
        )}
      </Box>

      {/* Input area */}
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
            placeholder={
              editingMessage ? 'Edit your message...' : 'Type your message...'
            }
            variant="outlined"
            size="small"
            fullWidth
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleMessageAddition();
              }
            }}
            multiline
            maxRows={4}
          />

          <input
            id="file-upload"
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Tooltip title="Attach file">
            <IconButton
              component="label"
              htmlFor="file-upload"
              size="large"
              sx={{ p: 1 }}
            >
              <AttachFileIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={editingMessage ? 'Save changes' : 'Send'}>
            <span>
              <IconButton
                color="primary"
                size="large"
                onClick={handleMessageAddition}
                disabled={(!newMessage.trim() && !file) || isUploading}
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
