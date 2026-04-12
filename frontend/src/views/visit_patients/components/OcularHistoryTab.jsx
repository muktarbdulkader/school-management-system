import { Typography, Box } from '@mui/material';

const OcularHistoryTab = ({ visit }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Ocular History
      </Typography>
      <Typography>
        {visit?.ocular_history || 'No ocular history recorded'}
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Previous Eye Surgeries
      </Typography>
      <Typography>
        {visit?.eye_surgeries || 'No previous eye surgeries recorded'}
      </Typography>
    </Box>
  );
};

export default OcularHistoryTab;
