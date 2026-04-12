import * as React from 'react';
import PropTypes from 'prop-types';
import { styled, keyframes } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Check from '@mui/icons-material/Check';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const blinkAnimation = keyframes`
  50% {
    opacity: 0.5;
  }
`;

const BlinkingStepLabel = styled(StepLabel)(({ theme }) => ({
  animation: `${blinkAnimation} 1s linear infinite`,
  padding: theme.spacing(1)
}));

const FallbackMessage = styled(Typography)(({ theme }) => ({
  textAlign: 'center'
}));

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)'
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4'
    }
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4'
    }
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderTopWidth: 3,
    borderRadius: 1
  }
}));

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

const steps = ['Frequency', 'Fiscal Year', 'Planning Period', 'Frequency Period Value', 'Evaluation Period'];

export default function CustomizedSteppers() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [stepData, setStepData] = React.useState({});
  const [tableData, setTableData] = React.useState([]);
  const [fiscalYears, setFiscalYears] = React.useState([]);
  const [frequencies, setFrequencies] = React.useState([]);
  const [savedFiscalYear, setSavedFiscalYear] = React.useState(null);

  const handleSaveFrequency = (data) => {
    setFrequencies((prev) => [...prev, data]);
  };

  const handleSaveFiscalYear = (data) => {
    setFiscalYears((prev) => [...prev, data]);
  };

  const handleStepClick = (index) => {
    setActiveStep(index);
    setOpen(true);
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setOpen(true);
    }
  };

