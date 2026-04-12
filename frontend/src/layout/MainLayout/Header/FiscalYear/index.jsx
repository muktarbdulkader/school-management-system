import React from 'react';
import {
  FormControl,
  MenuItem,
  Select,
  Typography,
  useTheme,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { SET_SELECTED_FISCAL_YEAR } from 'store/actions';

const FiscalYearMenu = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const years = useSelector((state) => state.customization.fiscalYears);
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const handleSelection = (event) => {
    dispatch({
      type: SET_SELECTED_FISCAL_YEAR,
      selectedFiscalYear: event.target.value,
    });
  };

  return (
    <div>
      {years && (
        <FormControl variant="standard" sx={{ mx: 2, minWidth: 110 }}>
          <Typography variant="caption">Fiscal year</Typography>
          <Select
            value={selectedYear}
            onChange={handleSelection}
            inputProps={{ 'aria-label': 'fiscal year' }}
          >
            {years?.map((year) => (
              <MenuItem key={year.id} value={year}>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.primary }}
                >
                  {year.year}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </div>
  );
};

export default FiscalYearMenu;
