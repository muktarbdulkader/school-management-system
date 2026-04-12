import React from 'react';
import { Avatar, Box, Chip, Grid, Typography, useTheme } from '@mui/material';
import { gridSpacing } from 'store/constant';
import { getStatusColor } from 'utils/function';
import PropTypes from 'prop-types';
import DrogaCard from 'ui-component/cards/DrogaCard';

const ApprovalTasks = ({ bigDevice, profile, taskType, name, position, unit, levelOne, levelTwo, createdOn, onPress }) => {
  const theme = useTheme();
  return (
    <DrogaCard
      sx={{
        border: 0,
        marginY: 1.2,
        cursor: 'pointer',
        ':hover': {
          backgroundColor: theme.palette.grey[50],
          transform: 'scale(1.01)',
          border: 0.4,
          borderColor: theme.palette.divider
        },
        transition: 'all 0.2s ease-in-out'
      }}
      onPress={onPress}
    >
      <Grid container sx={{ display: 'flex', alignItems: 'flex-start' }} spacing={gridSpacing}>
        <Grid item xs={12} sm={12} md={4} lg={3} xl={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={profile} sx={{ height: 36, width: 36 }} />
            <Box marginLeft={2}>
              <Typography variant="h4" color={theme.palette.text.primary}>
                {name}
              </Typography>
              <Typography variant="body2" color={theme.palette.text.secondary}>
                {position}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={2} xl={2}>
          <Typography variant="subtitle1" color={theme.palette.text.primary}>
            {unit}
          </Typography>
          {!bigDevice && (
            <Typography variant="subtitle2" color={theme.palette.text.primary}>
              Employee unit
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
          <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip
                label={taskType}
                sx={{
                  backgroundColor: theme.palette.grey[50],
                  textTransform: 'capitalize'
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">{createdOn}</Typography>
              {!bigDevice && (
                <Typography variant="subtitle2" color={theme.palette.text.primary}>
                  Created on
                </Typography>
              )}
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={3} xl={3}>
          <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
              {!bigDevice && (
                <Typography variant="subtitle2">
                  1<sup>st</sup> level
                </Typography>
              )}
              <Chip
                label={levelOne}
                sx={{
                  marginLeft: !bigDevice && 1.4,
                  backgroundColor: theme.palette.grey[50],
                  color: getStatusColor(levelOne),
                  textTransform: 'capitalize'
                }}
              />
            </Grid>

            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
              {levelTwo && (
                <>
                  {!bigDevice && (
                    <Typography variant="subtitle2">
                      2<sup>nd</sup> level
                    </Typography>
                  )}
                  <Chip
                    label={levelTwo}
                    sx={{
                      marginLeft: !bigDevice && 1.4,
                      backgroundColor: theme.palette.grey[50],
                      color: getStatusColor(levelTwo),
                      textTransform: 'capitalize'
                    }}
                  />
                </>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

ApprovalTasks.propTypes = {
  profile: PropTypes.string,
  taskType: PropTypes.string,
  name: PropTypes.string,
  position: PropTypes.string,
  unit: PropTypes.string,
  levelOne: PropTypes.string,
  levelTwo: PropTypes.string,
  createdOn: PropTypes.string,
  onPress: PropTypes.func
};
export default ApprovalTasks;
