import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery, useTheme, CircularProgress } from '@mui/material';
import { Box } from '@mui/system';
import { motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import DrogaCard from 'ui-component/cards/DrogaCard';

const DrogaModal = ({ open, title, handleClose, children, onCancel, onSubmit, submitting, sx, containerStyle, hideActionButtons }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <React.Fragment>
      <Dialog fullScreen={fullScreen} open={open} onClose={handleClose} aria-labelledby="dialog-title" sx={{ ...containerStyle }}>
        <DrogaCard sx={{ p: 0, minWidth: { xs: '100%', sm: '100%', md: 500 }, minHeight: 200, border: 0, ...sx }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <DialogTitle variant="h3" color={theme.palette.text.primary} id="responsive-dialog-title">
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
              <IconX size="1.4rem" stroke={2} color={theme.palette.text.disabled} />
            </motion.div>
          </Box>

          <DialogContent>{children}</DialogContent>
          {!hideActionButtons && (
            <DialogActions sx={{ position: 'absolute', bottom: 1, right: 1 }}>
              <Button onClick={onCancel} sx={{ marginRight: 2 }}>
                Cancel
              </Button>
              <DrogaButton
                title={submitting ? <CircularProgress size={16} sx={{ color: theme.palette.error.main }} /> : 'Submit'}
                variant="contained"
                sx={{ paddingX: 5, boxShadow: 0 }}
                onPress={onSubmit}
              />
            </DialogActions>
          )}
        </DrogaCard>
      </Dialog>
    </React.Fragment>
  );
};

DrogaModal.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  children: PropTypes.node,
  handleClose: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  sx: PropTypes.object,
  hideActionButtons: PropTypes.bool
};

export default DrogaModal;
