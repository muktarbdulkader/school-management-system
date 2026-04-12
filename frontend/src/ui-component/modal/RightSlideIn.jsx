import React from 'react';
import { Box, Dialog, DialogContent, DialogTitle, Divider, Slide } from '@mui/material';
import { motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';

const XIcon = motion(IconX);

const Transition = React.forwardRef((props, ref) => <Slide direction="left" ref={ref} {...props} />);

const RightSlideIn = ({ title, open, children, handleClose }) => (
  <Dialog
    open={open}
    onClose={handleClose}
    fullScreen
    TransitionComponent={Transition}
    PaperProps={{
      sx: {
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: {
          xs: '90%',
          sm: '75%',
          md: '50%',
          lg: '30%'
        },
        maxWidth: {
          xs: '100%',
          lg: '100%'
        }
      }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
      <DialogTitle variant="h4" sx={{ textTransform: 'capitalize' }}>
        {title}
      </DialogTitle>

      <motion.div
        whileHover={{ rotate: 90 }}
        transition={{ duration: 0.3 }}
        style={{ cursor: 'pointer', marginRight: 10 }}
        onClick={handleClose}
      >
        <XIcon size="1.2rem" stroke={2} />
      </motion.div>
    </Box>

    <Divider sx={{ marginTop: 0.6 }} />
    <DialogContent sx={{ p: 0, position: 'relative' }}>{children}</DialogContent>
  </Dialog>
);

export default RightSlideIn;
