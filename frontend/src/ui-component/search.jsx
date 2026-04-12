import * as React from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import { Box, ClickAwayListener, Popper, Typography, useTheme } from '@mui/material';
import PropTypes from 'prop-types';
import Transitions from './extended/Transitions';
import MainCard from './cards/MainCard';

const Search = ({ title, filter, children, value, onChange }) => {
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

  return (
    <Paper
      sx={{
        display: 'flex',
        alignItems: 'center',
        border: 1,
        borderColor: theme.palette.divider,
        pl: 1.2,
        pr: 0.6,
        color: theme.palette.text.primary
      }}
    >
      <IconSearch stroke={1.4} color={theme.palette.grey[500]} size="1.6em" />
      <InputBase
        sx={{ p: 1, ml: 1, flex: 1, color: 'inherit' }}
        value={value}
        onChange={onChange}
        placeholder="Search..."
        inputProps={{ 'aria-label': 'search' }}
      />

      {filter && (
        <>
          <IconButton
            ref={anchorRef}
            aria-controls={open ? 'filter-list-grow' : undefined}
            aria-haspopup="true"
            color="inherit"
            variant="outlined"
            aria-label="filter"
            onClick={handleOpenFilter}
          >
            <IconFilter stroke={1.4} color={theme.palette.grey[500]} size="1.6rem" />
          </IconButton>

          <Popper
            placement="bottom-end"
            open={open}
            anchorEl={anchorRef.current}
            transition
            disablePortal
            popperOptions={{
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 6]
                  }
                }
              ]
            }}
          >
            {({ TransitionProps }) => (
              <Transitions in={open} {...TransitionProps}>
                <Paper>
                  <ClickAwayListener onClickAway={handleClose}>
                    <MainCard border={true} content={false} shadow={theme.shadows[1]}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 1.2,
                          py: 0.4,
                          borderBottom: 0.6,
                          borderColor: theme.palette.divider
                        }}
                      >
                        <Typography variant="h4" ml={0.6} color={theme.palette.text.primary}>
                          {title}
                        </Typography>
                        <IconButton onClick={handleClose}>
                          <IconX stroke={1.6} size="1.4rem" />
                        </IconButton>
                      </Box>
                      {children}
                    </MainCard>
                  </ClickAwayListener>
                </Paper>
              </Transitions>
            )}
          </Popper>
        </>
      )}
    </Paper>
  );
};

Search.propTypes = {
  filter: PropTypes.bool,
  onFilter: PropTypes.func
};
export default Search;
