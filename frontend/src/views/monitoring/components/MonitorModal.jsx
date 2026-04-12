import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
  useTheme,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';

const validationSchema = Yup.object().shape({
  actual_value: Yup.string().required('Evaluation value is required'),
  description: Yup.string(),
});

export const MonitorModal = ({
  add,
  isAdding,
  unitName,
  activeMonth,
  setActiveMonth,
  currentValue,
  onClose,
  handleSubmission,
  monthOptions,
  getValueForMonth,
}) => {
  const theme = useTheme();

  // State for selected month and loading
  const [selectedMonth, setSelectedMonth] = React.useState(activeMonth || '');
  const [isLoadingValue, setIsLoadingValue] = React.useState(false);
  const [initialValue, setInitialValue] = React.useState(currentValue || '');

  // Initialize form with active month's value
  const formik = useFormik({
    initialValues: {
      actual_value: initialValue,
      description: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission(values, selectedMonth);
    },
    enableReinitialize: true,
  });

  // Fetch value for a specific month
  const fetchMonthValue = async (month) => {
    if (!getValueForMonth || !month) return;

    setIsLoadingValue(true);
    try {
      const monthValue = await getValueForMonth(month);
      formik.setFieldValue('actual_value', monthValue || '');
      setInitialValue(monthValue || '');
    } catch (error) {
      console.error('Error fetching month value:', error);
      formik.setFieldValue('actual_value', '');
      setInitialValue('');
    } finally {
      setIsLoadingValue(false);
    }
  };

  // Handle month selection change
  const handleMonthChange = async (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    setActiveMonth?.(month);
    await fetchMonthValue(month);
  };

  // Initialize when modal opens or activeMonth changes
  React.useEffect(() => {
    if (add) {
      const initializeModal = async () => {
        setSelectedMonth(activeMonth || '');
        if (activeMonth) {
          await fetchMonthValue(activeMonth);
        } else {
          formik.setFieldValue('actual_value', currentValue || '');
          setInitialValue(currentValue || '');
        }
      };
      initializeModal();
    }
  }, [add, activeMonth]);

  return (
    <Dialog open={add} onClose={onClose} fullWidth maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingRight: 2,
          backgroundColor: theme.palette.grey[50],
        }}
      >
        <DialogTitle variant="h4" color={theme.palette.text.primary}>
          {unitName && `${unitName} Monitoring`}
        </DialogTitle>
        <IconButton onClick={onClose}>
          <IconX size={20} />
        </IconButton>
      </Box>

      <form noValidate onSubmit={formik.handleSubmit}>
        <DialogContent>
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel id="month-select-label">Select Month</InputLabel>
            <Select
              labelId="month-select-label"
              id="month-select"
              value={selectedMonth}
              label="Select Month"
              onChange={handleMonthChange}
              disabled={isAdding}
            >
              {monthOptions?.map((month) => (
                <MenuItem
                  key={month.value}
                  value={month.value}
                  selected={month.value === activeMonth}
                >
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography
            variant="subtitle1"
            color={theme.palette.text.primary}
            sx={{
              margin: '16px 0',
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
              {monthOptions?.find((m) => m.value === selectedMonth)?.label ||
                selectedMonth ||
                'selected month'}
            </span>
            activities
          </Typography>

          <FormControl
            fullWidth
            error={
              formik.touched.actual_value && Boolean(formik.errors.actual_value)
            }
            sx={{ marginTop: 1 }}
          >
            <InputLabel htmlFor="actual_value">Actual Value</InputLabel>
            <OutlinedInput
              id="actual_value"
              name="actual_value"
              label="Actual Value"
              value={isLoadingValue ? 'Loading...' : formik.values.actual_value}
              onChange={formik.handleChange}
              disabled={isLoadingValue || isAdding}
            />
            {formik.touched.actual_value && formik.errors.actual_value && (
              <FormHelperText error>
                {formik.errors.actual_value}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl
            fullWidth
            error={
              formik.touched.description && Boolean(formik.errors.description)
            }
            sx={{ marginTop: 3 }}
          >
            <InputLabel htmlFor="description">Remark (optional)</InputLabel>
            <OutlinedInput
              id="description"
              name="description"
              label="Remark (optional)"
              value={formik.values.description}
              onChange={formik.handleChange}
              multiline
              rows={4}
              disabled={isAdding}
            />
            {formik.touched.description && formik.errors.description && (
              <FormHelperText error>{formik.errors.description}</FormHelperText>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isAdding || isLoadingValue}
            sx={{ minWidth: 100 }}
          >
            {isAdding ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Submit'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

MonitorModal.propTypes = {
  add: PropTypes.bool,
  isAdding: PropTypes.bool,
  unitName: PropTypes.string,
  activeMonth: PropTypes.string,
  setActiveMonth: PropTypes.func,
  currentValue: PropTypes.string,
  onClose: PropTypes.func,
  handleSubmission: PropTypes.func,
  monthOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  getValueForMonth: PropTypes.func,
};

MonitorModal.defaultProps = {
  monthOptions: [],
};
