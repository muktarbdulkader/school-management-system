import React from 'react';
import { Box, Button, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, useTheme } from '@mui/material';
import PropTypes from 'prop-types';

const FilterEmployees = ({ handleClose, handleApplying }) => {
  const theme = useTheme();
  const [filters, setFilters] = React.useState({
    gender: ''
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const handleApplyFilter = () => {
    handleApplying(filters);

  };

  return (
    <Box sx={{ minHeight: 280, p: 0.4 }}>
      <FormControl component="fieldset" sx={{ marginTop: 2, paddingX: 2 }} onClick={handleClose}>
        <FormLabel component="legend" sx={{ color: theme.palette.text.primary }}>
          Gender
        </FormLabel>
        <RadioGroup
          aria-label="gender"
          name="gender"
          value={filters.gender}
          onChange={handleFilterChange}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <FormControlLabel value="" control={<Radio />} label="All" />
          <FormControlLabel value="male" control={<Radio />} label="Males" />
          <FormControlLabel value="female" control={<Radio />} label="Females" />
        </RadioGroup>
      </FormControl>
      <Grid
        container
        sx={{
          position: 'absolute',
          bottom: 2,
          padding: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Grid item xs={4.6}>
          <Button variant="text" role="button" fullWidth>
            Reset
          </Button>
        </Grid>
        <Grid item xs={6.4} sx={{ marginRight: 1 }}>
          <Button variant="contained" role="button" fullWidth onClick={() => handleApplyFilter()}>
            Apply
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

FilterEmployees.propTypes = {
  handleClose: PropTypes.func
};

export default FilterEmployees;
