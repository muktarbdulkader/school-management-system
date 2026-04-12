import React from 'react';
import DrogaCard from './DrogaCard';
import { Typography } from '@mui/material';

const EvaluationCard = () => {
  return (
    <DrogaCard>
      <Grid container>
        <Grid item xs={12} sm={12} md={6} lg={4} xl={3}>
          <Typography variant="subtitle1" color="text.primary">
            Sales Revenue
          </Typography>
          <Typography variant="subtitle2" color="text.primary">
            Sales Revenue
          </Typography>
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

EvaluationCard.propTypes = {};

export default EvaluationCard;
