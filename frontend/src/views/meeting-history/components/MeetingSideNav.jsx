import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import Text from 'ui-component/typography/text/text';
import PageContainer from 'ui-component/MainPage';

import { Typography, Box } from '@mui/material';
import MeetingList from './MeetingList';
import MeetingDetailView from './MeetingDetailView';
import Upcoming from './Upcoming';
import PastMeeting from './PastMeeting';

const MeetingSideNav = ({ fetchMeetings }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const handleMeetingSelect = (meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleTabChange = (index) => {
    setSelectedMeeting(null);
    setActiveTabIndex(index);
  };

  const renderTabContent = () => {
    const props = {
      fetchMessages: fetchMeetings,
      onMessageSelect: handleMeetingSelect,
      selectedMessageId: selectedMeeting?.id,
    };

    switch (activeTabIndex) {
      case 0:
        return <MeetingList {...props} />;
      case 1:
        return <Upcoming {...props} />;
      case 2:
        return <PastMeeting {...props} />;
      default:
        return null;
    }
  };

  const renderDetailView = () =>
    selectedMeeting ? (
      <MeetingDetailView
        meeting={selectedMeeting}
        fetchMeetings={fetchMeetings}
      />
    ) : (
      <Typography>Select a meeting to view details</Typography>
    );

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        width="100%"
        height="100%"
      >
        {/* Left Sidebar */}
        <Box
          width={{ xs: '100%', md: '40%', lg: '33%' }}
          borderRight={{ md: '1px solid #e0e0e0' }}
        >
          {/* Tabs */}
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
            {['All', 'Upcoming', 'Past'].map((name, index) => (
              <Box
                key={index}
                onClick={() => handleTabChange(index)}
                sx={{
                  cursor: 'pointer',
                  px: 1,
                  borderRadius: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  minWidth: 'fit-content',
                  flexShrink: 0,
                  backgroundColor:
                    activeTabIndex === index ? 'primary.main' : 'transparent',
                  color:
                    activeTabIndex === index ? 'common.white' : 'text.primary',
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
                  {name}
                </Text>
              </Box>
            ))}
          </Box>

          {/* Meeting List Content */}
          <Box>{renderTabContent()}</Box>
        </Box>

        {/* Detail View */}
        <Box width={{ xs: '100%', md: '60%', lg: '67%' }} p={3}>
          {renderDetailView()}
        </Box>
      </Box>
      <ToastContainer />
    </Box>
  );
};

export default MeetingSideNav;
