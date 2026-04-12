import React, { useState } from 'react';
import DrogaDataCard from 'ui-component/cards/DrogaDataCard';
import PropTypes from 'prop-types';
import hasPermission from 'utils/auth/hasPermission';
import { IconGauge } from '@tabler/icons-react';
import { Box, Grid, Paper, Typography, useTheme } from '@mui/material';
import { DotMenu } from 'ui-component/menu/DotMenu';

const CardView = ({ data, onEdit, onDelete }) => {
  const theme = useTheme();

  const [selectedId, setSelectedId] = useState(null);

  const handleViewDescription = (id) => {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
  };

  return (
    <React.Fragment>
      {data.map((kpi, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={index}>
          <DrogaDataCard sx={{ paddingX: 2, paddingY: 1 }} onPress={() => handleViewDescription(kpi.id)}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2.4 }}>
              <IconGauge size="1.8rem" stroke={1.4} />{' '}
              <DotMenu
                orientation="horizontal"
                onEdit={hasPermission('update:kpi') ? () => onEdit(kpi) : null}
                onDelete={hasPermission('delete:kpi') ? () => onDelete(kpi) : null}
              />
            </Box>
            <Box sx={{ marginBottom: 1 }}>
              <Typography variant="h4" color={theme.palette.text.primary}>
                {kpi?.name}
              </Typography>
              <Typography variant="subtitle1" color={theme.palette.text.secondary}>
                {kpi?.perspective_type?.name}
              </Typography>
            </Box>

            <Box sx={{ marginBottom: 1 }}>
              <Typography variant="subtitle1" color={theme.palette.text.primary}>
                {kpi?.metric_type}
              </Typography>
              <Typography variant="body2" color={theme.palette.text.secondary}>
                {kpi?.measuring_unit?.name}
              </Typography>
            </Box>

            {selectedId === kpi.id && (
              <Paper
                sx={{
                  backgroundColor: theme.palette.primary.light,
                  padding: 1.6,
                  marginY: 0.6
                }}
              >
                <Box>
                  <Typography variant="h5" color={theme.palette.text.primary}>
                    Variation
                  </Typography>
                  <Typography variant="body2" color={theme.palette.text.primary} marginTop={0.4}>
                    {kpi?.variation_category}
                  </Typography>
                </Box>

                <Box mt={2}>
                  <Typography variant="h5" color={theme.palette.text.primary}>
                    Calculation Type
                  </Typography>
                  <Typography variant="body2" color={theme.palette.text.primary} marginTop={0.4}>
                    {kpi?.calculation_type}
                  </Typography>
                </Box>

                {kpi?.description && (
                  <Box sx={{ marginTop: 2 }}>
                    <Typography variant="h5" color={theme.palette.text.primary}>
                      Description
                    </Typography>
                    <Typography variant="body2" color={theme.palette.text.primary} marginTop={0.4}>
                      {kpi?.description}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
          </DrogaDataCard>
        </Grid>
      ))}
    </React.Fragment>
  );
};

CardView.propTypes = {
  data: PropTypes.array
};
export default CardView;
