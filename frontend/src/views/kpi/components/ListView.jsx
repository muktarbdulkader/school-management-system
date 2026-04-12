import React, { useState } from 'react';
import DrogaDataCard from 'ui-component/cards/DrogaDataCard';
import PropTypes from 'prop-types';
import { IconGauge } from '@tabler/icons-react';
import { Box, Grid, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
import { DotMenu } from 'ui-component/menu/DotMenu';
import hasPermission from 'utils/auth/hasPermission';

const ListView = ({ data, onEdit, onDelete }) => {
  const theme = useTheme();
  const downMd = useMediaQuery(theme.breakpoints.down('md'));

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
        <DrogaDataCard key={index} sx={{ padding: 3, marginY: 1.6 }} onPress={() => handleViewDescription(kpi.id)}>
          <Grid container justifyContent={'space-between'} alignItems={'center'}>
            <Grid item xs={12} sm={12} md={1} lg={1} xl={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <IconGauge size="1.8rem" stroke={1.4} />{' '}
              {downMd && (
                <DotMenu
                  orientation="horizontal"
                  onEdit={hasPermission('update:kpi') ? () => onEdit(kpi) : null}
                  onDelete={hasPermission('delete:kpi') ? () => onDelete(kpi) : null}
                />
              )}
            </Grid>

            <Grid item xs={12} sm={12} md={5} lg={5} xl={5}>
              <Typography variant="h4" color={theme.palette.text.primary}>
                {kpi?.name}
              </Typography>
              <Typography variant="subtitle1" color={theme.palette.text.secondary}>
                {kpi?.perspective_type?.name}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
              <Typography variant="subtitle1" color={theme.palette.text.primary}>
                {kpi?.metric_type}
              </Typography>
              <Typography variant="body2" color={theme.palette.text.secondary}>
                {kpi?.measuring_unit?.name}
              </Typography>
            </Grid>

            {!downMd && (
              <Grid item xs={12} sm={12} md={1} lg={1} xl={1}>
                <DotMenu
                  orientation="horizontal"
                  onEdit={hasPermission('update:kpi') ? () => onEdit(kpi) : null}
                  onDelete={hasPermission('delete:kpi') ? () => onDelete(kpi) : null}
                />
              </Grid>
            )}
          </Grid>

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
      ))}
    </React.Fragment>
  );
};

ListView.propTypes = {
  data: PropTypes.array,
  options: PropTypes.node
};
export default ListView;
