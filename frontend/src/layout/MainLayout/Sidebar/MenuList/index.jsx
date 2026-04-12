import React from 'react';
import {
  Typography,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import NavGroup from './NavGroup';
import useMenuFilter from 'hooks/useMenuFilter';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const MenuList = () => {
  const theme = useTheme();
  const { filteredNavItems, loading } = useMenuFilter();
  const navigate = useNavigate();
  const location = useLocation();
  if (loading) {
    return (
      <Typography variant="h6" align="center">
        Loading menu...
      </Typography>
    );
  }

  if (!filteredNavItems || filteredNavItems.length === 0) {
    return (
      <Typography variant="h6" align="center" color="error">
        No available menu items
      </Typography>
    );
  }

  const navItems = filteredNavItems.map((item) => {
    switch (item?.type) {
      case 'group':
        return <NavGroup key={item?.id} item={item} />;

      case 'item':
        const isSelected = location.pathname === item.url;
        const ItemIcon = item.icon ? (
          React.cloneElement(item.icon, { stroke: 1.5, size: '1.3rem' })
        ) : (
          <FiberManualRecordIcon sx={{ width: 6, height: 6 }} />
        );

        return (
          <ListItemButton
            key={item?.id}
            onClick={() => navigate(item.url)}
            sx={{
              borderRadius: '8px',
              mb: 0.5,
              py: 1.25,
              pl: 2.5,
              backgroundColor: isSelected
                ? theme.palette.primary.main
                : 'inherit',
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
                '& .MuiTypography-root': { color: 'white' },
              },
            }}
            selected={isSelected}
          >
            <ListItemIcon
              sx={{
                minWidth: 36,
                color: isSelected
                  ? theme.palette.common.white
                  : theme.palette.text.primary,
              }}
            >
              {ItemIcon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant={isSelected ? 'subtitle1' : 'body1'}
                  color={
                    isSelected
                      ? theme.palette.common.white
                      : theme.palette.text.primary
                  }
                >
                  {item.title}
                </Typography>
              }
            />
            {item.badge && (
              <Badge
                color="error"
                badgeContent={item.badge.count}
                sx={{ mr: 2 }}
              />
            )}
          </ListItemButton>
        );

      default:
        return null;
    }
  });

  return <>{navItems}</>;
};

export default MenuList;
