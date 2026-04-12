import React from 'react';
import { Grid, Typography } from '@mui/material';
import { IconTrophyFilled } from '@tabler/icons-react';
import DrogaCard from 'ui-component/cards/DrogaCard';

export const PerformerUnit = ({ unit, onPress, selected }) => (
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
      <Grid item xs={1.2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
        <Typography variant="subtitle1">{unit.position}</Typography>
      </Grid>
      <Grid item xs={8}>
        <Typography variant="subtitle1">{unit.name}</Typography>
      </Grid>
      <Grid item xs={1.4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {unit.position === '1st' && (
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
        <Typography variant="h4">{unit?.average_performance}%</Typography>
      </Grid>
    </Grid>
  </DrogaCard>
);
