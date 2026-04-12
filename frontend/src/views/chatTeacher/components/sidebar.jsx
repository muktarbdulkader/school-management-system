import React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import GetToken from 'utils/auth-token';
import { toast, ToastContainer } from 'react-toastify';
import Backend from 'services/backend';
import CreateMessageForm from './CreateMessage';
import { useNavigate } from 'react-router-dom';
import GroupChats from './group-chats';
import { DraftItem } from './DraftItem';

function ConversationItem({
  name,
  Name,
  message,
  timestamp,
  is_read,
  onClick,
  isSelected,
  subject,
}) {
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
        bgcolor: isSelected ? 'primary.lighter' : 'inherit',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.2s ease',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <ListItemAvatar>
          <Avatar alt={Name || name} sx={{ width: 40, height: 40 }} />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                {Name || name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formattedTime}
              </Typography>
            </Box>
          }
          secondary={
            <>
              <Typography
                sx={{ display: 'block' }}
                component="span"
                variant="body2"
                color="text.secondary"
                noWrap
              >
                {message}
              </Typography>
            </>
          }
          sx={{ ml: 1, flex: 1 }}
        />
        {!is_read && (
          <FiberManualRecordIcon
            sx={{ fontSize: 10, color: 'primary.main', ml: 1 }}
          />
        )}
      </Box>

      {/* Subject Chip */}
      {subject && (
        <Chip
          label={subject.name}
          size="small"
          sx={{
            mt: 1,
            backgroundColor: 'primary.light',
            color: 'primary.contrastText',
            fontSize: '0.7rem',
            height: 20,
          }}
        />
      )}
    </ListItem>
  );
}

