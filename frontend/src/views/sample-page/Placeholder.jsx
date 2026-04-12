import React from 'react';
import { Grid, Typography } from '@mui/material';
import Development from 'assets/images/developer.svg';

const PagePlaceholder = () => {
  return (
    <Grid container>
      <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <img src={Development} alt="Page under developer" style={{ width: 300, height: 300 }} />

        <Typography variant="h3" color="primary" marginTop={2}>
          To be implemented
        </Typography>
        <Typography variant="subtitle1" marginTop={1}>
          This Page is in the queue of page to be developed
        </Typography>
      </Grid>
    </Grid>
  );
};

export default PagePlaceholder;
