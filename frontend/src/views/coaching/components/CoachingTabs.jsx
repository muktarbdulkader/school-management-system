import PropTypes from 'prop-types';
import { Box, useTheme } from '@mui/material';
import CoachingTable from '../view';

const CoachingTabs = ({ feedBack, isLoading, onRefresh }) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', borderColor: theme.palette.divider }}>
      <Box sx={{ p: 0 }}>
        <CoachingTable
          feedBack={feedBack}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </Box>
    </Box>
  );
};

CoachingTabs.propTypes = {
  feedBack: PropTypes.array,
  isLoading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

export default CoachingTabs;
