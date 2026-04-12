import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
import AnimatedCheckIcon from 'ui-component/iconify/CheckIcon';
import { useNavigate } from 'react-router-dom';

const EmailSendingConfirmation = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          p: 6,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <motion.div
          whileHover={{
            rotate: 90,
            scale: 1.2
          }}
          whileTap={{
            scale: 0.9
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          <IconX size="1.6rem" stroke={2} color={theme.palette.text.secondary} />
        </motion.div>

        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20
          }}
        >
          <AnimatedCheckIcon />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.5,
            ease: 'easeOut'
          }}
        >
          <Typography variant="subtitle1" textAlign="center" mt={3}>
            The link to reset the password is sent to an email address provided
          </Typography>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default EmailSendingConfirmation;
