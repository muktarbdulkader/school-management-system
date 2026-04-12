import { Avatar, Grid, Typography } from '@mui/material';
import { IconTrophyFilled } from '@tabler/icons-react';
import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';

export const Performer = ({ employee, onPress, selected }) => (
  <DrogaCard
    sx={{
      my: 1.8,
      py: 1.2,
      border: 0,
      backgroundColor: selected ? '#d8e9ff' : '#f5f9ff',
      ':hover': { backgroundColor: '#d8e9ff' },
      transition: 'all 0.2s ease-out',
      cursor: 'pointer'
    }}
    onPress={onPress}
  >
    <Grid container>
      <Grid item xs={1.6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
        <Typography variant="subtitle1">{employee.position}</Typography>
        <Avatar src={employee?.profile_picture} sx={{ width: '28px', height: '28px' }} />
      </Grid>
      <Grid item xs={8}>
        <Typography variant="subtitle1">{employee.name}</Typography>
        <Typography variant="body1">{employee.job_position}</Typography>
      </Grid>
      <Grid item xs={1.4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {employee.position === '1st' && (
          <IconTrophyFilled
            size="1.6rem"
            stroke="1.8"
            style={{
              color: '#f1c40f'
            }}
          />
        )}
      </Grid>
      <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Typography variant="h4">{employee?.average_performance}%</Typography>
      </Grid>
    </Grid>
  </DrogaCard>
);
