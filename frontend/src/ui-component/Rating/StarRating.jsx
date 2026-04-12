import React from 'react';
import { Box } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';

const StarRating = ({ value, max = 5, size = 'medium' }) => {
  const numericValue = Number(value || 0);

  const filledStars = Math.round((numericValue / max) * 5);

  return (
    <Box display="flex" alignItems="center">
      {[...Array(filledStars)].map((_, i) => (
        <Star key={`filled-${i}`} color="primary" fontSize={size} />
      ))}

      {[...Array(5 - filledStars)].map((_, i) => (
        <StarBorder key={`empty-${i}`} color="primary" fontSize={size} />
      ))}

      <Box ml={1}>({value})</Box>
    </Box>
  );
};

export default StarRating;
