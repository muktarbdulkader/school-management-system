import React from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import AnimateButton from 'ui-component/extended/AnimateButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const DrogaButton = ({ title, loading, sx, onPress, icon, type, ...props }) => {
  return (
    <AnimateButton>
      <Button
        type={type ? type : 'button'}
        variant="contained"
        {...props}
        sx={{ borderRadius: 2, padding: 1, px: 2, ...sx }}
        onClick={onPress}
      >
        {loading ? (
          <ActivityIndicator size={16} />
        ) : (
          <>
            {' '}
            {icon} <b>{title}</b>{' '}
          </>
        )}
      </Button>
    </AnimateButton>
  );
};

DrogaButton.propTypes = {
  title: PropTypes.string,
  sx: PropTypes.object,
  onPress: PropTypes.func
};
export default DrogaButton;
