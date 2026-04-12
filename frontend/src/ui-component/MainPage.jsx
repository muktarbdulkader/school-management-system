import React from 'react';
import PropTypes from 'prop-types';
import { Box, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

const PageContainer = ({
  back,
  title,
  rightOption,
  searchField,
  children,
  sx,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  return (
    <Grid container>
      <Grid
        item
        xs={12}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 2,
          paddingX: 1.4,
          paddingTop: 2,
          // bgcolor: '#f5f5f5',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {back && (
            <IconButton onClick={() => navigate(-1)}>
              <IconArrowLeft size={20} />{' '}
            </IconButton>
          )}

          <Typography
            variant="h3"
            sx={{ marginX: 2, color: theme.palette.text.primary }}
          >
            {title ? title : ''}
          </Typography>

          <Box>{searchField}</Box>
        </Box>

        <Box>{rightOption}</Box>
      </Grid>

      <Grid container sx={{ ml: { xs: 1, sm: 1, md: 2, lg: 2, xl: 2 } }} mt={1}>
        <Grid
          item
          xs={12}
          sx={{
            paddingRight: { xs: '0px', sm: '10px', md: '20px' },
            paddingBottom: { xs: '0px', sm: '20px', md: '20px' },
          }}
        >
          {children}
        </Grid>
      </Grid>
    </Grid>
  );
};

PageContainer.propTypes = {
  back: PropTypes.bool,
  title: PropTypes.string.isRequired,
  rightOption: PropTypes.node,
  children: PropTypes.node,
};

export default PageContainer;
