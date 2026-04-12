import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Divider,
  useTheme,
  Chip,
  Stack,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  MedicalServices,
  Favorite,
  LocalHospital,
  Healing,
} from '@mui/icons-material';
import { dark } from '@mui/material/styles/createPalette';

const Health = ({ healthData }) => {
  const theme = useTheme();

  if (!healthData) {
    return null;
  }

  // Determine health status based on condition
  const getHealthStatus = () => {
    if (!healthData.condition) return 'excellent';
    if (healthData.condition.toLowerCase().includes('fever')) return 'warning';
    if (healthData.condition.toLowerCase().includes('allergy'))
      return 'caution';
    return 'critical';
  };

  const healthStatus = getHealthStatus();
  const statusColors = {
    excellent: {
      bg: '#e8f5e9',
      text: '#2e7d32',
      icon: <Favorite color="success" />,
    },
    warning: {
      bg: '#fff8e1',
      text: '#ff8f00',
      icon: <Healing color="warning" />,
    },
    caution: {
      bg: '#e3f2fd',
      text: '#1565c0',
      icon: <LocalHospital color="info" />,
    },
    critical: {
      bg: '#ffebee',
      text: '#c62828',
      icon: <MedicalServices color="error" />,
    },
  };

  return (
    <Card
      sx={{
        mb: 3,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Health Status
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center"></Stack>
        </Box>
        <Divider sx={{ mb: 2, borderColor: theme.palette.divider }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              <Box
                component="span"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <MedicalServices fontSize="small" />
                Latest Update
              </Box>
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {new Date(healthData.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              <Box
                component="span"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Healing fontSize="small" />
                Incident Status
              </Box>
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {healthData.incident || 'No incidents reported'}
            </Typography>
          </Paper>

          {healthData.condition && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                gridColumn: { xs: '1 / -1', sm: '1 / -1' },
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                <Box
                  component="span"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <LocalHospital fontSize="small" />
                  Current Condition
                </Box>
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body1" fontWeight="bold" color="primary.main">
                  {healthData.condition}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    healthStatus === 'excellent'
                      ? 100
                      : healthStatus === 'warning'
                        ? 70
                        : 30
                  }
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: statusColors[healthStatus].text,
                    },
                  }}
                />
              </Stack>
            </Paper>
          )}

          {healthData.history && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                gridColumn: { xs: '1 / -1', sm: '1 / -1' },
                borderLeft: `4px solid ${theme.palette.info.main}`,
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                <Box
                  component="span"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <MedicalServices fontSize="small" />
                  Health History / Pre-existing Conditions
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                {healthData.history}
              </Typography>
            </Paper>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default Health;
