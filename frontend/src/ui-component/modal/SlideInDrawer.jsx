import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';

const SlideInDrawer = ({ open, onClose, title, children }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {open && (
        <Box
          onClick={onClose}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1200
          }}
        />
      )}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: open ? 0 : '100%' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: isSmallScreen ? '100%' : '30%',
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[5],
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing(2)
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Typography variant="h4">{title}</Typography>

          <motion.div
            whileHover={{
              rotate: 90
            }}
            transition={{ duration: 0.3 }}
            style={{ cursor: 'pointer', marginRight: 10 }}
            onClick={onClose}
          >
            <IconX size="1.4rem" stroke={2} color={theme.palette.text.disabled} />
          </motion.div>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>{children}</Box>
      </motion.div>
    </>
  );
};

export default SlideInDrawer;
