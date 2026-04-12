import React from 'react';
import { Avatar, Box, Grid, Typography, useTheme } from '@mui/material';
import { getStatusColor } from 'utils/function';
import { IconArrowRight } from '@tabler/icons-react';
import PropTypes from 'prop-types';

const Comment = ({ profile, name, position, from, to, date_time, user_comment }) => {
  const theme = useTheme();
  return (
    <Grid container p={1}>
      <Grid item xs={2}>
        <Avatar src={profile} sx={{ height: 30, width: 30, marginTop: 0.6 }} />
      </Grid>
      <Grid item xs={10}>
        <Grid container sx={{ display: 'flex', alignItems: 'center' }}>
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" color={theme.palette.text.primary}>
              {name}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color={theme.palette.text.secondary}>
              {position}
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
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
          {date_time && (
            <Typography variant="subtitle2" color={theme.palette.text.secondary}>
              {date_time}
            </Typography>
          )}
        </Box>
        <Box sx={{ marginY: 2 }}>
          {user_comment && (
            <Typography variant="body2" color={theme.palette.text.primary}>
              {user_comment}
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
