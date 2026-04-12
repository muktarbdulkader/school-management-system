import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DrogaButton from 'ui-component/buttons/DrogaButton';

export default function SuccessModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="success-modal"
      aria-describedby="feedback-success-message"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'white',
          p: 4,
          borderRadius: 2,
          boxShadow: 24,
          textAlign: 'center',
          width: 350,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 50, color: '#2563EB', mb: 2 }} />
        <Typography variant="h3" fontWeight="bold">
          Thank you for your feedback!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Your insights help us improve our educational services.
        </Typography>
        <DrogaButton
          title="Close"
          variant="contained"
          sx={{ mt: 3, bgcolor: '#2563EB' }}
          onPress={onClose}
        >
          Close
        </DrogaButton>
      </Box>
    </Modal>
  );
}
