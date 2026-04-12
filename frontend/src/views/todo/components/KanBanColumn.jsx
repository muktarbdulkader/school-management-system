import { Box, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';

export const KanBanColumn = ({ column, no_of_tasks, children, onAddTask }) => {
  const theme = useTheme();
  const smallDevice = useMediaQuery(theme.breakpoints.down('md'));
  return (
    <DrogaCard
      sx={{
        backgroundColor: column?.primary_color + '100',
        paddingX: 1.6,
        minWidth: { xs: '95%', md: '26%' },
        border: smallDevice ? 0 : 0.2,
        borderColor: column?.primary_color
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: 10,
              padding: 1.6,
              backgroundColor: column?.primary_color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="h5" color={'white'}>
              {no_of_tasks}
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ color: theme.palette.text.primary, marginLeft: 1.4, textTransform: 'capitalize' }}>
            {column?.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {column?.name === 'pending' && (
            <IconButton
              sx={{
                backgroundColor: theme.palette.primary.main,
                transition: 'all 0.1s ease-in-out',
                ':hover': { backgroundColor: theme.palette.primary.dark, transform: 'scale(1.1)' }
              }}
              onClick={onAddTask}
            >
              <IconPlus size="1rem" stroke="2" color="white" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ marginTop: 3 }}>{children}</Box>
    </DrogaCard>
  );
};
