import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
  CircularProgress,
  Chip,
} from '@mui/material';

export function AcademicSummary({ data }) {
  // Extract data from props with fallbacks
  const academicSummary = data?.academic_summary || {};
  const currentTerm = data?.current_term || {};

  // Calculate progress percentage for visualization
  const progressPercentage =
    academicSummary.overall_progress === 'N/A'
      ? 0
      : parseInt(academicSummary.overall_progress);

  // Calculate completion percentage
  const completionPercentage =
    academicSummary.completion_rate === 'N/A'
      ? 0
      : parseInt(academicSummary.completion_rate);

  // Format academic year display
  const academicYearDisplay = currentTerm.academic_year
    ? `Academic Year ${currentTerm.academic_year}`
    : 'Academic year not available';

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" fontWeight="600" gutterBottom>
          Academic Summary
        </Typography>

        <Grid container spacing={4} mt={2}>
          {/* Current GPA */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontWeight="500"
              >
                Average Grade
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" component="span" fontWeight="bold">
                  {academicSummary.average_grade || 'N/A'}
                </Typography>
                {academicSummary.average_grade !== 'N/A' && (
                  <Chip
                    label="Current Term"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {academicYearDisplay}
              </Typography>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}
              >
                <Typography variant="body2">Completion Rate</Typography>
                <Typography variant="body2" fontWeight="600">
                  {academicSummary.completion_rate || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Overall Progress */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontWeight="500"
              >
                Overall Progress
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={progressPercentage}
                    size={96}
                    thickness={4}
                    sx={{
                      color:
                        progressPercentage > 70
                          ? 'success.main'
                          : progressPercentage > 40
                            ? 'warning.main'
                            : 'error.main',
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h5" component="div" fontWeight="bold">
                      {academicSummary.overall_progress || '0%'}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    fontSize: '0.75rem',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                      }}
                    />
                    <Typography variant="caption">
                      Completed {completionPercentage}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'grey.300',
                      }}
                    />
                    <Typography variant="caption">
                      Remaining {100 - completionPercentage}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

        </Grid>
      </CardContent>
    </Card>
  );
}