export function Sidebar({
  onSelectConversation,
  onSelectGroup,
  selectedConversation,
  selectedGroup,
  onTabChange,
}) {
  const [tabValue, setTabValue] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [groupConversations, setGroupConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [add, setAdd] = useState(false);
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ last_page: 1, total: 0 });
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (onTabChange) {
      onTabChange(newValue);
    }

    if (newValue === 0) {
      getConversations();
    } else if (newValue === 2) {
      getGroupConversations();
    }
  };

  const fetchAvailableFilters = async () => {
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.chatsConversations}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success && responseData.available_filters) {
        setAvailableSubjects(responseData.available_filters.subjects || []);
      }
    } catch (error) {
      console.error('Failed to fetch available filters:', error);
    }
  };

  const getConversations = async (subjectId = '') => {
    setLoading(true);
    try {
      const token = await GetToken();
      let Api = `${Backend.auth}${Backend.chatsConversations}`;

      // Add subject filter if provided
      if (subjectId) {
        Api += `?subject_id=${subjectId}`;
      }

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to fetch conversations',
        );
      }

      if (responseData.success) {
        setConversations(responseData.data);
        setPagination({
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

  const handleSubjectChange = (event) => {
    const subjectId = event.target.value;
    setSelectedSubjectId(subjectId);
    getConversations(subjectId);
  };

  const clearFilters = () => {
    setSelectedSubjectId('');
    getConversations();
  };

  const renderTabContent = () => {
    switch (tabValue) {
      case 0: // All tab
        return (
          <>
            {/* Subject Filter */}
            {showFilters && availableSubjects.length > 0 && (
              <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="subject-filter-label">
                    Filter by Subject
                  </InputLabel>
                  <Select
                    labelId="subject-filter-label"
                    value={selectedSubjectId}
                    label="Filter by Subject"
                    onChange={handleSubjectChange}
                    sx={{ borderRadius: 1 }}
                  >
                    <MenuItem value="">
                      <em>All Subjects</em>
                    </MenuItem>
                    {availableSubjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedSubjectId && (
                  <Button size="small" onClick={clearFilters} sx={{ mt: 1 }}>
                    Clear Filter
                  </Button>
                )}
              </Box>
            )}

            <List disablePadding>
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  name={conversation.other_user?.full_name}
                  Name={conversation.display_name}
                  message={conversation.latest_message}
                  timestamp={conversation.last_timestamp}
                  is_read={conversation.unread_count === 0}
                  onClick={() => onSelectConversation(conversation)}
                  isSelected={selectedConversation?.id === conversation.id}
                  subject={conversation.subject} // Pass subject data
                />
              ))}
            </List>
          </>
        );

      case 1: // Draft tab
        const allDrafts =
          JSON.parse(localStorage.getItem('draft-messages')) || [];
        return (
          <List disablePadding>
            {allDrafts.map((draft) => (
              <DraftItem
                key={draft.id}
                receiverName={
                  draft.receiverName || `User (${draft.receiverId})`
                }
                message={draft.message}
                timestamp={draft.created_at}
                onClick={() => {
                  setSelectedDraft({
                    ...draft,
                    receiver: draft.receiverId,
                  });
                  setAdd(true);
                }}
              />
            ))}
          </List>
        );

      case 2: // Groups tab
        return (
          <List disablePadding>
            {groupConversations.map((group) => (
              <GroupChats
                key={group.id}
                name={group.name}
                message={group.latest_message || 'No messages yet'}
                timestamp={group.created_at}
                onClick={() => onSelectGroup(group)}
                isSelected={selectedGroup?.id === group.id}
              />
            ))}
          </List>
        );

      default:
        return null;
    }
  };

  // ... rest of your existing code ...

  const handleMessageModalClose = () => {
    setAdd(false);
  };

  const getGroupConversations = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.groupChats}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to fetch conversations',
        );
      }

      if (responseData.success) {
        setGroupConversations(responseData.data);
        setPagination({
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

  const handleMessageAddition = async (newMessageData) => {
    if (newMessageData) {
      try {
        setConversations((prevConversations) => {
          const updatedConversations = [newMessageData, ...prevConversations];
          return updatedConversations;
        });

        await getConversations();

        return;
      } catch (error) {
        console.error('Error in optimistic update:', error);
      }
    }
    try {
      await getConversations();
    } catch (error) {
      console.error('Error refreshing conversations:', error);
      toast.error('Failed to refresh conversations');
    }
  };

  const handleAddMessageClick = () => {
    setAdd(true);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  useEffect(() => {
    if (tabValue === 2) {
      getGroupConversations();
    } else if (tabValue === 0) {
      getConversations();
      fetchAvailableFilters();
    }
  }, [tabValue]);

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 390 },
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Search teachers, admins, or messages..."
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            sx={{
              flexGrow: 1,
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
            onClick={handleAddMessageClick}
          >
            New Message
          </Button>
          <Button
            variant="outlined"
            sx={{
              flexGrow: 1,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
              },
            }}
            onClick={() => navigate('/meeting-history')}
          >
            Request Meeting
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="conversation filters"
          sx={{
            minHeight: 'unset',
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          <Tab
            label="All"
            sx={{
              minHeight: 'unset',
              p: '6px 12px',
              fontSize: '0.875rem',
              textTransform: 'none',
              color: 'text.primary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 'medium',
              },
              '&:hover': {
                color: 'primary.dark',
              },
            }}
          />
          <Tab
            label="Draft"
            sx={{
              minHeight: 'unset',
              p: '6px 12px',
              fontSize: '0.875rem',
              textTransform: 'none',
              color: 'text.primary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 'medium',
              },
              '&:hover': {
                color: 'primary.dark',
              },
            }}
          />
          <Tab
            label="Groups"
            sx={{
              minHeight: 'unset',
              p: '6px 12px',
              fontSize: '0.875rem',
              textTransform: 'none',
              color: 'text.primary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 'medium',
              },
              '&:hover': {
                color: 'primary.dark',
              },
            }}
          />
        </Tabs>
        <Button
          variant="text"
          size="small"
          sx={{ minWidth: 'unset', p: 0.5 }}
          onClick={toggleFilters}
        >
          <FilterListIcon
            sx={{ color: showFilters ? 'primary.main' : 'text.secondary' }}
          />
        </Button>
        <ToastContainer />
        <CreateMessageForm
          open={add}
          onClose={() => {
            setSelectedDraft(null);
            handleMessageModalClose();
          }}
          onSubmit={handleMessageAddition}
          draft={selectedDraft}
        />
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>
            <Typography>
              Failed to load conversations. Please try again.
            </Typography>
            <Button
              variant="outlined"
              onClick={getConversations}
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No conversations found
              {selectedSubjectId && ' for this subject'}
            </Typography>
            {selectedSubjectId && (
              <Button onClick={clearFilters} sx={{ mt: 1 }}>
                Clear Filter
              </Button>
            )}
          </Box>
        ) : (
          renderTabContent()
        )}
      </Box>
    </Box>
  );
}
