import React from 'react';
import { Avatar, Box, Grid, Typography, useTheme } from '@mui/material';
import { getStatusColor } from 'utils/function';
import { IconArrowRight } from '@tabler/icons-react';
import PropTypes from 'prop-types';

const Comment = ({ profile, name, position, from, to, date_time, user_comment }) => {
  const theme = useTheme();
  return (
    <Grid container p={1}>
      <Grid item xs={1.4}>
        <Avatar src={profile} sx={{ height: 30, width: 30, marginTop: 0.6 }} />
      </Grid>
      <Grid item xs={10.6}>
        <Grid container sx={{ display: 'flex', alignItems: 'center' }}>
          {name && (
            <Grid item xs={12}>
              <Typography variant="h4" color={theme.palette.text.primary}>
                {name}
              </Typography>
            </Grid>
          )}
          {position && (
            <Grid item xs={12}>
              <Typography variant="body2" color={theme.palette.text.secondary}>
                {position}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {from && (
            <Typography
              variant="subtitle2"
              sx={{
                color: from && getStatusColor(from),
                textTransform: 'capitalize',
                fontWeight: 'medium'
              }}
            >
              {from}
            </Typography>
          )}

          {to && (
            <>
              <IconArrowRight size="1rem" stroke="1.4" />

              <Typography
                variant="subtitle2"
                sx={{
                  color: to && getStatusColor(to),
                  textTransform: 'capitalize',
                  fontWeight: 'medium'
                }}
              >
                {to}
              </Typography>
            </>
          )}
        </Box>

        <Box sx={{ marginY: 2 }}>
          {user_comment && (
            <Typography variant="body2" color={theme.palette.text.primary}>
              {user_comment}
            </Typography>
          )}

          {date_time && (
            <Typography variant="subtitle2" color={theme.palette.text.secondary} sx={{ marginTop: 1.2 }}>
              {date_time}
            </Typography>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

Comment.propTypes = {
  profile: PropTypes.string,
  position: PropTypes.string,
  from: PropTypes.string,
  to: PropTypes.string,
  name: PropTypes.string,
  date_time: PropTypes.string,
  user_comment: PropTypes.string
};

export default Comment;
