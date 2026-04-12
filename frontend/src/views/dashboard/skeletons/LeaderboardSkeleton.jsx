import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

const LeaderboardSkeleton = () => {
  return (
    <Stack spacing={2} sx={{ pt: 2 }}>
      {[...Array(6)].map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: 1.4,
            borderRadius: 2,
         
          }}
        >
          {/* Rank Skeleton */}
          <Skeleton variant="text" width={30} height={30} />

          {/* Avatar Skeleton */}
          <Skeleton variant="circular" width={40} height={40} sx={{ mx: 2 }} />

          {/* Name and Title Skeleton */}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={15} />
          </Box>

          {/* Trophy and Percentage Skeleton */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={40} height={20} sx={{ ml: 1 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

export default LeaderboardSkeleton;
