import { Card, CardContent, Typography, Box, Grid, Chip } from '@mui/material';

export function CurrentSemesterInfo({ data }) {
  const currentTerm = data?.current_term || {};

  // Format date to display as "Sep 9, 2025"
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate weeks remaining
  const calculateWeeksRemaining = () => {
    if (!currentTerm.end_date) return 'N/A';

    try {
      const endDate = new Date(currentTerm.end_date);
      const today = new Date();

      // Calculate difference in milliseconds
      const diffTime = endDate.getTime() - today.getTime();

      // Convert to weeks (rounded up)
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

      return diffWeeks > 0 ? `${diffWeeks} weeks` : 'Term ended';
    } catch (error) {
      return 'N/A';
    }
  };

  // Get semester display name
  const getSemesterDisplayName = () => {
    if (!currentTerm.name && !currentTerm.academic_year) return 'N/A';
    return `${currentTerm.name || ''} ${currentTerm.academic_year || ''}`.trim();
  };

  // Determine status text and color
  const getStatusInfo = () => {
    const weeksRemaining = calculateWeeksRemaining();

    if (weeksRemaining === 'Term ended') {
      return { text: 'Completed', color: 'default' };
    } else if (currentTerm.is_current) {
      return { text: 'Active', color: 'success' };
    } else {
      return { text: 'Upcoming', color: 'warning' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" fontWeight="600" gutterBottom>
          Current Term Info
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontWeight="500"
                gutterBottom
              >
                Term
              </Typography>
              <Typography variant="body1" fontWeight="600">
                {getSemesterDisplayName()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontWeight="500"
                gutterBottom
              >
                Start Date
              </Typography>
              <Typography variant="body1" fontWeight="600">
                {formatDate(currentTerm.start_date)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontWeight="500"
                gutterBottom
              >
                End Date
              </Typography>
              <Typography variant="body1" fontWeight="600">
                {formatDate(currentTerm.end_date)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontWeight="500"
                gutterBottom
              >
                Time Remaining
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" fontWeight="600">
                  {calculateWeeksRemaining()}
                </Typography>
                <Chip
                  label={statusInfo.text}
                  size="small"
                  color={statusInfo.color}
                  sx={{ fontSize: '0.75rem' }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
