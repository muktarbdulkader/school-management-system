import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar } from './components/sidebar';
import { ChatArea } from './components/chat-area';
import { GroupChatArea } from './components/groupchat-area';
import PageContainer from 'ui-component/MainPage';
import { Box } from '@mui/system';
import { useState } from 'react';

// pages/chat.js
export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showSidebar, setShowSidebar] = useState(true);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setSelectedGroup(null);
    if (isMobile) setShowSidebar(false);
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedConversation(null);
    if (isMobile) setShowSidebar(false);
  };

  const handleBackToSidebar = () => {
    setShowSidebar(true);
  };

  return (
    <PageContainer title="Communication Hub">
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: '80vh',
          width: '100%',
          bgcolor: '#ffff',
          p: 1,
          overflow: 'hidden',
        }}
      >
        {(showSidebar || !isMobile) && (
          <Box
            sx={{
              width: { xs: '100%', md: 400 },
              flexShrink: 0,
              height: { xs: 'auto', md: '100%' },
              borderRight: { xs: 'none' },
              mb: { xs: 1, md: 0 },
            }}
          >
            <Sidebar
              onSelectConversation={handleSelectConversation}
              onSelectGroup={handleSelectGroup}
              selectedConversation={selectedConversation}
              selectedGroup={selectedGroup}
              onTabChange={setActiveTab}
            />
          </Box>
        )}

        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            display: { xs: showSidebar ? 'none' : 'block', md: 'block' },
          }}
        >
          {activeTab === 2 ? (
            selectedGroup ? (
              <GroupChatArea
                group={selectedGroup}
                onMessageSend={() => {}}
                onBack={isMobile ? handleBackToSidebar : null}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Typography>Select a group to start chatting</Typography>
              </Box>
            )
          ) : selectedConversation ? (
            <ChatArea
              conversation={selectedConversation}
              onBack={isMobile ? handleBackToSidebar : null}
              studentContext={selectedConversation?.student_context}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Typography>Select a conversation to start chatting</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
}
