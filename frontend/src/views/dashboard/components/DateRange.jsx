import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField, Grid } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-toastify';
import { gridSpacing } from 'store/constant';

const DateRangePicker = ({ startDate, setStartDate, endDate, setEndDate }) => {
  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (date && endDate && date >= endDate) {
      setEndDate(null);
    }
  };

  const handleEndDateChange = (date) => {
    if (date && startDate && date <= startDate) {
      toast.error('End date must be at least one day after the start date.');
    } else {
      setEndDate(date);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container sx={{ display: 'flex', justifyContent: 'flex-end' }} spacing={gridSpacing}>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={{ width: 'auto', minWidth: '50px' }}
                error={Boolean(endDate && startDate && endDate < startDate)}
                helperText={endDate && startDate && endDate < startDate ? 'End date must be later than start date' : ''}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            minDate={startDate ? new Date(startDate.getTime() + 86400000) : null} // Minimum date is one day after start date
            renderInput={(params) => (
              <TextField
                {...params}
                sx={{ width: 'auto', minWidth: '50px' }}
                error={Boolean(endDate && startDate && endDate < startDate)}
                helperText={endDate && startDate && endDate < startDate ? 'End date must be later than start date' : ''}
              />
            )}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default DateRangePicker;
