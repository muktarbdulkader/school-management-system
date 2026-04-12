import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { IconArrowsDiagonal } from '@tabler/icons-react';
import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const DataCard = ({ isLoading, value, icon, label, isTotal, primary_color }) => {
  const theme = useTheme();
  return (
    <DrogaCard sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size={20} />
        </Box>
      ) : (
        <React.Fragment>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton
              sx={{
                backgroundColor: primary_color,
                padding: 1,
                ':hover': { backgroundColor: primary_color }
              }}
            >
              {icon}
            </IconButton>

            <Box sx={{ marginLeft: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" color={primary_color || 'text.primary'}>
                  {value}
                </Typography>
                {label && (
                  <Typography variant="subtitle1" color={primary_color || 'text.primary'} sx={{ marginLeft: 0.6 }}>
                    {label}
                  </Typography>
                )}
              </Box>

              {isTotal && (
                <Typography variant="subtitle1" color={theme.palette.text.primary} sx={{ marginLeft: 0.4 }}>
                  Total
                </Typography>
              )}
            </Box>
          </Box>

          <IconArrowsDiagonal size="1.4rem" stroke="1.8" color="#ccc" />
        </React.Fragment>
      )}
    </DrogaCard>
  );
};

export default DataCard;
