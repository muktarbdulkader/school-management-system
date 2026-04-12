import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { Box } from '@mui/system';
import { motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const DrogaFormModal = ({
  open,
  title,
  handleClose,
  children,
  onCancel,
  onSubmit,
  submitting,
  sx,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <React.Fragment>
      <Dialog
        component="form"
        onSubmit={onSubmit}
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
        sx={{ ...sx }}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '600px',
            borderRadius: 2,
            boxShadow: theme.shadows[5],
          },
        }}
      >
        <DrogaCard sx={{ p: 0.6, border: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <DialogTitle
                variant="h3"
                color={theme.palette.text.primary}
                id="responsive-dialog-title"
              >
                {title}
              </DialogTitle>
            </Box>

            <motion.div
              whileHover={{
                rotate: 90,
              }}
              transition={{ duration: 0.3 }}
              style={{ cursor: 'pointer', marginRight: 10 }}
              onClick={handleClose}
            >
              <IconX
                size="1.4rem"
                stroke={2}
                color={theme.palette.text.disabled}
              />
            </motion.div>
          </Box>

          <DialogContent>{children}</DialogContent>
          <DialogActions>
            <Button onClick={onCancel} sx={{ marginRight: 2 }}>
              Cancel
            </Button>
            <DrogaButton
              type="submit"
              title={
                submitting ? (
                  <ActivityIndicator size={16} sx={{ color: 'white' }} />
                ) : (
                  'Submit'
                )
              }
              variant="contained"
              sx={{ paddingX: 5, boxShadow: 0 }}
              disabled={submitting}
            />
          </DialogActions>
        </DrogaCard>
      </Dialog>
    </React.Fragment>
  );
};

DrogaFormModal.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  children: PropTypes.node,
  handleClose: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  sx: PropTypes.object,
};

export default DrogaFormModal;
