import React from 'react';
import { Skeleton, Box, Typography } from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';

function InfoCardSkeleton({ hideone, hideTotal }) {
  return (
    <DrogaCard display="flex" flexDirection="column" alignItems="center" padding={1}>
      <Typography variant="h4" sx={{ ml: 2 }}>
        <Skeleton width={100} height={34} />
      </Typography>
      <Box display="flex" justifyContent="center" alignItems="center" position="relative" width={'100%'} height={'100%'} mt={2.6}>
        <Skeleton variant="circular" width={236} height={236} />
        {!hideTotal && (
          <Box position="absolute" display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h6">
              <Skeleton width={50} />
            </Typography>
            <Typography variant="h4">
              <Skeleton width={30} />
            </Typography>
          </Box>
        )}
      </Box>

      <Box my={2.4} width="100%" display="flex" justifyContent="space-evenly">
        {hideone
          ? [...Array(2)].map((_, index) => (
              <Box key={index} display="flex" alignItems="center">
                <Skeleton variant="circular" width={10} height={10} />
                <Skeleton width={50} sx={{ ml: 1 }} />
              </Box>
            ))
          : [...Array(3)].map((_, index) => (
              <Box key={index} display="flex" alignItems="center">
                <Skeleton variant="circular" width={10} height={10} />
                <Skeleton width={50} sx={{ ml: 1 }} />
              </Box>
            ))}
      </Box>
    </DrogaCard>
  );
}

export default InfoCardSkeleton;
