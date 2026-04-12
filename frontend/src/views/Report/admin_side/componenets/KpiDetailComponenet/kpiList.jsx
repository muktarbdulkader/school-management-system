import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';


const KpiList = ({ isLoading }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(selectedItem);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  return (
    <>
      {isLoading ? (
        <SkeletonEarningCard />
      ) : (
        <MainCard border={false} content={false}>
          <Box sx={{ ml: 1 }}>
            <Grid container direction="column">
              <Grid item>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="h3" sx={{ mt: 1.2, color: 'grey.500' }}>
                      KPI List
                    </Typography>
                  </Grid>
             
                </Grid>
              </Grid>
              <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.grey[300], marginY: 3 }} />
              <Grid item sx={{ mb: 0, cursor: 'pointer' }}>
                <Grid container alignItems="center">
                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          borderRightWidth: 15,
                          borderColor: 'rgb(77, 173, 127)',
                          mr: 2,
                          height: '3vh'
                        }}
                      />
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1.2rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          Revenue Growth
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          Not Assigned
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          80%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid container alignItems="center" sx={{ mt:2 }}>
                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          borderRightWidth: 15,
                          borderColor: 'rgb(77, 173, 127)',
                          mr: 2,
                          height: '3vh'
                        }}
                      />
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1.2rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          Employee Turnover Rate
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          Not Assigned
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          80%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid container alignItems="center" sx={{ mt: 2}}>
                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          borderRightWidth: 15,
                          borderColor: 'rgb(234,170,103)',
                          mr: 2,
                          height: '3vh'
                        }}
                      />
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1.2rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          Customer Satisfaction
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          Assigned
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          80%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </MainCard>
      )}
    </>
  );
};

KpiList.propTypes = {
  isLoading: PropTypes.bool
};

export default KpiList;
