import React from 'react';
import { CardContent, Typography, Avatar, Box, Stack } from '@mui/material';
import { IconBuilding } from '@tabler/icons-react';

const BestPerformerUnits = ({ unit }) => {
  return (
    <Box>
      <CardContent sx={{ alignItems: 'center' }}>
        <Stack direction="column" alignItems="center" spacing={1} mb={2}>
          <Avatar sx={{ width: 140, height: 140 }}>
            <IconBuilding size="3rem" />
          </Avatar>

          <Box>
            <Typography variant="h4" fontWeight="bold" mt={1}>
              {unit.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {unit.type}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h4" color="text.primary" mb={1}>
            Rank: {unit.position}
          </Typography>

          {unit.parent_unit && (
            <Typography variant="body2" color="text.primary" mb={1}>
              Unit: {unit.parent_unit}
            </Typography>
          )}
          <Typography variant="body2" color="text.primary" mb={1}>
            Unit Type: {unit.type}
          </Typography>

          <Typography variant="body2" color="text.primary" mb={1}>
            Average Performance: <strong>{unit.average_performance}</strong>%
          </Typography>
        </Box>
      </CardContent>
    </Box>
  );
};

export default BestPerformerUnits;
