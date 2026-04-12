import PropTypes from 'prop-types';
import { Box, useTheme } from '@mui/material';

import ViewEmployeeEOD from '..';

const EodReportTabs = ({ eodReport, isLoading, onRefresh }) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', borderColor: theme.palette.divider }}>
      <Box sx={{ p: 0 }}>
        <ViewEmployeeEOD
          eodReport={eodReport}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </Box>
    </Box>
  );
};

EodReportTabs.propTypes = {
  eodReport: PropTypes.array,
  isLoading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

export default EodReportTabs;
