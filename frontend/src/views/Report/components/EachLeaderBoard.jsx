import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Badge, Grid, Typography } from '@mui/material';
import { IconStarFilled, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { motion } from 'framer-motion';

const EachLeaderBoard = ({ employee, rank }) => {
  return (
    <Grid container sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
      <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
        <Grid container spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
          <Grid item xs={12} sm={12} md={0.6} lg={0.6} xl={0.6}>
            <Typography variant="body1" fontWeight="bold" mr={2}>
              {rank}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={12} md={1.2} lg={1.2} xl={1.2}>
            <Badge
              overlap="circular"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              badgeContent={
                rank < 4 && (
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 1,
                      ease: 'easeInOut',
                      repeat: Infinity
                    }}
                  >
                    <IconStarFilled size="1.2rem" style={{ color: '#FFA500' }} />
                  </motion.div>
                )
              }
            >
              <Avatar sx={{ width: 40, height: 40 }} src={employee?.user?.profile_image} alt="employee profile" />
            </Badge>
          </Grid>

          <Grid item xs={12} sm={12} md={10} lg={10} xl={10}>
            <Typography variant="body1" fontWeight="bold">
              {employee?.user?.name}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
        {' '}
        <Typography variant="body2" color="textSecondary">
          Tasks completed • <b>{employee.completed_tasks_count} </b> out of <b> {employee.total_tasks_count}</b>
        </Typography>
      </Grid>
      <Grid item xs={12} sm={12} md={2} lg={2} xl={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {employee.changeType === 'up' ? (
          <IconTrendingUp size="1rem" stroke="1.4" style={{ color: 'green' }} />
        ) : (
          <IconTrendingDown size="1rem" stroke="1.4" style={{ color: 'red' }} />
        )}
        <Typography variant="body1" ml={1} color={employee.changeType === 'up' ? 'green' : 'red'} fontWeight="bold">
          {employee.change}
        </Typography>
      </Grid>
    </Grid>
  );
};

EachLeaderBoard.propTypes = {
  employee: PropTypes.object,
  rank: PropTypes.number
};

export default EachLeaderBoard;
