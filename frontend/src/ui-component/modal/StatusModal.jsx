import React from 'react';
import { Dialog, DialogContent, IconButton, Typography, Box } from '@mui/material';
import { IconCircleCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { motion } from 'framer-motion';

const StatusModal = ({ open, status, title, message, onClose }) => {
  // Determine icon and color based on status
  const isSuccess = status === 'success';
  const IconComponent = isSuccess ? IconCircleCheck : IconAlertCircle;
  const iconColor = isSuccess ? 'green' : 'red';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          padding: 3,
          position: 'relative',
          maxWidth: 400,
          textAlign: 'center',
          overflow: 'hidden'
        }
      }}
    >
      {/* Close Button in Top Right Corner */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8
        }}
      >
        <IconX />
      </IconButton>

      {/* Animated Icon */}
      <DialogContent>
        <Box
          component={motion.div}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
          sx={{
            color: iconColor,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2
          }}
        >
          <IconComponent size={60} />
        </Box>

        {/* Message */}
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>

        <div style={{ lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: message }} />
      </DialogContent>
    </Dialog>
  );
};

export default StatusModal;
