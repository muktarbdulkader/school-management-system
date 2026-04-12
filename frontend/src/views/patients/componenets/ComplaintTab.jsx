import { Typography, Box } from '@mui/material';

const ComplaintTab = ({ patient }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Chief Complaint
      </Typography>
      <Typography>{patient.complaint || 'No complaint recorded'}</Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        History of Present Illness
      </Typography>
      <Typography>
        {patient.illness_history || 'No history of present illness recorded'}
      </Typography>
    </Box>
  );
};

export default ComplaintTab;
