import * as React from 'react';
import { useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Divider, Dialog, useTheme, Paper } from '@mui/material';
import { toast } from 'react-toastify';
import { styled, keyframes } from '@mui/material/styles';
import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import StepLabel from '@mui/material/StepLabel';
import Check from '@mui/icons-material/Check';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { IconX } from '@tabler/icons-react';
import { motion } from 'framer-motion';

const QontoStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
  display: 'flex',
  height: 22,
  alignItems: 'center',
  ...(ownerState.active && {
    color: '#784af4'
  }),
  '& .QontoStepIcon-completedIcon': {
    color: '#784af4',
    zIndex: 1,
    fontSize: 18
  },
  '& .QontoStepIcon-circle': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'currentColor'
  }
}));

function QontoStepIcon(props) {
  const { active, completed, className } = props;

  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? <Check className="QontoStepIcon-completedIcon" /> : <div className="QontoStepIcon-circle" />}
    </QontoStepIconRoot>
  );
}

QontoStepIcon.propTypes = {
  active: PropTypes.bool,
  className: PropTypes.string,
  completed: PropTypes.bool
};

const steps = ['Fiscal Year', 'Planning Period', 'Frequency Period Value', 'Evaluation Period'];

function CustomizedSteppers() {
  const theme = useTheme();

  const [activeStep, setActiveStep] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [stepData, setStepData] = React.useState({});
  const [tableData, setTableData] = React.useState([]);
  const [fiscalYears, setFiscalYears] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [frequencies, setFrequencies] = React.useState([]);
  const [allStepData, setAllStepData] = React.useState([]);
  const [savedFiscalYear, setSavedFiscalYear] = React.useState(null);
  const [selectedFrequency, setSelectedFrequency] = React.useState(null);
  const [savedData, setSavedData] = React.useState([]);
  const [stepCompleted, setStepCompleted] = React.useState([false, false, false]);
  const [fisicalYear, setFiscalYear] = React.useState();
  const [selectedFiscalYear, setSelectedFiscalYear] = React.useState('');
  const [fiscalYearDetails, setFiscalYearDetails] = React.useState(null);

  const fetchFiscalYear = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${Backend.api + Backend.fiscal_years}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        const years = result.data.data.map((fiscal) => ({
          id: fiscal.id,
          year: fiscal.year
        }));
        setFiscalYear(years);
        years && handleDefaultFiscal(years[0].id);
      } else {
        toast.error(result.message || 'Failed to fetch fiscal year');
      }
    } catch (error) {
      toast.error('An error occurred while fetching fiscal year');
    }
  };

  const fetchFiscalYearDetails = async (fiscal_year_id) => {
    try {
      const token = localStorage.getItem('token');

      // Pass fiscal_year_id as a query parameter
      const Api = `${Backend.api}${Backend.get_frequency_definition}?fiscal_year_id=${fiscal_year_id}`;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      };

      const response = await fetch(Api, { headers });
      const result = await response.json();

      if (response.ok && result.success) {
        const fiscalYearDetails = result.data.fiscalYear;
        const periods = result.data.periods;
        setFiscalYearDetails({
          ...fiscalYearDetails,
          periods
        });
      } else {
        toast.error(result.message || 'Failed to fetch fiscal year details');
      }
    } catch (error) {
      toast.error('An error occurred while fetching fiscal year details');
    }
  };

  const handleFiscalYearChange = (event) => {
    const fiscal_year_id = event.target.value;
    setSelectedFiscalYear(fiscal_year_id);
    fetchFiscalYearDetails(fiscal_year_id); // Fetch details for the selected fiscal year
  };

  const handleDefaultFiscal = (year_id) => {
    setSelectedFiscalYear(year_id);
    fetchFiscalYearDetails(year_id); // Fetch details for the selected fiscal year
  };

  useEffect(() => {
    fetchFiscalYear();
  }, []);

  const handleSaveFiscalYear = (data) => {
    setFiscalYears((prev) => [...prev, data]);
  };

  const handleSavePlanningPeriod = (data) => {
    setTableData((prev) => [
      ...prev,
      {
        ...data,
        type: 'Planning Period'
      }
    ]);
  };
  const handleSaveFrequencyPeriodValue = (data) => {
    setTableData((prev) => [
      ...prev,
      {
        ...data,
        type: 'Frequency Period Value'
      }
    ]);
  };

  const handleSaveEvaluationPeriod = (data) => {
    setTableData((prev) => [
      ...prev,
      {
        ...data,
        type: 'Evaluation Period'
      }
    ]);
  };

  const handleStepClick = (index) => {
    setActiveStep(index);
    if (index === 0 || stepCompleted[index - 1]) {
      setActiveStep(index);
    } else {
      toast.error('Please complete all required fields.');
    }
    setOpen(true);
  };

  const handleCreatePeriod = () => {
    setActiveStep(0);
    setOpen(true);
  };

  const handleNext = async () => {
    const isValid = validateCurrentStep();
    if (isValid) {
      // Mark the current step as completed
      const newStepCompleted = [...stepCompleted];
      newStepCompleted[activeStep] = true;
      setStepCompleted(newStepCompleted);

      // Proceed to the next step
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error('Please complete all required fields.');
    }

    if (steps[activeStep] === 'Fiscal Year') {
      const fiscalYearData = await handleFiscalYearSubmit();
      if (!fiscalYearData) return; // Prevent proceeding if submission failed
      setSavedFiscalYear(fiscalYearData);
    }

    if (steps[activeStep] === 'Planning Period') {
      const planningPeriodData = await handlePlanningPeriodSubmit();
      if (!planningPeriodData) return; // Prevent proceeding if submission failed
    }

    if (steps[activeStep] === 'Frequency Period Value') {
      const frequencyPeriodValueData = await handleFrequencyPeriodValueSubmit();
      if (!frequencyPeriodValueData) return; // Prevent proceeding if submission failed
      setSelectedFrequency(frequencyPeriodValueData);
    }

    if (activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setOpen(true);
    }
  };
  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0:
        return stepData['Fiscal Year']?.year && stepData['Fiscal Year']?.startDate && stepData['Fiscal Year']?.endDate;
      case 1:
        return stepData['Planning Period']?.startDate && stepData['Planning Period']?.endDate;
      case 2:
        return (
          stepData['Frequency Period Value']?.frequency &&
          stepData['Frequency Period Value']?.dates?.every((date) => date.start_date && date.end_date)
        );
      case 3:
        return stepData['Evaluation Period']?.startDate && stepData['Evaluation Period']?.endDate;
      default:
        return false;
    }
  };

  const handleSave = async () => {
    // Filter out the data for the current step
    const filteredData = steps.reduce((acc, step) => {
      if (step !== 'Frequency' && step !== 'Fiscal Year') {
        acc[step] = stepData[step] || '';
      }
      return acc;
    }, {});

    // Handle Fiscal Year separately
    if (steps[activeStep] === 'Fiscal Year') {
      setFiscalYears((prevFiscalYears) => [
        ...prevFiscalYears,
        {
          year: stepData['Fiscal Year'].year
        }
      ]);
    }

    // Map the frequency ID to its name
    if (steps[activeStep] === 'Frequency Period Value' && stepData[steps[activeStep]]) {
      filteredData['Frequency Period Value'] = {
        ...stepData[steps[activeStep]],
        frequency: stepData[steps[activeStep]].frequencyName // Include frequencyName here
      };
    }

    // Get the current step data
    const currentStepData = stepData[steps[activeStep]] || '';

    // Add current step data to allStepData
    setAllStepData((prevData) => [
      ...prevData,
      {
        step: steps[activeStep],
        data: currentStepData
      }
    ]);

    // Add Fiscal Year data if it exists
    if (stepData['Fiscal Year']) {
      filteredData['Fiscal Year'] = stepData['Fiscal Year'];
    }

    // Save the Evaluation Period to the backend
    if (steps[activeStep] === 'Evaluation Period') {
      await handleEvaluaionPeriodSubmit();
    }

    // Add the filtered data to savedData and save to localStorage
    setSavedData((prevSavedData) => {
      const updatedSavedData = [...prevSavedData, filteredData];
      localStorage.setItem('savedData', JSON.stringify(updatedSavedData)); // Save to localStorage
      return updatedSavedData;
    });

    // Reset the stepData only after saving
    setStepData({});

    // Reset activeStep and close the modal
    setActiveStep(0);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setStepData((prevData) => ({
        ...prevData,
        [steps[activeStep]]: {
          ...prevData[steps[activeStep]],
          [name]: Number(value)
        }
      }));
    } else {
      setStepData((prevData) => ({
        ...prevData,
        [steps[activeStep]]: {
          ...prevData[steps[activeStep]],
          [name]: value
        }
      }));
    }
  };

  const handleEvaluaionPeriodSubmit = async () => {
    const token = localStorage.getItem('token');
    const Api = `${Backend.api}${Backend.evaluation_periods}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const parentId = stepData['Evaluation Period']?.frequency_period_value_id || stepData['Frequency Period Value']?.frequency || '';

    // Validation: Ensure parentId, startDate, and endDate are not empty
    if (!parentId) {
      setError((prev) => ({ ...prev, parent_id: 'Parent ID is invalid or missing' }));
      toast.error('Parent ID is invalid or missing.');
      return;
    }

    const startDate = stepData['Evaluation Period']?.startDate;
    const endDate = stepData['Evaluation Period']?.endDate;

    if (!startDate || !endDate) {
      setError((prev) => ({
        ...prev,
        start_date: 'Start date is required',
        end_date: 'End date is required'
      }));
      toast.error('Start date and End date are required.');
      return;
    }

    const evaluationPeriodData = {
      fiscal_year_id: savedFiscalYear?.id || '',
      dates: [
        {
          parent_id: parentId,
          start_date: startDate,
          end_date: endDate
        }
      ]
    };

    try {
      setLoading(true);
      setError({}); // Clear previous errors

      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(evaluationPeriodData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Evaluation period created successfully');
        handleSaveEvaluationPeriod(data.data);

        return data.data;
      } else {
        toast.error(`Evaluation period submission failed: ${data.message}`);
        setError(data.data.errors || {});
      }
    } catch (error) {
      toast.error('An error occurred while submitting evaluation period');
    } finally {
      setLoading(false);
    }
  };

  const handleFrequencyPeriodValueSubmit = async () => {
    const token = localStorage.getItem('token');
    const Api = `${Backend.api}${Backend.frequency_period_values}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const frequencyPeriodValueData = {
      frequency_id: stepData['Frequency Period Value']?.frequency || '',
      fiscal_year_id: stepData['Frequency Period Value']?.fiscal_year_id || savedFiscalYear?.id || '',
      dates: stepData['Frequency Period Value']?.dates || []
    };

    // Check if dates are properly populated before submission
    if (frequencyPeriodValueData.dates.length === 0 || frequencyPeriodValueData.dates.some((date) => !date.start_date || !date.end_date)) {
      toast.error('Please fill in all start and end dates.');
      return;
    }

    try {
      setLoading(true);
      setError({}); // Clear previous errors

      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(frequencyPeriodValueData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Frequency period value created successfully');
        handleSaveFrequencyPeriodValue(data.data);
        return data.data;
      } else {
        // Handle specific errors
        if (data.status === 422) {
          const { message, errors } = data.data;

          // Handle the specific "frequency_id" error
          if (errors && errors.frequency_id) {
            toast.error(errors.frequency_id[0] || 'Frequency ID error');
          } else {
            toast.error(message || 'Frequency period value submission failed');
          }

          setError(errors || {});
        } else {
          toast.error(`Frequency period value submission failed: ${data.message}`);
        }
      }
    } catch (error) {
      toast.error('An error occurred while submitting the frequency period value');
    } finally {
      setLoading(false);
    }
  };

  const handleFiscalYearSubmit = async () => {
    const token = localStorage.getItem('token');
    const Api = `${Backend.api}${Backend.fiscal_years}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const fiscalYearData = {
      year: stepData['Fiscal Year']?.year || '',
      start_date: stepData['Fiscal Year']?.startDate || '',
      end_date: stepData['Fiscal Year']?.endDate || ''
    };

    try {
      setLoading(true);
      setError({}); // Clear previous errors

      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(fiscalYearData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Fiscal year created successfully');
        handleSaveFiscalYear(data.data);
        return data.data;
      } else {
        toast.error(`Fiscal year submission failed: ${data.message}`);
        // Handle specific validation errors
        if (data.data.message.includes('The end date must be at least 360 days after the start date')) {
          toast.error('The end date must be at least 360 days after the start date.');

          setError({
            end_date: [data.data.message]
          });
        } else {
          setError(data.data.errors || {});
        }
      }
    } catch (error) {
      toast.error('An error occurred while submitting fiscal year');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanningPeriodSubmit = async () => {
    const token = localStorage.getItem('token');
    const Api = `${Backend.api}${Backend.planning_periods}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const planningPeriodData = {
      fiscal_year_id: savedFiscalYear?.id,
      start_date: stepData['Planning Period']?.startDate || '',
      end_date: stepData['Planning Period']?.endDate || ''
    };

    try {
      setLoading(true);
      setError({}); // Clear previous errors

      const response = await fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(planningPeriodData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Planning period created successfully');
        handleSavePlanningPeriod(data.data);
        return data.data;
      } else {
        toast.error(`Planning period submission failed: ${data.message}`);

        // Handle the specific fiscal year date range error
        if (data.status === 422 && data.data?.message === 'Start and End dates must be within the fiscal year range.') {
          setError({
            start_date: ['Start date must be within the fiscal year range.'],
            end_date: ['End date must be within the fiscal year range.']
          });
          toast.error('Start and End dates must be within the fiscal year range.');
        } else {
          // Handle other errors
          setError(data.data.errors || {});
        }
      }
    } catch (error) {
      toast.error('An error occurred while submitting the planning period.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFrequencies = async () => {
    const token = await GetToken();
    const Api = Backend.api + 'frequencies';

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };

    try {
      setLoading(true);
      setError({});

      const response = await fetch(Api, {
        method: 'GET',
        headers: headers
      });

      const result = await response.json();

      if (result.success) {
        setFrequencies(result.data.data);
      } else {
        toast.error(`Failed to fetch frequencies: ${result.message}`);
        // Handle specific errors if needed
        setError(result.errors || {});
      }
    } catch (error) {
      toast.error('An error occurred while fetching frequencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrequencies();
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem('savedData');
    if (savedData) {
      setSavedData(JSON.parse(savedData));
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (steps[activeStep] === 'Fiscal Year') {
      await handleFiscalYearSubmit();
    } else if (steps[activeStep] === 'Planning Period') {
      await handlePlanningPeriodSubmit();
    } else if (steps[activeStep] === 'Frequency Period Value') {
      await handleFrequencyPeriodValueSubmit();
    } else if (steps[activeStep] === 'Evaluation Period') {
      await handleEvaluaionPeriodSubmit();
    }
  };

  const handleFrequencyChange = (event) => {
    const selectedId = event.target.value;

    // Find the frequency object by ID
    const selectedFrequency = frequencies.find((f) => f.id === selectedId);

    // Extract frequency name and value
    const frequency = selectedFrequency?.name || '';
    const frequencyValue = selectedFrequency?.value || 1;

    // Generate the appropriate number of date fields
    const periods = Array.from({ length: frequencyValue }, () => ({
      start_date: '',
      end_date: ''
    }));

    // Update stepData with the new dates and frequency name
    setStepData((prevData) => ({
      ...prevData,
      [steps[activeStep]]: {
        ...(prevData[steps[activeStep]] || {}),
        frequency: selectedId,
        frequencyName: frequency,
        dates: periods
      }
    }));
  };

  const handleDateChange = (event, index, dateType) => {
    const { value } = event.target;

    setStepData((prevData) => {
      const currentStepData = prevData[steps[activeStep]] || { dates: [] };

      const updatedDates = [...currentStepData.dates];
      if (!updatedDates[index]) {
        updatedDates[index] = { start_date: '', end_date: '' };
      }

      if (dateType === 'start_date') {
        updatedDates[index].start_date = value; // Ensure value is in YYYY-MM-DD format
      } else if (dateType === 'end_date') {
        updatedDates[index].end_date = value; // Ensure value is in YYYY-MM-DD format
      }

      return {
        ...prevData,
        [steps[activeStep]]: {
          ...currentStepData,
          dates: updatedDates
        }
      };
    });
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Stack sx={{ width: '100%' }} spacing={4}>
      <Dialog open={open} onClose={handleClose}>
        <Paper
          sx={{
            minWidth: '600px',
            minHeight: '50dvh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 2.4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 1 }}>
            <Typography variant="h3" color={theme.palette.text.primary}>
              {steps[activeStep]}
            </Typography>
            <motion.div
              whileHover={{
                rotate: 90
              }}
              transition={{ duration: 0.3 }}
              style={{ cursor: 'pointer' }}
              onClick={handleClose}
            >
              <IconX size="1.3rem" stroke={2} />
            </motion.div>
          </Box>

          {steps[activeStep] === 'Fiscal Year' ? (
            <>
              <form onSubmit={handleSubmit}>
                <TextField
                  name="year"
                  label="Year"
                  value={stepData[steps[activeStep]]?.year || ''}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(error.year)}
                  // helperText={error.year?.join(', ')}
                />
                <TextField
                  name="startDate"
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={stepData[steps[activeStep]]?.startDate || ''}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(error.start_date)}
                  // helperText={error.start_date?.join(', ')}
                />
                <TextField
                  name="endDate"
                  label="End Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={stepData[steps[activeStep]]?.endDate || ''}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(error.end_date)}
                  // helperText={error.end_date?.join(', ')}
                />
              </form>
            </>
          ) : steps[activeStep] === 'Planning Period' ? (
            <form onSubmit={handleSubmit}>
              <TextField
                name="fiscal_year_id"
                label="Fiscal Year"
                value={stepData['Fiscal Year']?.year || ''}
                InputProps={{
                  readOnly: true
                }}
                fullWidth
                margin="normal"
              />
              <TextField
                name="startDate"
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={stepData[steps[activeStep]]?.startDate || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={Boolean(error.start_date)}
                helperText={error.start_date?.join(', ')}
              />
              <TextField
                name="endDate"
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={stepData[steps[activeStep]]?.endDate || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={Boolean(error.end_date)}
                helperText={error.end_date?.join(', ')}
              />
            </form>
          ) : steps[activeStep] === 'Frequency Period Value' ? (
            <>
              <Box sx={{ mb: 0, maxHeight: '50vh', overflowY: 'auto' }}>
                <form onSubmit={handleSubmit}>
                  {/* Fiscal Year  */}
                  <TextField
                    name="fiscal_year_id"
                    label="Fiscal Year"
                    value={stepData['Fiscal Year']?.year || ''}
                    InputProps={{
                      readOnly: true
                    }}
                    fullWidth
                    margin="normal"
                  />

                  {/* Frequency  */}
                  <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                    <InputLabel id="frequency-label">Select Frequency</InputLabel>
                    <Select
                      name="frequency"
                      value={stepData[steps[activeStep]]?.frequency || ''}
                      onChange={handleFrequencyChange}
                      fullWidth
                      margin="normal"
                      label="Select Frequency"
                      sx={{ mb: 2 }}
                    >
                      {frequencies.map((frequency) => (
                        <MenuItem key={frequency.id} value={frequency.id}>
                          {frequency.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Dynamic Date Fields */}
                  {stepData[steps[activeStep]]?.dates?.map((date, index) => (
                    <Grid container key={index} spacing={2} sx={{ mb: 2, maxHeight: '80vh', overflowY: 'auto' }}>
                      <Grid item xs={6}>
                        <TextField
                          name={`start_date_${index}`}
                          label={`Start Date ${index + 1}`}
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={date.start_date || ''}
                          onChange={(event) => handleDateChange(event, index, 'start_date')}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          name={`end_date_${index}`}
                          label={`End Date ${index + 1}`}
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={date.end_date || ''}
                          onChange={(event) => handleDateChange(event, index, 'end_date')}
                          error={Boolean(error.end_date)}
                          helperText={error.end_date?.join(', ')}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </form>
              </Box>
            </>
          ) : steps[activeStep] === 'Evaluation Period' ? (
            <>
              <Box sx={{ mb: 0, maxHeight: '50vh', overflowY: 'auto', p: 2 }}>
                <form onSubmit={handleSubmit}>
                  {/* Fiscal Year Section */}
                  <Card variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Fiscal Year Details
                    </Typography>
                    <TextField
                      name="fiscal_year_id"
                      label="Fiscal Year"
                      value={stepData['Fiscal Year']?.year || ''}
                      InputProps={{
                        readOnly: true
                      }}
                      fullWidth
                      margin="normal"
                      sx={{ mb: 2 }}
                    />

                    {/* Frequency Section */}
                    <TextField
                      name="frequency_name"
                      label="Frequency"
                      value={
                        frequencies.find(
                          (frequency) =>
                            frequency.id ===
                            (stepData[steps[activeStep]]?.frequency_period_value_id || stepData['Frequency Period Value']?.frequency)
                        )?.name || ''
                      }
                      InputProps={{
                        readOnly: true
                      }}
                      fullWidth
                      margin="normal"
                      error={Boolean(error.frequency_period_value_id)}
                      helperText={error.frequency_period_value_id?.join(', ')}
                      sx={{ mb: 2 }}
                    />
                  </Card>

                  {/* Display Dates Section */}
                  {stepData['Frequency Period Value']?.dates?.map((date, index) => (
                    <Card
                      variant="outlined"
                      key={index}
                      sx={{ p: 2, mb: 3, backgroundColor: '#fafafa', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Period {index + 1}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        {/* Frequency Period Start and End Dates */}
                        <Grid item xs={6}>
                          <TextField
                            name={`frequency_start_date_${index}`}
                            label={`Frequency Start Date`}
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={date.start_date || ''}
                            InputProps={{
                              readOnly: true,
                              sx: {
                                backgroundColor: '#e3f2fd',
                                borderRadius: '6px',
                                padding: '10px',
                                '&:hover': {
                                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            name={`frequency_end_date_${index}`}
                            label={`Frequency End Date`}
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={date.end_date || ''}
                            InputProps={{
                              readOnly: true,
                              sx: {
                                backgroundColor: '#e3f2fd',
                                borderRadius: '6px',
                                padding: '10px',
                                '&:hover': {
                                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                                }
                              }
                            }}
                          />
                        </Grid>
                      </Grid>

                      {/* Evaluation Period Start and End Dates */}
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            name={`evaluation_start_date_${index}`}
                            label={`Evaluation Start Date`}
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={stepData[steps[activeStep]]?.evaluation_dates?.[index]?.start_date || ''}
                            onChange={(event) => handleDateChange(event, index, 'start_date')}
                            error={Boolean(error.start_date)}
                            helperText={Array.isArray(error.start_date) ? error.start_date.join(', ') : error.start_date}
                            sx={{
                              backgroundColor: '#fffde7',
                              borderRadius: '6px',
                              padding: '10px',
                              '&:hover': {
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            name={`evaluation_end_date_${index}`}
                            label={`Evaluation End Date`}
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={stepData[steps[activeStep]]?.evaluation_dates?.[index]?.end_date || ''}
                            onChange={(event) => handleDateChange(event, index, 'end_date')}
                            sx={{
                              backgroundColor: '#fffde7',
                              borderRadius: '6px',
                              padding: '10px',
                              '&:hover': {
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                </form>
              </Box>
            </>
          ) : null}

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            {activeStep > 0 && (
              <Button variant="contained" color="inherit" onClick={handleBack}>
                Back
              </Button>
            )}
            {activeStep < steps.length - 1 && (
              <Button variant="contained" color="primary" type="submit" onClick={handleNext}>
                Next
              </Button>
            )}

            {activeStep === steps.length - 1 && (
              <Button variant="contained" color="primary" onClick={handleSave}>
                Save
              </Button>
            )}
          </Stack>
        </Paper>
      </Dialog>

      <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #f3f4f6, #f0f0f0)' }}>
        <CardContent>
          <Box mb={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Select
              value={selectedFiscalYear}
              onChange={handleFiscalYearChange}
              displayEmpty
              variant="outlined"
              sx={{ backgroundColor: 'white', boxShadow: 1, borderRadius: 1 }}
            >
              <MenuItem value="" disabled>
                Select Fiscal Year
              </MenuItem>
              {fisicalYear && Array.isArray(fisicalYear) && fisicalYear.length > 0 ? (
                fisicalYear.map((fiscal) => (
                  <MenuItem key={fiscal.id} value={fiscal.id}>
                    {fiscal.year}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No Fiscal Years Available</MenuItem>
              )}
            </Select>

            <DrogaButton title="Create Period" variant="contained" onPress={() => handleCreatePeriod()} />
          </Box>

          {fiscalYearDetails && (
            <Box>
              {/* Fiscal Year Information */}
              <Box display="flex" flexDirection="column" mb={3} p={2} sx={{ backgroundColor: '#ffffff', borderRadius: 2, boxShadow: 2 }}>
                <Typography variant="h4" marginBottom={1} marginTop={1} color="primary" fontWeight="bold">
                  Fiscal Year {fiscalYearDetails.year}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  <strong>Start Date:</strong> {fiscalYearDetails.start_date}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  <strong>End Date:</strong> {fiscalYearDetails.end_date}
                </Typography>
              </Box>

              <Divider sx={{ marginBottom: 3 }} />

              {/* Periods Section */}
              {fiscalYearDetails.periods && Array.isArray(fiscalYearDetails.periods) && fiscalYearDetails.periods.length > 0 ? (
                fiscalYearDetails.periods.map((period) => (
                  <Box
                    key={period.id}
                    display="flex"
                    flexDirection="column"
                    mb={2}
                    p={2}
                    sx={{ backgroundColor: '#fafafa', borderRadius: 2, boxShadow: 1 }}
                  >
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {period.type}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      <strong>Start Date:</strong> {period.start_date}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      <strong>End Date:</strong> {period.end_date}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1" color="textSecondary">
                  No periods available for this fiscal year.
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default CustomizedSteppers;
