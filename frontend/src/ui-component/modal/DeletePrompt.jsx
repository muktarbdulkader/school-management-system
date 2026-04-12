import React, { useState } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
  CircularProgress,
  IconButton
} from '@mui/material';

import PropTypes from 'prop-types';
import DialogTypes from '../../data/employee/DialogTypes';
import { Box } from '@mui/system';
import { motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';

const XIcon = motion(IconX);

const DeletePrompt = ({ type, open, title, description, handleClose, onNo, onYes, deleting }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const Icon = DialogTypes.find((types) => types.name == type);

  return (
    <React.Fragment>
      <Dialog  open={open} onClose={handleClose} aria-labelledby="responsive-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingLeft: 2 }}>
            {Icon && Icon.icon}
            <DialogTitle variant="subtitle1" color={theme.palette.text.primary} id="responsive-dialog-title">
              {title}
            </DialogTitle>
          </Box>

          <motion.div
            whileHover={{
              rotate: 90
            }}
            transition={{ duration: 0.3 }}
            style={{ cursor: 'pointer', marginRight: 10 }}
            onClick={handleClose}
          >
            <IconX size="1.2rem" stroke={2} />
          </motion.div>
        </Box>

        <DialogContent>
          <DialogContentText variant="body1">{description}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onNo} color="dark">
            No
          </Button>
          <Button onClick={onYes} color="error">
            {deleting ? <CircularProgress size={16} sx={{ color: theme.palette.error.main }} /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

DeletePrompt.propTypes = {
  type: PropTypes.string,
  open: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  handleClose: PropTypes.func,
  onNo: PropTypes.func,
  onYes: PropTypes.func,
  deleting: PropTypes.bool
};

export default DeletePrompt;
