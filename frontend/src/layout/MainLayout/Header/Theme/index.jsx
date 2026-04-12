import React from 'react';
import { IconButton } from '@mui/material';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { SET_SYSTEM_THEME } from 'store/actions/actions';

const ToggleTheme = () => {
  const systemTheme = useSelector((state) => state.customization.systemTheme);
  const dispatch = useDispatch();

  const handleThemeChange = (theme) => {
    dispatch({ type: SET_SYSTEM_THEME, systemTheme: theme });
  };
  return (
    <div style={{ marginRight: 10 }}>
      {systemTheme === 'dark' && (
        <IconButton onClick={() => handleThemeChange('light')}>
          <IconSun size={22} />
        </IconButton>
      )}
      {systemTheme === 'light' && (
        <IconButton onClick={() => handleThemeChange('dark')}>
          <IconMoon size={22} />
        </IconButton>
      )}
    </div>
  );
};

export default ToggleTheme;
