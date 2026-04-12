import React, { useEffect, useState } from 'react';
import { Grid, IconButton, useMediaQuery, useTheme } from '@mui/material';
import tabMenus from './tab-menus';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomTab = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const bigDevice = useMediaQuery(theme.breakpoints.up('sm'));
  const location = useLocation();
  const path = location.pathname;
  const [activeTab, setActiveTab] = useState('/');

  useEffect(() => {
    const PathArray = path.split('/');
    const activePath = '/' + PathArray[PathArray.length - 1];
    setActiveTab(activePath);
  }, [path]);
  return (
    <Grid
      container
      sx={{
        position: 'fixed',
        bottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        overflow: 'hidden'
      }}
    >
      <Grid
        item
        xs={11}
        sm={6}
        md={6}
        lg={4}
        sx={{
          backgroundColor: theme.palette.primary.dark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          py: '7px',
          borderRadius: 10
        }}
      >
        {tabMenus.map((menu, index) => (
          <IconButton
            key={index}
            sx={{
              backgroundColor: activeTab === menu.url && '#FFFFFF40'
            }}
            onClick={() => navigate(menu.url)}
          >
            {menu.icon}
          </IconButton>
        ))}
      </Grid>
    </Grid>
  );
};

export default BottomTab;
