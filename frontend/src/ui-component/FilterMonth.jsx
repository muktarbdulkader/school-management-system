import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import { IconAdjustmentsHorizontal, IconX } from '@tabler/icons-react';
import { Box, Popper, Typography, useTheme } from '@mui/material';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { MonthPicker } from '@mui/x-date-pickers/MonthPicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField, Grid } from '@mui/material';

const FilterMonth = ({ selectedMonth, setSelectedMonth }) => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);

  const handleOpenFilter = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleMonthChange = (newMonth) => {
    if (newMonth) {
      setSelectedMonth(newMonth);
      setOpen(false);
    }
  };

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid item xs={12}>
          <DatePicker
            views={['month']}
            label="Select Month"
            value={selectedMonth}
            onChange={handleMonthChange}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
      </LocalizationProvider>
    </>
  );
};

FilterMonth.propTypes = {
  selectedMonth: PropTypes.object,
  setSelectedMonth: PropTypes.func.isRequired,
};
export default FilterMonth;
