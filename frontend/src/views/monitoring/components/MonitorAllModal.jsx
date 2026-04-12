import { useTheme } from '@emotion/react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Box,
  IconButton,
  TableContainer,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useEffect, useState, useMemo } from 'react';

const MonitorAllModal = ({
  open,
  onClose,
  plans,
  unitName,
  handleSubmit,
  isAdding,
  activeMonth,
  setActiveMonth,
  monthOptions,
  getValueForMonth,
}) => {
  const theme = useTheme();
  const [values, setValues] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isLoadingValues, setIsLoadingValues] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);

  // Memoize the filtered plans to avoid recalculating on every render
  const allPlans = useMemo(() => plans, [plans]);

  // Memoize the month calculation
  const calculateAvailableMonths = useMemo(() => {
    const allMonths = new Set();
    allPlans.forEach((plan) => {
      plan.targets?.forEach((target) => {
        // Include months from both current period and previous period targets
        if (
          target.is_current_period ||
          target.is_previous ||
          target.months?.some((m) => m.status === 'true')
        ) {
          target.months?.forEach((month) => {
            allMonths.add(month.month);
          });
        }
      });
    });

    return Array.from(allMonths).map((month) => ({
      label: month,
      value: month,
      status: 'true',
    }));
  }, [allPlans]);

  useEffect(() => {
    if (open) {
      setAvailableMonths(calculateAvailableMonths);

      const initialMonth =
        activeMonth ||
        (calculateAvailableMonths.length > 0
          ? calculateAvailableMonths[0].value
          : '');
      setSelectedMonth(initialMonth);
      setActiveMonth?.(initialMonth);

      if (initialMonth) {
        fetchMonthValues(initialMonth);
      }
    } else {
      setValues({});
      setDescriptions({});
      setSelectedMonth('');
      setAvailableMonths([]);
    }
  }, [open, calculateAvailableMonths, activeMonth]);

  useEffect(() => {
    if (open) {
      setAvailableMonths(calculateAvailableMonths);

      const initialMonth =
        activeMonth ||
        (calculateAvailableMonths.length > 0
          ? calculateAvailableMonths[0].value
          : '');
      setSelectedMonth(initialMonth);
      setActiveMonth?.(initialMonth);

      if (initialMonth) {
        fetchMonthValues(initialMonth);
      }
    } else {
      setValues({});
      setDescriptions({});
      setSelectedMonth('');
      setAvailableMonths([]);
    }
  }, [open, calculateAvailableMonths, activeMonth]);

  const fetchMonthValues = async (month) => {
    if (!month || !getValueForMonth) return;

    setIsLoadingValues(true);
    try {
      const valuePromises = allPlans.map(async (plan) => {
        try {
          const value = await getValueForMonth(month, plan.id);
          return { planId: plan.id, value: value || '' };
        } catch (error) {
          console.error(`Error fetching value for plan ${plan.id}:`, error);
          return { planId: plan.id, value: '' };
        }
      });

      const results = await Promise.all(valuePromises);
      const newValues = {};
      const newDescriptions = {};

      results.forEach(({ planId, value }) => {
        newValues[planId] = value;
        newDescriptions[planId] = descriptions[planId] || '';
      });

      setValues(newValues);
      setDescriptions(newDescriptions);
    } catch (error) {
      console.error('Error fetching month values:', error);
      // Initialize empty values for all plans
      const resetValues = {};
      allPlans.forEach((plan) => {
        resetValues[plan.id] = '';
      });
      setValues(resetValues);
    } finally {
      setIsLoadingValues(false);
    }
  };

  const handleMonthChange = async (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    setActiveMonth?.(month);
    await fetchMonthValues(month);
  };

  const handleValueChange = (planId, value) => {
    setValues((prev) => ({ ...prev, [planId]: value }));
  };

  const handleDescriptionChange = (planId, value) => {
    setDescriptions((prev) => ({ ...prev, [planId]: value }));
  };

  const handleFormSubmit = () => {
    const submissions = allPlans
      .filter((plan) => plan.can_monitor === true)
      .map((plan) => {
        const target = plan.targets?.find((t) =>
          t.months?.some((m) => m.month === selectedMonth),
        );

        if (!target) return null;

        return {
          target_setting_id: target.id,
          actual_value: values[plan.id] || '',
          description: descriptions[plan.id] || `Monitoring for ${plan.kpi}`,
          month: selectedMonth,
        };
      })
      .filter((submission) => submission !== null);

    if (submissions.length === 0) {
      console.warn('No valid submissions found for the selected month');
      return;
    }

    handleSubmit(submissions);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Typography variant="h6">Monitor All KPIs</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {unitName} • {allPlans.length} KPIs
          </Typography>
        </DialogTitle>
        <IconButton onClick={onClose}>
          <IconX size={20} />
        </IconButton>
      </Box>

      <DialogContent>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Month</InputLabel>
          <Select
            value={selectedMonth}
            label="Select Month"
            onChange={handleMonthChange}
            disabled={isAdding || availableMonths.length === 0}
          >
            {availableMonths.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedMonth && (
          <Typography
            variant="subtitle1"
            color={theme.palette.text.primary}
            sx={{
              margin: '0 0 16px 0',
              textAlign: 'center',
              padding: '10px 20px',
              borderRadius: theme.shape.borderRadius,
              backgroundColor: theme.palette.grey[50],
            }}
          >
            You are monitoring
            <span
              style={{
                fontWeight: 'bold',
                fontSize: '16px',
                color: theme.palette.primary.main,
                margin: '0 4px',
              }}
            >
              {selectedMonth}
            </span>
            activities
          </Typography>
        )}

        {isLoadingValues ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>KPI</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Actual Value</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allPlans.map((plan) => {
                  const target = plan.targets?.find(
                    (t) =>
                      t.is_current_period ||
                      t.months?.some((m) => m.status === 'true'),
                  );

                  if (!target) return null;

                  const isDisabled =
                    !plan.can_monitor || !selectedMonth || isAdding;

                  return (
                    <TableRow
                      key={plan.id}
                      sx={{
                        backgroundColor: isDisabled
                          ? theme.palette.grey[50]
                          : 'inherit',
                        '& .MuiTableCell-root': {
                          color: isDisabled
                            ? theme.palette.text.disabled
                            : 'inherit',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight="medium">{plan.kpi}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {plan.frequency}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {target?.target || 'N/A'} {plan.measuring_unit}
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={values[plan.id] || ''}
                          onChange={(e) =>
                            handleValueChange(plan.id, e.target.value)
                          }
                          fullWidth
                          size="small"
                          disabled={isDisabled}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={descriptions[plan.id] || ''}
                          onChange={(e) =>
                            handleDescriptionChange(plan.id, e.target.value)
                          }
                          fullWidth
                          size="small"
                          placeholder="Add notes..."
                          disabled={isDisabled}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isAdding}>
          Cancel
        </Button>
        <Button
          onClick={handleFormSubmit}
          variant="contained"
          disabled={isAdding || !selectedMonth || isLoadingValues}
        >
          {isAdding ? 'Submitting...' : 'Submit All'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MonitorAllModal;
