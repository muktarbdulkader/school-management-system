import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  useTheme,
  Box,
  Grid,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BeaconBadge from 'ui-component/badge/BeaconBadge';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const TeamListTable = ({ teamList, onDateChange, from, to }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [localStartDate, setLocalStartDate] = useState(from || null);
  const [localEndDate, setLocalEndDate] = useState(to || null);

  const handleStartDateChange = (date) => {
    if (date) {
      const newStartDate = date.toISOString().split('T')[0];
      setLocalStartDate(newStartDate);

      if (newStartDate && localEndDate) {
        onDateChange(newStartDate, localEndDate);
      }
    }
  };

  const handleEndDateChange = (date) => {
    if (date) {
      const newEndDate = date.toISOString().split('T')[0];
      setLocalEndDate(newEndDate);

      if (localStartDate && newEndDate) {
        onDateChange(localStartDate, newEndDate);
      } else {
        console.error('Start date must be selected before the end date.');
      }
    }
  };

  const fromDate = localStartDate ? new Date(localStartDate) : null;
  const toDate = localEndDate ? new Date(localEndDate) : null;

  return (
    <TableContainer component={Paper}>
      <Grid container sx={{ mb: 3, justifyContent: 'flex-end', gap: 2 }}>
        <Grid item xs={12} md={1.8} sx={{ mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={fromDate}
              onChange={handleStartDateChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  inputProps={{ ...params.inputProps }}
                  error={Boolean(toDate && fromDate && toDate < fromDate)}
                  helperText={
                    toDate && fromDate && toDate < fromDate
                      ? 'End date must be later than start date'
                      : ''
                  }
                />
              )}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  sx: {
                    width: 150,
                    height: 0,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      '& fieldset': {
                        borderColor: '#ccc',
                      },
                      '&:hover fieldset': {
                        borderColor: '#00796b',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00796b',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.8rem',
                      top: '-1px',
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '0.9rem',
                      padding: '8px 10px',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '16px',
                    },
                  },
                  placeholder: 'MM/DD/YYYY',
                  InputLabelProps: { shrink: true },
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={1.8} sx={{ mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={toDate}
              minDate={fromDate}
              disabled={!fromDate}
              onChange={handleEndDateChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  inputProps={{ ...params.inputProps }}
                  error={Boolean(toDate && fromDate && toDate < fromDate)}
                  helperText={
                    toDate && fromDate && toDate < fromDate
                      ? 'End date must be later than start date.'
                      : !fromDate
                        ? 'Please select a start date first.'
                        : ''
                  }
                />
              )}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  sx: {
                    width: 150,
                    height: 0,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      '& fieldset': {
                        borderColor: '#ccc',
                      },
                      '&:hover fieldset': {
                        borderColor: '#00796b',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00796b',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.8rem',
                      top: '-1px',
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '0.9rem',
                      padding: '8px 10px',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '16px',
                    },
                  },
                  placeholder: 'MM/DD/YYYY',
                  InputLabelProps: { shrink: true },
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>

      <Table>
        <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Name
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Job Position
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Tasks
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Subtasks
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Pending Tasks
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teamList.map((member, index) => (
            <TableRow
              key={index}
              hover
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.grey[100],
                  cursor: 'pointer',
                },
              }}
              onClick={() =>
                navigate('/my-team/member/tasks', {
                  state: {
                    id: member?.employee_id,
                    ...member,
                    from: localStartDate,
                    to: localEndDate,
                  },
                })
              }
            >
              <TableCell>{member.name}</TableCell>
              <TableCell>{member.position}</TableCell>
              <TableCell>{member.tasks_count}</TableCell>
              <TableCell>{member.sub_tasks_count}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" mr={2}>
                    {member.pending_tasks_count}
                  </Typography>
                  {member.pending_tasks_count > 0 && <BeaconBadge />}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

TeamListTable.propTypes = {
  teamList: PropTypes.arrayOf(
    PropTypes.shape({
      employee_id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      position: PropTypes.string.isRequired,
      tasks_count: PropTypes.number.isRequired,
      sub_tasks_count: PropTypes.number.isRequired,
      pending_tasks_count: PropTypes.number.isRequired,
    }),
  ).isRequired,
  onDateChange: PropTypes.func,
  from: PropTypes.string,
  to: PropTypes.string,
};

export default TeamListTable;
