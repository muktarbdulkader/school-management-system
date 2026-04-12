import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { IconNotification } from '@tabler/icons-react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PropTypes from 'prop-types';

const NotificationCard = ({ name, description, duration }) => {
  const theme = useTheme();
  return (
    <DrogaCard sx={{ display: 'flex', alignItems: 'center', marginY: 1 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.palette.grey[50],
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <IconNotification size="1.2rem" stroke="1.6" />
      </Box>
      <Box sx={{ width: '87%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: 2 }}>
        <Box sx={{ width: '80%' }}>
          <Typography variant="subtitle1" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </Typography>
          <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {description}
          </Typography>
        </Box>

        <Typography variant="subtitle2">{duration}</Typography>
      </Box>
    </DrogaCard>
  );
};

NotificationCard.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  duration: PropTypes.string
};
export default NotificationCard;
