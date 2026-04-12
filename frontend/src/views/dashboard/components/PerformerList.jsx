import React from 'react';
import { Performer } from './Performer';
import { Grid } from '@mui/material';
import { PerformerUnit } from './PerformerUnit';

const PerformerList = ({ PerformerData, onSelected, selected, type }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sx={{ pt: 2 }}>
        {type === 'units'
          ? PerformerData.map((unit, index) => (
              <PerformerUnit key={index} unit={unit} onPress={() => onSelected(index)} selected={selected === index} />
            ))
          : PerformerData.map((employee, index) => (
              <Performer key={index} employee={employee} onPress={() => onSelected(index)} selected={selected === index} />
            ))}
      </Grid>
    </Grid>
  );
};

export default PerformerList;
