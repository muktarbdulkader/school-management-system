import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

export const UpdatePlan = ({
  add,
  plan_id,
  onClose,
  onSucceed,
  isUpdate,
  planData,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [plan, setPlan] = useState(null);
  const [formData, setFormData] = useState({
    weight: '',
    total_target: '',
    targets: [],
  });

  useEffect(() => {
    if (add && plan_id) {
      if (planData) {
        // Use the passed planData directly
        setPlan(planData);
        setFormData({
          weight: planData.weight,
          total_target: planData.total_target,
          targets: planData.targets.map((target) => ({
            id: target.id,
            target: target.target,
            is_previous: target.is_previous, // Add is_previous to the form data
          })),
        });
      } else {
        // Fallback to API fetch if needed
        fetchPlanDetails();
      }
    }
  }, [add, plan_id, planData]);

  const fetchPlanDetails = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.api}${Backend.orgPlanUpdate}${plan_id}`;

      console.log('Fetching plan details from:', Api);

      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log('Plan details response:', result);

      if (response.ok) {
        setPlan(result.data);
        setFormData({
          weight: result.data.weight,
          total_target: result.data.total_target,
          targets: result.data.targets.map((target) => ({
            id: target.id,
            target: target.target,
            is_previous: target.is_previous, // Add is_previous to the form data
          })),
        });
      } else {
        throw new Error(result.message || 'Failed to fetch plan details');
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTargetChange = (index, value) => {
    const newTargets = [...formData.targets];
    // Only allow changes if the target is not a previous one
    if (!newTargets[index].is_previous) {
      newTargets[index].target = value;
      setFormData((prev) => ({
        ...prev,
        targets: newTargets,
      }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.api}${Backend.orgPlanUpdate}${plan_id}`;

      const payload = {
        weight: formData.weight,
        total_target: formData.total_target,
        targets: formData.targets.map((target) => ({
          id: target.id,
          target: target.target,
        })),
      };

      console.log('Submitting update with payload:', payload);

      const response = await fetch(Api, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Plan updated successfully');
        onSucceed();
      } else {
        throw new Error(result.message || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={add} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h4">{plan?.kpi}</Typography>
        <Typography variant="subtitle2" color="textSecondary">
          Update Plan
        </Typography>
      </DialogTitle>
      <Divider />

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <ActivityIndicator size={40} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Weight (%)"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                type="number"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Target"
                name="total_target"
                value={formData.total_target}
                onChange={handleChange}
                type="number"
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" mt={2} mb={1}>
                Period Targets
              </Typography>
              {formData.targets.map((target, index) => (
                <TextField
                  key={target.id}
                  fullWidth
                  label={`Quarter ${index + 1}`}
                  value={target.target}
                  onChange={(e) => handleTargetChange(index, e.target.value)}
                  type="number"
                  margin="normal"
                  disabled={target.is_previous}
                  InputProps={{
                    readOnly: target.is_previous,
                  }}
                />
              ))}
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={submitting}
        >
          {submitting ? 'Updating...' : 'Update Plan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
