import React from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import AnimateButton from 'ui-component/extended/AnimateButton';
import { IconPlus } from '@tabler/icons-react';

const AddButton = ({ title, sx, disable, onPress }) => {
  return (
    <AnimateButton>
      <Button variant="contained" sx={{ borderRadius: 2, padding: 1, px: 2, ...sx }} onClick={onPress} disabled={disable}>
        <IconPlus stroke={1.4} size="1.4rem" style={{ marginRight: 4 }} /> <b>{title}</b>
      </Button>
    </AnimateButton>
  );
};

AddButton.propTypes = {
  title: PropTypes.string,
  sx: PropTypes.object,
  onPress: PropTypes.func
};
export default AddButton;
