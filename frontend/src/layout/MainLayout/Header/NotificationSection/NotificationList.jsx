import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

// project-import
import Chip from 'ui-component/extended/Chip';

// assets
import {
  IconBrandTelegram,
  IconBuildingStore,
  IconMailbox,
  IconPhoto,
} from '@tabler/icons-react';
import User1 from 'assets/images/users/user-round.svg';
import { TimeAgo } from 'utils/time-ago';

const ListItemWrapper = ({ children }) => {
  return (
    <Box
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'primary.light',
        },
      }}
    >
      {children}
    </Box>
  );
};

ListItemWrapper.propTypes = {
  children: PropTypes.node,
};

// ==============================|| NOTIFICATION LIST ITEM ||============================== //

const NotificationList = ({ notification, onPress }) => {
  const theme = useTheme();

  return (
    <List
      sx={{
        py: 0,

        '& .MuiListItemSecondaryAction-root': {
          top: 12,
        },
        '& .MuiDivider-root': {
          my: 0,
        },
        '& .list-container': {
          pl: 7,
        },
        backgroundColor:
          notification.read_at === null && theme.palette.grey[100],
      }}
      onClick={onPress}
    >
      <ListItemWrapper>
        <ListItem>
          <Grid container justifyContent="flex-end">
            <Grid
              item
              xs={12}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                }}
              >
                <Avatar
                  alt={notification.name}
                  src={User1}
                  sx={{ width: 30, height: 30, marginRight: 1.4 }}
                />
                <Typography variant="h5">{notification.name}</Typography>
              </Box>

              <Typography
                variant="caption"
                display="block"
                gutterBottom
                textTransform="capitalize"
              >
                {TimeAgo(notification.created_at)}
              </Typography>
            </Grid>
          </Grid>
        </ListItem>
        <Grid container direction="column" className="list-container">
          <Grid item xs={12} sx={{ pb: 2 }}>
            <Typography variant="subtitle2">
              {notification.body?.message}
            </Typography>
          </Grid>
        </Grid>
      </ListItemWrapper>
    </List>
  );
};

export default NotificationList;