const handleSave = () => {
  const filteredData = steps.reduce((acc, step) => {
    if (step !== 'Frequency' && step !== 'Fiscal Year') {
      acc[step] = stepData[step] || '';
    }
    return acc;
  }, {});

  if (steps[activeStep] === 'Fiscal Year') {
    setFiscalYears((prevFiscalYears) => [
      ...prevFiscalYears,
      {
        year: stepData['Fiscal Year'].year
      }
    ]);
  }

  setTableData((prevTableData) => [...prevTableData, filteredData]);
  setStepData({});
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

  const handleFrequencyChange = (e) => {
    const value = Number(e.target.value);
    const dates = Array.from({ length: value }, (_, index) => ({
      [`startDate_${index + 1}`]: '',
      [`endDate_${index + 1}`]: ''
    }));

    setStepData((prevData) => ({
      ...prevData,
      [steps[activeStep]]: {
        ...prevData[steps[activeStep]],
        frequency: value,
        dates
      }
    }));
  };

  const handleDateChange = (e, index, type) => {
    const value = e.target.value;

    setStepData((prevData) => {
      const newDates = prevData[steps[activeStep]].dates.map((date, i) => (i === index ? { ...date, [type]: value } : date));

      return {
        ...prevData,
        [steps[activeStep]]: {
          ...prevData[steps[activeStep]],
          dates: newDates
        }
      };
    });
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Stack sx={{ width: '100%' }} spacing={4}>
      <Stepper alternativeLabel activeStep={activeStep} connector={<QontoConnector />}>
        {steps.map((label, index) => (
          <Step key={label} onClick={() => handleStepClick(index)}>
            {index === 0 && tableData.length === 0 ? (
              <BlinkingStepLabel StepIconComponent={QontoStepIcon}>{label}</BlinkingStepLabel>
            ) : (
              <StepLabel StepIconComponent={QontoStepIcon}>{label}</StepLabel>
            )}
          </Step>
        ))}
      </Stepper>

      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '55%',
            left: '55%',
            transform: 'translate(-50%, -50%)',
            width: '50%',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4
          }}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" component="div">
                {steps[activeStep]}
              </Typography>
              {steps[activeStep] === 'Frequency' ? (
                <>
                  <Input
                    type="text"
                    name="name"
                    value={stepData[steps[activeStep]]?.name || ''}
                    onChange={handleInputChange}
                    placeholder="Name"
                    style={{ width: '100%', padding: '8px', marginTop: '10px' }}
                  />
                  <Input
                    type="number"
                    name="value"
                    value={stepData[steps[activeStep]]?.value || ''}
                    onChange={handleInputChange}
                    placeholder="Value"
                    style={{ width: '100%', padding: '8px', marginTop: '10px' }}
                  />
                </>
              ) : steps[activeStep] === 'Fiscal Year' ? (
                <>
                  <TextField
                    name="year"
                    label="Year"
                    value={stepData[steps[activeStep]]?.year || ''}
                    onChange={handleInputChange}
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
                  />
                </>
              ) : steps[activeStep] === 'Planning Period' ? (
                <>
                  <Typography variant="body1">
                    Fiscal Year: {fiscalYears.find((fy) => fy.year === stepData['Fiscal Year']?.year)?.year || 'N/A'}
                  </Typography>
                  <>
                    <TextField
                      name="startDate"
                      label="Start Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={stepData[steps[activeStep]]?.startDate || ''}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
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
                    />
                  </>
                </>
              ) : steps[activeStep] === 'Frequency Period Value' ? (
                <>
                  <Typography variant="body1">
                    Fiscal Year: {fiscalYears.find((fy) => fy.year === stepData['Fiscal Year']?.year)?.year || 'N/A'}
                  </Typography>
                  <>
                    <Select
                      name="frequency"
                      value={stepData[steps[activeStep]]?.frequency || ''}
                      onChange={handleFrequencyChange}
                      fullWidth
                      margin="normal"
                    >
                      <MenuItem value={12}>Monthly</MenuItem>
                      <MenuItem value={4}>Quarterly</MenuItem>
                      <MenuItem value={2}>Semi-Annually</MenuItem>
                      <MenuItem value={1}>Annually</MenuItem>
                    </Select>
                    {stepData[steps[activeStep]]?.dates?.map((date, index) => (
                      <Stack key={index} spacing={1}>
                        <TextField
                          name={`startDate_${index + 1}`}
                          label={`Start Date ${index + 1}`}
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={date[`startDate_${index + 1}`] || ''}
                          onChange={(e) => handleDateChange(e, index, `startDate_${index + 1}`)}
                          fullWidth
                        />
                        <TextField
                          name={`endDate_${index + 1}`}
                          label={`End Date ${index + 1}`}
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={date[`endDate_${index + 1}`] || ''}
                          onChange={(e) => handleDateChange(e, index, `endDate_${index + 1}`)}
                          fullWidth
                        />
                      </Stack>
                    ))}
                  </>
                </>
              ) : steps[activeStep] === 'Evaluation Period' ? (
                <>
                  <Typography variant="body1">
                    Fiscal Year: {fiscalYears.find((fy) => fy.year === stepData['Fiscal Year']?.year)?.year || 'N/A'}
                  </Typography>
                  <>
                    <TextField
                      name="evaluation"
                      label="Evaluation"
                      value={stepData[steps[activeStep]]?.evaluation || ''}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                    />
                  </>
                </>
              ) : null}
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                {activeStep < steps.length - 1 && (
                  <Button variant="contained" color="primary" onClick={handleNext}>
                    Next
                  </Button>
                )}
                {activeStep === steps.length - 1 && (
                  <Button variant="contained" color="secondary" onClick={handleSave}>
                    Save
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Modal>

      <Stack spacing={2}>
        {tableData.length === 0 ? (
          <FallbackMessage variant="h6">No data available. Please save data from each step.</FallbackMessage>
        ) : (
          tableData.map((data, index) => (
            <Card
              key={index}
              variant="outlined"
              sx={{
                mb: 2,
                // width: '1050px',
                boxShadow: 1, // Add shadow for more depth
                borderRadius: 2, // Rounded corners
                padding: 2, // Padding inside the card
                '&:hover': {
                  boxShadow: 2, // Increase shadow on hover
                  transform: 'scale(1.02)', // Slight scale effect on hover
                  transition: '0.3s ease-in-out' // Smooth transition
                }
              }}
            >
              <CardContent>
                {Object.entries(data).map(([key, value]) => (
                  <Typography key={key} variant="body2">
                    <strong>{key}:</strong> {value}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Stack>
  );
}
