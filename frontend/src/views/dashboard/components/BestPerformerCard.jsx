import React from 'react';
import { CardContent, Typography, Avatar, Box, Stack } from '@mui/material';

const BestPerformerCard = ({ employee }) => {
  return (
    <Box>
      <CardContent>
        <Stack direction="column" alignItems="center" spacing={1} mb={2}>
          <Avatar src={employee.profile_picture} alt={employee.name} sx={{ width: 140, height: 140 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" mt={1}>
              {employee.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employee.job_position}
            </Typography>
          </Box>
        </Stack>
        <Typography variant="h4" color="text.primary" mb={1}>
          Rank: {employee.position}
        </Typography>

        {employee.gender && (
          <Typography variant="body2" color="text.primary" mb={1}>
            Gender: {employee.gender || 'N/A'}
          </Typography>
        )}
        <Typography variant="body2" color="text.primary" mb={1}>
          Unit: {employee.unit}
        </Typography>

        <Typography variant="body2" color="text.primary" mb={1}>
          Average Performance: <strong>{employee.average_performance}</strong>%
        </Typography>
      </CardContent>
    </Box>
  );
};

export default BestPerformerCard;
