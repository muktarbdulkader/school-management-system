import React from 'react';
import PageContainer from 'ui-component/MainPage';

function PreSetup() {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(0);

  return <PageContainer maxWidth="lg" title={'Pre-setups'}></PageContainer>;
}

export default PreSetup;
