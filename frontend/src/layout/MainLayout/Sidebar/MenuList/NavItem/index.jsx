import { forwardRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Badge,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// project imports
import { MENU_OPEN, SET_MENU } from 'store/actions/actions';

const NavItem = ({ item, level, PendingTasks }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const customization = useSelector((state) => state.customization);

  const matchesSM = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();

  const Icon = item.icon;
  const itemIcon = item?.icon ? (
    <Icon stroke={1.5} size="1.3rem" />
  ) : (
    <FiberManualRecordIcon
      sx={{
        width:
          customization.isOpen.findIndex((id) => id === item?.id) > -1 ? 8 : 6,
        height:
          customization.isOpen.findIndex((id) => id === item?.id) > -1 ? 8 : 6,
      }}
      fontSize={level > 0 ? 'inherit' : 'medium'}
    />
  );

  let itemTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  let listItemProps = {
    component: forwardRef((props, ref) => (
      <Link ref={ref} {...props} to={item.url} target={itemTarget} />
    )),
  };
  if (item?.external) {
    listItemProps = { component: 'a', href: item.url, target: itemTarget };
  }

  const itemHandler = (id) => {
    dispatch({ type: MENU_OPEN, id });
    if (matchesSM) dispatch({ type: SET_MENU, opened: false });
  };

  // active menu item on page load
  useEffect(() => {
    const currentIndex = document.location.pathname
      .toString()
      .split('/')
      .findIndex((id) => id === item.id);
    if (currentIndex > -1) {
      dispatch({ type: MENU_OPEN, id: item.id });
    }
    // eslint-disable-next-line
  }, []);

  const isSelected = location.pathname === item.url;

  return (
    <ListItemButton
      {...listItemProps}
      disabled={item.disabled}
      sx={{
        borderRadius: `${customization.borderRadius}px`,
        mb: 0.5,
        display: 'flex',
        alignItems: 'center',
        py: level > 1 ? 1 : 1.25,
        pl: `${level * 24}px`,
        backgroundColor: isSelected
          ? theme.palette.primary.main
          : level > 1 &&
              customization.isOpen.findIndex((id) => id === item.id) > -1
            ? theme.palette.primary.light
            : 'inherit',
        ':hover': {
          backgroundColor: theme.palette.primary.main, // Hover effect
          '& .MuiTypography-root': { color: 'white' },
        },
      }}
      selected={isSelected} // Mark as selected
      onClick={() => itemHandler(item.id)}
    >
      <ListItemIcon
        sx={{
          my: 'auto',
          minWidth: !item?.icon ? 18 : 36,
          color: isSelected
            ? theme.palette.common.white
            : theme.palette.text.primary,
        }}
      >
        {itemIcon}
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

      {PendingTasks && PendingTasks[item.id]?.count ? (
        <Badge
          color="error"
          badgeContent={PendingTasks[item.id]?.count}
          sx={{ mr: 2 }}
        />
      ) : null}
    </ListItemButton>
  );
};

export default NavItem;
