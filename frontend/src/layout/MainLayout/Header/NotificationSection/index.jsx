import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';

// assets
import { IconBell } from '@tabler/icons-react';
import { Badge, Button, IconButton } from '@mui/material';
import NotificationList from './NotificationList';

import { toast } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import { NotificationRedirection } from 'utils/notification-redirection';
import { setNotifications } from 'store/actions/actions';
import { useDispatch, useSelector } from 'react-redux';

// notification status options
const status = [
  {
    value: ' ',
    label: 'All Notifications',
  },
  {
    value: 'read',
    label: 'Read',
  },
  {
    value: 'unread',
    label: 'Unread',
  },
];

// ==============================|| NOTIFICATION ||============================== //

const NotificationSection = () => {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { notifications } = useSelector((state) => state.pending);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState(' ');

  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
  });

  /**
   * anchorRef is used on different components and specifying one type leads to other components throwing an error
   * */
  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleGettingNotifications = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api =
      Backend.auth +
      Backend.myNotification +
      `?page=${pagination.page}&per_page=${pagination.per_page}&filter=${filter}`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'GET',
      headers: header,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setData(response.data.data.data);
          setPagination((prev) => ({
            ...prev,
            total: response.data.data.total,
          }));
          dispatch(setNotifications(response.data?.unread_count));
          setError(false);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleFilterReadNotification = async (notification) => {
    setData((prevData) => {
      const updatedNotification = {
        ...notification,
        read_at: notification.created_at,
      };

      return prevData.map((notice) =>
        notice.id === notification.id ? updatedNotification : notice,
      );
    });
  };

  //  =============== HANDLE NOTIFICATION READING ======= START ========

  const handleReadingNotification = async (notification) => {
    const token = await GetToken();
    const Api = Backend.auth + Backend.readNotification + notification?.id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, { method: 'POST', headers: header })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          handleGettingNotifications();
        }
      })
      .catch((error) => {
        toast.error(error?.message);
      })
      .finally(() => {
        setMarking(false);
      });
  };
  //  =============== HANDLE NOTIFICATION READING ======= END ========

  //  =============== HANDLE NOTIFICATION CLICKING ======= START ========

  const handleRedirection = async (notification) => {
    await handleReadingNotification(notification);
    handleToggle();
    NotificationRedirection(notification.body, navigate);
  };

  //  =============== HANDLE NOTIFICATION CLICKING ======= END ========

  const handleMarkingAsRead = async () => {
    setMarking(true);
    const token = await GetToken();
    const Api = Backend.auth + Backend.readAllNotification;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, { method: 'POST', headers: header })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          handleGettingNotifications();
        }
      })
      .catch((error) => {
        toast.error(error?.message);
      })
      .finally(() => {
        setMarking(false);
      });
  };

  const prevOpen = useRef(open);

  const handleFilteringNotifications = (event) => {
    if (event?.target.value) {
      setFilter(event?.target.value);
      setPagination((prev) => ({ ...prev, page: 0 }));
    }
  };

  const handleNotificationViewMore = () => {
    setPagination((prev) => ({ ...prev, page: pagination.page + 1 }));
  };

  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  useEffect(() => {
    handleGettingNotifications();
  }, [open, filter, pagination.page]);

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <IconButton
          sx={{
            transition: 'all .2s ease-in-out',
            mr: 0.6,
          }}
          ref={anchorRef}
          aria-controls={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
          color="inherit"
        >
          <Badge
            color="error"
            badgeContent={notifications}
            sx={{ position: 'absolute', top: 10, right: 10 }}
          />
          <IconBell size="1.4rem" stroke="1.8" />
        </IconButton>
      </Box>
      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [matchesXs ? 5 : 0, 20],
              },
            },
          ],
        }}
      >
        {({ TransitionProps }) => (
          <Transitions
            position={matchesXs ? 'top' : 'top-right'}
            in={open}
            {...TransitionProps}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  border={true}
                  content={false}
                  boxShadow
                  shadow={theme.shadows[1]}
                >
                  <Grid container>
                    <Grid item xs={12}>
                      <Grid
                        container
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ pt: 2, px: 2 }}
                      >
                        <Grid item>
                          <Stack direction="row" spacing={2}>
                            <Typography variant="h4">Notifications</Typography>
                            {/* {notifications ? (
                              <Chip
                                size="small"
                                label={notifications}
                                sx={{
                                  color: theme.palette.common.white,
                                  bgcolor: theme.palette.error.main
                                }}
                              />
                            ) : null} */}
                          </Stack>
                        </Grid>
                        <Grid item>
                          <DrogaButton
                            variant="text"
                            title="Mark all as read"
                            loading={marking}
                            onPress={() => handleMarkingAsRead()}
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ px: 2, py: 1, mb: 1 }}>
                        <TextField
                          id="outlined-select-currency-native"
                          select
                          fullWidth
                          value={filter}
                          onChange={handleFilteringNotifications}
                          SelectProps={{
                            native: true,
                          }}
                        >
                          {status.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </TextField>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid
                          item
                          xs={12}
                          sx={{
                            width: 240,
                            height: '64.6dvh',
                            overflowY: 'auto',
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': {
                              display: 'none',
                            },
                          }}
                        >
                          {loading ? (
                            <Grid container>
                              <Grid
                                item
                                xs={12}
                                sx={{
                                  p: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <ActivityIndicator size={20} />
                              </Grid>
                            </Grid>
                          ) : error ? (
                            <ErrorPrompt
                              title="Server Error"
                              message={`There is error getting notifications`}
                              size={100}
                            />
                          ) : data.length === 0 ? (
                            <Fallbacks
                              severity="notifications"
                              title={`No ${filter} notifications`}
                              description={`Your notification will be listed here`}
                              sx={{ paddingTop: 6 }}
                              size={100}
                            />
                          ) : (
                            <>
                              {data.map((notification, index) => (
                                <NotificationList
                                  key={index}
                                  notification={notification}
                                  onPress={() =>
                                    handleRedirection(notification)
                                  }
                                />
                              ))}
                            </>
                          )}

                          {!loading &&
                            data.length > 0 &&
                            pagination.total > pagination.per_page && (
                              <Button
                                variant="text"
                                color="primary"
                                fullWidth
                                sx={{
                                  position: 'sticky',
                                  bottom: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  py: 1.4,
                                  backgroundColor:
                                    theme.palette.background.paper,
                                  ':hover': {
                                    backgroundColor: theme.palette.grey[50],
                                  },
                                }}
                                onClick={() => handleNotificationViewMore()}
                              >
                                View more
                              </Button>
                            )}
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </>
  );
};

export default NotificationSection;
