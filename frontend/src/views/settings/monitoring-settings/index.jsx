import {
  Stack,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import React, { useEffect } from 'react';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';
import { toast, ToastContainer } from 'react-toastify';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const MonitoringSettings = () => {
  const [settings, setSettings] = React.useState({
    from: '',
    to: '',
  });
  const [backendLabels, setBackendLabels] = React.useState({
    from: 'From',
    to: 'To',
  });
  const [errors, setErrors] = React.useState({
    from: false,
    to: false,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchMonitoringPeriod = async () => {
    try {
      const token = await GetToken();
      const Api = Backend.api + Backend.getMonitoringPeriod;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      const response = await fetch(Api, { headers });
      const data = await response.json();

      if (data.success) {
        setSettings({
          from: data.data.range.from.toString(),
          to: data.data.range.to.toString(),
        });
        // Set backend labels if available in response
        if (data.data.range.labels) {
          setBackendLabels({
            from: data.data.range.labels.from || 'From',
            to: data.data.range.labels.to || 'To',
          });
        }
      } else {
        toast.error('Failed to load monitoring period');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringPeriod();
  }, []);

  const validateInput = (name, value) => {
    const numValue = Number(value);

    if (name === 'from') {
      return numValue > 0;
    } else if (name === 'to') {
      // Allow to be equal to from when from is 1
      if (Number(settings.from) === 1) {
        return numValue >= 1 && numValue <= 31;
      }
      return numValue > 0 && numValue <= 31 && numValue > Number(settings.from);
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isValid = validateInput(name, value);

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: !isValid,
    }));
  };

  const handleSaveChanges = async () => {
    const isFromValid = validateInput('from', settings.from);
    const isToValid = validateInput('to', settings.to);

    setErrors({
      from: !isFromValid,
      to: !isToValid,
    });

    if (!isFromValid || !isToValid) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await GetToken();

      const Api = Backend.api + Backend.setMonitoringPeriod;
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const data = {
        range_from: Number(settings.from),
        range_to: Number(settings.to),
      };

      const response = await fetch(Api, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result?.data?.message || 'Settings saved successfully');
        fetchMonitoringPeriod();
      } else {
        toast.error(result.data?.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <ActivityIndicator size={40} />
      </Box>
    );
  }

  return (
    <Stack sx={{ width: '100%' }} spacing={4}>
      <PageContainer title="Monitoring Settings">
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'background.paper',
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            Set Monitoring Period Range
          </Typography>

          <Grid container spacing={2} alignItems="center" mt={1}>
            {/* From Field */}
            <Grid item xs={12} sm={5} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="body1"
                  sx={{ minWidth: 80, fontWeight: 500 }}
                >
                  {backendLabels.from}:
                </Typography>
                <TextField
                  fullWidth
                  name="from"
                  type="number"
                  value={settings.from}
                  onChange={handleChange}
                  variant="outlined"
                  error={errors.from}
                  helperText={errors.from ? 'Must be greater than 0' : ''}
                  inputProps={{ min: 1 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'primary.light',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* To Field */}
            <Grid item xs={12} sm={5} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="body1"
                  sx={{ minWidth: 80, fontWeight: 500 }}
                >
                  {backendLabels.to}:
                </Typography>
                <TextField
                  fullWidth
                  name="to"
                  type="number"
                  value={settings.to}
                  onChange={handleChange}
                  variant="outlined"
                  error={errors.to}
                  helperText={
                    errors.to ? 'Must be between From value and 30' : ''
                  }
                  inputProps={{ min: 1, max: 29 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'primary.light',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={2} md={4}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSaveChanges}
                disabled={isSubmitting}
                sx={{
                  height: 56,
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size={18} sx={{ color: 'white' }} />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Grid>
          </Grid>
          <Typography
            variant="caption"
            sx={{
              mt: 2,
              display: 'block',
              color: 'text.secondary',
              fontStyle: 'italic',
              px: 1,
            }}
          >
            <ul style={{ paddingLeft: '1em', margin: 0 }}>
              <li>
                The "To" value must be greater than the "From" value and less
                than or equal to 30.
              </li>
              <li>
                You can only set a range for monitoring data from the previous
                month.
              </li>
              <li>The "From" value must be between 1 and 30.</li>
            </ul>
          </Typography>
        </Paper>
      </PageContainer>
      <ToastContainer />
    </Stack>
  );
};

export default MonitoringSettings;
