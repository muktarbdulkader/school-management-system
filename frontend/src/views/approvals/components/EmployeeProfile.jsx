import { Box, Typography, useTheme } from '@mui/material';
import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PropTypes from 'prop-types';

const EmployeeProfile = ({ name, position }) => {
  const theme = useTheme();
  return (
    <Box>
      <Typography variant="subtitle1" color={theme.palette.text.primary}>
        Employee
      </Typography>
      {name && (
        <DrogaCard sx={{ p: 1.4, backgroundColor: theme.palette.background.default }}>
          <Typography variant="h4" color={theme.palette.text.primary}>
            {name}
          </Typography>
          <Typography variant="body2" color={theme.palette.text.primary}>
            {position}
          </Typography>
        </DrogaCard>
      )}
    </Box>
  );
};

EmployeeProfile.propTypes = {
  name: PropTypes.string,
  position: PropTypes.string
};

export default EmployeeProfile;

{
  /* <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 3 }}>
                        <Box sx={{ width: '14%', marginTop: 0.8 }}>
                          <Avatar sx={{ width: 32, height: 32 }} src={image} alt={username} />
                        </Box>
  
                        <Box sx={{ width: '86%' }}>
                          <Typography variant="subtitle1" color={theme.palette.text.primary}>
                            {username}
                          </Typography>
                          <Typography variant="subtitle2">{position}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <TaskProgress numberOfSteps={step} status={status} />
  
                            <Typography variant="subtitle2">{date}</Typography>
                          </Box>
                        </Box>
                      </Box> */
}
