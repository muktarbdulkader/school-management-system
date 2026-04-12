import React from 'react';
import { Box, Chip, Grid, Typography, useMediaQuery, useTheme } from '@mui/material';
import { gridSpacing } from 'store/constant';
import { getStatusColor } from 'utils/function';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import DrogaCard from 'ui-component/cards/DrogaCard';
import planImage from '../../../assets/images/plan.png';
import PropTypes from 'prop-types';

const PlanStatusNotice = ({ status, changingStatus, onAccept, onOpenToDiscussion, onEsclate }) => {
  const theme = useTheme();
  const bigDevice = useMediaQuery(theme.breakpoints.up('md'));
  return (
    <DrogaCard sx={{ marginTop: 3.8, mx: 2, backgroundColor: theme.palette.grey[100] }}>
      <Grid container>
        <Grid item xs={12}>
          <Grid container spacing={gridSpacing} sx={{ display: 'flex', alignItems: 'center' }}>
            <Grid
              item
              xs={12}
              sm={12}
              md={8}
              lg={8}
              xl={8}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <Chip
                label={status}
                sx={{
                  textTransform: 'capitalize',
                  color: status && getStatusColor(status),
                  backgroundColor: theme.palette.background.paper
                }}
              />
              <Box sx={{ marginY: 2 }}>
                <Typography variant="h1" color={theme.palette.text.primary} sx={{ marginY: 1.2 }}>
                  Your plan for this year is sent to you
                </Typography>

                <Typography variant="body2" color={theme.palette.text.primary}>
                  Take a look at each plans and take actions accordingly
                </Typography>
              </Box>

              <Grid container spacing={gridSpacing} sx={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                {onAccept && (
                  <Grid item xs={12} sm={4} md={4} lg={3}>
                    <DrogaButton variant="contained" title="Accept" fullWidth onPress={onAccept} disabled={changingStatus} />
                  </Grid>
                )}
                {onOpenToDiscussion && (
                  <Grid item xs={12} sm={6} md={6} lg={4}>
                    <DrogaButton
                      variant="text"
                      title="Open for discussion"
                      fullWidth
                      onPress={onOpenToDiscussion}
                      disabled={changingStatus}
                    />
                  </Grid>
                )}

                {onEsclate && (
                  <Grid item xs={12} sm={4} md={4} lg={2}>
                    <DrogaButton variant="text" title="Esclate" fullWidth onPress={onEsclate} disabled={changingStatus} />
                  </Grid>
                )}
              </Grid>
            </Grid>
            {bigDevice && (
              <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
                <img src={planImage} alt="Plans" style={{ width: '70%', height: '70%' }} />
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

PlanStatusNotice.propTypes = {
  status: PropTypes.string,
  onAccept: PropTypes.func,
  onOpenToDiscussion: PropTypes.func,
  onEsclate: PropTypes.func
};
export default PlanStatusNotice;
