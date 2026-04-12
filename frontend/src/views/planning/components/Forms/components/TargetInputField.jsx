import React from 'react';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

// Example component to create numerical input fields
const TargetInputField = ({ count, name }) => {
  // Create an array of the given count for rendering the fields
  const fields = Array.from({ length: count }, (_, index) => index);

  const handleAnnumName = (index) => {
    if (count > 1) {
      return index + 1;
    }

    return '';
  };
  return (
    <div>
      <Grid container spacing={2}>
        {fields.map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <TextField type="number" label={`${name} ${handleAnnumName(index)}`} variant="outlined" fullWidth margin="normal" />
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default TargetInputField;
