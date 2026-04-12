import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { List, Typography, Collapse, Box } from '@mui/material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import NavItem from '../NavItem';
import NavCollapse from '../NavCollapse';
import { useSelector } from 'react-redux';

// ==============================|| SIDEBAR MENU LIST GROUP ||============================== //

const NavGroup = ({ item }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const { weeklyTasks, approvalRequests } = useSelector(
    (state) => state.pending,
  );

  const PendingTasks = {
    teams: { count: weeklyTasks },
    approvals: { count: approvalRequests },
  };

  const handleToggle = () => {
    setOpen(!open);
  };

  // menu list collapse & items
  const items = item.children?.map((menu) => {
    switch (menu.type) {
      case 'collapse':
        return (
          <NavCollapse
            key={menu.id}
            menu={menu}
            level={1}
            PendingTasks={PendingTasks}
          />
        );
      case 'item':
        return (
          <NavItem
            key={menu.id}
            item={menu}
            level={1}
            PendingTasks={PendingTasks}
          />
        );
      default:
        return (
          <Typography key={menu.id} variant="h6" color="error" align="center">
            Menu Items Error
          </Typography>
        );
    }
  });

  return (
    <>
      <List
        subheader={
          item.title && (
            <Typography
              variant="caption"
              sx={{
                ...theme.typography.menuCaption,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'inherit',
                cursor: 'pointer',
                pl: `${24}px`,
              }}
              gutterBottom
              onClick={handleToggle}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {item.icon && (
                  <item.icon
                    size="1.3rem"
                    stroke={1.5}
                    style={{ marginRight: 10, pl: `${24}px` }}
                  />
                )}
                {item.title}
                {item.caption && (
                  <Typography
                    variant="caption"
                    sx={{ ...theme.typography.subMenuCaption }}
                    display="block"
                  >
                    {item.caption}
                  </Typography>
                )}
              </Box>
              {open ? (
                <IconChevronUp
                  stroke={1.5}
                  size="1rem"
                  style={{ marginTop: 'auto', marginBottom: 'auto' }}
                />
              ) : (
                <IconChevronDown
                  stroke={1.5}
                  size="1rem"
                  style={{ marginTop: 'auto', marginBottom: 'auto' }}
                />
              )}
            </Typography>
          )
        }
      >
        <Collapse in={open}>{items}</Collapse>
      </List>
    </>
  );
};

NavGroup.propTypes = {
  item: PropTypes.object,
};

export default NavGroup;
