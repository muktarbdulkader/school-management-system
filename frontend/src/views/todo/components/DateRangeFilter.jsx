import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField, Grid } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { gridSpacing } from 'store/constant';

import PropTypes from 'prop-types';

const DateRangeFilter = ({ startDate, setStartDate, endDate, setEndDate }) => {
  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container sx={{ display: 'flex', justifyContent: 'flex-end' }} spacing={gridSpacing}>
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            minDate={startDate ? new Date(startDate.getTime() + 86400000) : null}
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

DateRangeFilter.propTypes = {
  startDate: PropTypes.instanceOf(Date),
  setStartDate: PropTypes.func.isRequired,
  endDate: PropTypes.instanceOf(Date),
  setEndDate: PropTypes.func.isRequired,
};

export default DateRangeFilter;


