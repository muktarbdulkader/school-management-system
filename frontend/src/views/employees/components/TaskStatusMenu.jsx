import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Box, Typography, useTheme } from '@mui/material';
import { taskStatusColor } from 'utils/function';

function StatusMenu({ name, options, selected, handleSelection, ...props }) {
  const theme = useTheme();
  return (
    <FormControl sx={{ border: 'none', boxShadow: 'none', p: 0 }} {...props}>
      <Select
        displayEmpty
        name={name}
        value={selected}
        onChange={handleSelection}
        inputProps={{ 'aria-label': 'task types' }}
        sx={{
          border: 'none',
          boxShadow: 'none',
          backgroundColor: 'transparent',
          '.MuiOutlinedInput-notchedOutline': { border: 0 },
          '&:hover .MuiOutlinedInput-notchedOutline': { border: 0 },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: 0,
            borderRadius: 8,
          },
          p: 0,
        }}
        fullWidth
        IconComponent={() => <Box sx={{ display: 'none' }} />}
      >
        {options.map((type, index) => (
          <MenuItem key={index} value={type.value}>
            <Typography
              variant="body1"
              color={
                selected == type.value
                  ? taskStatusColor(selected)
                  : theme.palette.text.primary
              }
            >
              {type.label}
            </Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default StatusMenu;
