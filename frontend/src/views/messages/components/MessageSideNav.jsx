import React, { useCallback, useEffect, useState } from 'react';

import CreateMessageForm from './CreateMessage';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import MessageSent from 'ui-component/icons/message-sent';
import MessageDraft from 'ui-component/icons/message-draft';
import MessageTemplate from 'ui-component/icons/message-template';
import TrashIcon from 'ui-component/icons/trash';

import Text from 'ui-component/typography/text/text';
import { useModal } from 'hooks/use-modal';
import GetToken from 'utils/auth-token';
import PageContainer from 'ui-component/MainPage';
import { useNavigate } from 'react-router-dom';

import {
  Avatar,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  TablePagination,
  Typography,
} from '@mui/material';
import { Box } from '@mui/system';
// import { Search } from '@mui/icons-material';
import AddButton from 'ui-component/buttons/AddButton';
import Fallbacks from 'utils/components/Fallbacks';
import MessageAll from './MessageAll';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Search from 'ui-component/search';
import { format } from 'date-fns';
import EmptyStateAll from './EmptyStateAll';
import MessageDetailAll from './MessageDetailAll';
import MessageDetailUnread from './MessageDetailUnread';
import EmptyStateUnread from './EmptyStateUnread';
import MessageDetailGroups from './MessageDetailGroups';
import EmptyStateGroups from './EmptyStateGroups';
import MessageDetailStarted from './MessageDetailStarted';
import EmptyStateStarted from './EmptyStateStarted';

const MessageSideNav = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [add, setAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const handleMessageSelect = (message) => {
    setSelectedMessage(message);
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleSearchFieldChange = (event) => {
    setSearch(event.target.value);
  };

  const handleMessageAddition = () => {
    fetchMessages();
    handleMessageModalClose();
  };

  const handleMessageModalClose = () => {
    setAdd(false);
  };

  const handleAddMessageClick = () => {
    setAdd(true);
  };

  const fetchMessages = useCallback(async () => {
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
        setData(responseData.data);
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
  }, [pagination.page, pagination.per_page, search]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchMessages();
    }, 800);

    return () => clearTimeout(debounceTimeout);
  }, []);

  useEffect(() => {
    setSelectedMessage(null);
  }, [activeTabIndex]);

  const handleTabChange = (index) => {
    setSelectedMessage(null);
    setActiveTabIndex(index);
  };

  const MessageTabOptions = [
    {
      id: 1,
      name: 'All',
      component: <MessageAll fetchMessages={fetchMessages} />,
      detailView: MessageDetailAll,
      emptyState: <EmptyStateAll />,
    },
    {
      id: 2,
      name: 'Unread',
      component: <div>Unread Messages</div>,
      detailView: MessageDetailUnread,
      emptyState: <EmptyStateUnread />,
    },
    {
      id: 3,
      name: 'Groups',
      component: <div>Groups Messages</div>,
      detailView: MessageDetailGroups,
      emptyState: <EmptyStateGroups />,
    },
    {
      id: 4,
      name: 'Started',
      component: <div>Started Messages</div>,
      detailView: MessageDetailStarted,
      emptyState: <EmptyStateStarted />,
    },
  ];

  return (
    <PageContainer>
      <Grid container spacing={2}>
        {/* Left sidebar - message list */}
        <Grid item xs={12} md={5} lg={4}>
          <main className="flex-1 flex flex-col justify-start relative rounded-2xl">
            <Box
              sx={{ padding: 2 }}
              className="flex flex-col justify-between h-full"
            >
              {/* Search and buttons - keep this part the same */}
              <Box sx={{ display: 'flex', justifyContent: 'space-start' }}>
                <Search
                  title="Search Messages"
                  value={search}
                  onChange={handleSearchFieldChange}
                  filter={false}
                />
              </Box>

              <Box sx={{ gap: 1, display: 'flex', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddMessageClick}
                  sx={{ borderRadius: 2 }}
                >
                  New Message
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 2 }}
                  onClick={() => navigate('/meeting-history')}
                >
                  Request Meeting
                </Button>
              </Box>
            </Box>

            {/* Tab navigation - keep this the same */}
            <Box
              sx={{
                display: 'flex',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                gap: 1,
                px: 1,
                py: 1,
                '&::-webkit-scrollbar': {
                  height: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '2px',
                },
              }}
            >
              {MessageTabOptions.map((option, index) => (
                <Box
                  key={option.id}
                  onClick={() => handleTabChange(index)}
                  sx={{
                    cursor: 'pointer',
                    px: 1,

                    borderRadius: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0,
                    minWidth: 'fit-content',
                    flexShrink: 0,
                    backgroundColor:
                      activeTabIndex === index ? 'primary.main' : 'transparent',
                    color:
                      activeTabIndex === index
                        ? 'common.white'
                        : 'text.primary',
                    '&:hover': {
                      backgroundColor:
                        activeTabIndex === index
                          ? 'primary.dark'
                          : 'action.hover',
                    },
                    transition: 'background-color 0.3s ease, color 0.3s ease',
                    boxShadow:
                      activeTabIndex === index
                        ? '0 2px 4px rgba(0,0,0,0.1)'
                        : 'none',
                  }}
                >
                  <Text
                    variant="body2"
                    fontWeight={activeTabIndex === index ? 600 : 400}
                  >
                    {option.name}
                  </Text>
                </Box>
              ))}
            </Box>

            {/* Modified MessageAll component to include click handler */}
            {React.cloneElement(MessageTabOptions[activeTabIndex].component, {
              fetchMessages,
              onMessageSelect: handleMessageSelect,
              selectedMessageId: selectedMessage?.id,
            })}
          </main>
        </Grid>

        {/* Right side - message detail */}
        <Grid item xs={12} md={7} lg={8}>
          <Box sx={{ p: 3, height: '100%', borderLeft: '1px solid #e0e0e0' }}>
            {selectedMessage
              ? React.createElement(
                  MessageTabOptions[activeTabIndex].detailView,
                  {
                    message: selectedMessage,
                  },
                )
              : MessageTabOptions[activeTabIndex].emptyState}
          </Box>
        </Grid>
      </Grid>

      <ToastContainer />
      <CreateMessageForm
        open={add}
        onClose={handleMessageModalClose}
        onSubmit={handleMessageAddition}
        fetchMessages={fetchMessages}
      />
    </PageContainer>
  );
};
export default MessageSideNav;
