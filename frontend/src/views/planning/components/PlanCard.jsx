import React from 'react';
import 'quill/dist/quill.snow.css';
import { Box, Grid, Paper, Typography, useTheme } from '@mui/material';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { getStatusColor, MeasuringUnitConverter, PeriodNaming } from 'utils/function';
import DrogaCard from 'ui-component/cards/DrogaCard';
import hasPermission from 'utils/auth/hasPermission';
import PlanObjectiveInitiative from './PlanObjectiveInitiative';
import PropTypes from 'prop-types';

const PlanCard = ({
  plan,
  onPress,
  onEdit,
  onDelete,
  sx,
  editInitiative,
  hideOptions,
  risk,
}) => {
  const theme = useTheme();

  return (
    <DrogaCard sx={{ ...sx }}>
      <div onClick={onPress} style={{ cursor: 'pointer' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body1">KPI Name</Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{ textTransform: 'capitalize' }}
                color={getStatusColor(plan?.status)}
              >
                {plan?.status}
              </Typography>
            </Box>
            {!hideOptions && (onDelete || onEdit) && (
              <DotMenu
                orientation="vertical"
                onEdit={
                  onEdit && hasPermission('update:kpitracker') ? onEdit : null
                }
                onDelete={hasPermission('delete:kpitracker') && onDelete}
              />
            )}
          </Box>
        </Box>
        <Typography
          variant="h3"
          color={theme.palette.text.primary}
          sx={{ marginTop: 0.6, cursor: 'pointer' }}
        >
          {plan?.kpi?.name}
        </Typography>

        <Grid container sx={{ paddingTop: 2 }}>
          <Grid item xs={6} sx={{ paddingY: 2.4 }}>
            <Box>
              <Typography variant="body1">Perspective Type</Typography>
              <Typography variant="h4">
                {plan?.kpi?.perspective_type?.name}
              </Typography>
            </Box>

            <Box sx={{ paddingTop: 2 }}>
              <Typography variant="body1">Measuring Unit</Typography>
              <Typography variant="h4">
                {plan?.kpi?.measuring_unit?.name}
              </Typography>
            </Box>
          </Grid>

          <Grid
            item
            xs={6}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2,
            }}
          >
            <Typography variant="h2" color="primary">
              {plan?.weight}%
            </Typography>
            <Typography
              variant="subtitle1"
              color={theme.palette.text.primary}
              sx={{ marginTop: 2 }}
            >
              Weight
            </Typography>
          </Grid>
        </Grid>

        <Grid container marginTop={1}>
          <Grid item xs={6}>
            <Box>
              <Typography variant="body1" color={theme.palette.text.primary}>
                Frequency
              </Typography>
              <Typography variant="h4">{plan?.frequency?.name}</Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Paper
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 1.6,
                backgroundColor: theme.palette.grey[50],
              }}
            >
              <Typography
                variant="subtitle1"
                color={theme.palette.text.primary}
              >
                Target
              </Typography>
              <Typography variant="h4">
                {plan?.total_target}
                {MeasuringUnitConverter(plan?.kpi?.measuring_unit?.name)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </div>
      <Grid
        container
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          marginTop: 3,
          borderTop: 0.8,
          borderColor: theme.palette.divider,
          padding: 0.8,
          paddingTop: 2,
        }}
      >
        {plan?.target.map((target, index) => (
          <Grid
            item
            xs={6}
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 1,
              marginTop: 2,
            }}
          >
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                {' '}
                <Typography variant="body2">
                  {PeriodNaming(plan?.frequency?.name)} {index + 1}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                {' '}
                <Box
                  sx={{
                    width: 'fit-content',
                    paddingY: 0.6,
                    paddingX: 1.2,
                    backgroundColor: theme.palette.grey[50],
                    borderRadius: theme.shape.borderRadius,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="h4">
                    {target?.target}
                    {MeasuringUnitConverter(plan?.kpi?.measuring_unit?.name)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        ))}
      </Grid>

      <Grid container sx={{ marginTop: 2 }}>
        <Grid item xs={12}>
          <PlanObjectiveInitiative
            plan_id={plan?.id}
            objective={plan.objective?.name}
            initiative={plan.initiative}
            editInitiative={editInitiative}
            risk={risk}
          />
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

PlanCard.propTypes = {
  plan: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onPress: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  sx: PropTypes.object
};
export default PlanCard;
