import React from 'react';
import { Box } from '@mui/material';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import PropTypes from 'prop-types';

const ApprovalActionButtons = ({ onAmend, onApprove, level }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {onAmend && (
        <DrogaButton
          title={level === 'first' ? 'Restart' : 'Amend'}
          variant="outlined"
          color="info"
          onPress={onAmend}
          sx={{ px: 4, boxShadow: 0 }}
        />
      )}

      {onApprove && (
        <DrogaButton title={'Approve'} variant="contained" color="primary" onPress={onApprove} sx={{ ml: 2, px: 8, boxShadow: 0 }} />
      )}
    </Box>
  );
};

ApprovalActionButtons.propTypes = {
  onAmend: PropTypes.func,
  onApprove: PropTypes.func,
  level: PropTypes.string
};

export default ApprovalActionButtons;
