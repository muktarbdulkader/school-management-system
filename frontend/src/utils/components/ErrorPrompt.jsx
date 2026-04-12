import React from 'react';
import { Button, Grid, Typography } from '@mui/material';
import noresult from '../../assets/images/error.svg';
import PropTypes from 'prop-types';

const ErrorPrompt = ({ image, size, title, message, buttontitle, onPress }) => {
  return (
    <Grid container>
      <Grid
        item
        xs={12}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingY: 4,
          borderRadius: 4
        }}
      >
        <img src={noresult} alt="No result found" width={`${size ? size + 'px' : '240px'}`} height={`${size ? size + 'px' : '240px'}`} />
        <Typography variant="h4" marginY={0.5}>
          {title}
        </Typography>
        <Typography variant="subtitle2"> {message} </Typography>
        {buttontitle && (
          <Button variant="contained" color="secondary" onClick={onPress} sx={{ padding: 1, paddingX: 5, marginTop: 4, borderRadius: 20 }}>
            {buttontitle}
          </Button>
        )}
      </Grid>
    </Grid>
  );
};

ErrorPrompt.propTypes = {
  image: PropTypes.string,
  size: PropTypes.number,
  title: PropTypes.string,
  message: PropTypes.string,
  buttontitle: PropTypes.string,
  onPress: PropTypes.func
};

export default ErrorPrompt;
