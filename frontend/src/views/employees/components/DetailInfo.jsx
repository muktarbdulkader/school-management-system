import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

export const DetailInfo = ({ icon, label, info }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', marginY: 2, position: 'relative' }}>
      {icon}
      <Box sx={{ marginLeft: 2, width: '100%' }}>
        <Typography
          variant="subtitle1"
          color={theme.palette.text.primary}
          sx={{
            width: '90%',
            display: '-webkit-box',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.5'
          }}
        >
          {info}
        </Typography>
        <Typography variant="subtitle2">{label}</Typography>
      </Box>
    </Box>
  );
};
