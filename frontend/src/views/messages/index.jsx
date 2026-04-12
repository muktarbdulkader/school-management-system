import React from 'react';

import MessageSideNav from './components/MessageSideNav';
import PageWrapper from 'ui-component/PagesWrapper';
import PageContainer from 'ui-component/MainPage';

const Messages = () => {
  return (
    <PageContainer className="w-full" title="Communication Hub">
      <MessageSideNav />
    </PageContainer>
  );
};

export default Messages;
