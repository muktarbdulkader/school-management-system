import { motion } from 'framer-motion';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
  Zoom,
} from '@mui/material';
import  { forwardRef } from 'react';
import { IconX } from '@tabler/icons-react';
import PropTypes from 'prop-types';

const XIcon = motion(IconX);

const Transition = forwardRef((props, ref) => (
  <Zoom direction="center" ref={ref} {...props} />
));

const CenteredModal = ({
  title,
  subtitle,
  open,
  children,
  handleClose,
  sx,
}) => (
  <Dialog open={open} onClose={handleClose} TransitionComponent={Transition}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pr: 1,
        ...sx,
      }}
    >
      <DialogTitle variant="h4" sx={{ textTransform: 'capitalize' }}>
        {title}
        <Typography variant="body2" sx={{ textTransform: 'lowercase' }}>
          {subtitle}
        </Typography>
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

    <Divider sx={{ marginY: 0.6 }} />
    <DialogContent>{children}</DialogContent>
  </Dialog>
);
CenteredModal.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  open: PropTypes.bool.isRequired,
  children: PropTypes.node,
  handleClose: PropTypes.func.isRequired,
  sx: PropTypes.object,
};

export default CenteredModal;
