import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import { Box, ClickAwayListener, IconButton, Typography, useTheme } from '@mui/material';
import { taskStatusColor } from 'utils/function';
import { IconDots } from '@tabler/icons-react';

function StatusSelector({ name, options, selected, handleSelection, onActionTaken, hideStatusOptions, ...props }) {
  const theme = useTheme();
  const [optionDisplayState, setOptionDisplayState] = React.useState(false);

  const handleToggleDisplayState = (event) => {
    event.stopPropagation();
    setOptionDisplayState(!optionDisplayState);
  };

  const handleMenuClick = (event, option) => {
    event.stopPropagation();
    handleSelection(option);
    setOptionDisplayState(false);
  };

  const handleTaskAction = (event, status) => {
    event.stopPropagation();
    onActionTaken(status);
  };

  return (
    <ClickAwayListener onClickAway={() => setOptionDisplayState(false)}>
      <Box sx={{ position: 'relative', top: 0 }}>
        <IconButton onClick={(event) => handleToggleDisplayState(event)} sx={{ zIndex: 0 }}>
          <IconDots size="1.4rem" stroke="2.6" />
        </IconButton>

        <Box
          sx={{
            display: optionDisplayState ? 'block' : 'none',
            position: 'absolute',
            top: 40,
            right: { xs: -65, md: 0 },
            borderRadius: 2,
            zIndex: 2,
            overflow: 'hidden',
            backgroundColor: theme.palette.background.paper,
            boxShadow: 2,
            transition: 'all 0.6s ease-in-out',
            width: 100
          }}
        >
          {hideStatusOptions && (
            <Box sx={{ pb: 1, borderBottom: 0.5, borderColor: theme.palette.divider }}>
              {options.map(
                (option, index) =>
                  option.value != selected && (
                    <MenuItem key={index} value={option.value} onClick={(event) => handleMenuClick(event, option)}>
                      <Typography variant="body1" color={selected == option.value ? taskStatusColor(selected) : theme.palette.text.primary}>
                        {option.label}
                      </Typography>
                    </MenuItem>
                  )
              )}
            </Box>
          )}
          <Box sx={{ backgroundColor: theme.palette.primary.light }}>
            <MenuItem sx={{ width: '100%', py: 1.4 }} onClick={(event) => handleTaskAction(event, 'edit')}>
              Edit
            </MenuItem>

            <MenuItem sx={{ width: '100%', color: 'error', py: 1.4 }} onClick={(event) => handleTaskAction(event, 'remove')}>
              <Typography variant="body1" color="error">
                Remove
              </Typography>
            </MenuItem>
          </Box>
        </Box>
      </Box>
    </ClickAwayListener>
  );
}

export default StatusSelector;
