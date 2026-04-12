import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { gridSpacing } from 'store/constant';
import DrogaCard from 'ui-component/cards/DrogaCard';

const Header = ({ levelTwo }) => {
  const theme = useTheme();
  return (
    <DrogaCard sx={{ border: 0, backgroundColor: theme.palette.grey[50] }}>
      <Grid container sx={{ display: 'flex', alignItems: 'flex-start' }} spacing={gridSpacing}>
        <Grid item xs={12} sm={12} md={4} lg={3} xl={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box marginLeft={2}>
              <Typography variant="subtitle1" color={theme.palette.text.primary}>
                Profile
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={2} xl={2}>
          <Typography variant="subtitle1" color={theme.palette.text.primary}>
            Unit
          </Typography>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
          <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" color={theme.palette.text.primary}>
                Task Type
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="subtitle1" color={theme.palette.text.primary}>
                Task Created on
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={3} xl={3}>
          <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" color={theme.palette.text.primary}>
                Level one
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
              {levelTwo && (
                <Typography variant="subtitle1" color={theme.palette.text.primary}>
                  Level two
                </Typography>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

export default Header;
