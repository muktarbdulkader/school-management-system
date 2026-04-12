import React from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton } from '@mui/material';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';

const IconMenu = ({ onView, onEdit, onDelete, onChangePassword }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton onClick={onView}>
        <IconEye size={18} />
      </IconButton>
      <IconButton onClick={onEdit}>
        <IconPencil size={18} />
      </IconButton>
      <IconButton onClick={onDelete}>
        <IconTrash size={18} color="red" />
      </IconButton>
      <IconButton onClick={onChangePassword}>
        <IconTrash size={18} color="red" />
      </IconButton>
    </Box>
  );
};
IconMenu.propTypes = {
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onChangePassword: PropTypes.func.isRequired
};

export default IconMenu;
