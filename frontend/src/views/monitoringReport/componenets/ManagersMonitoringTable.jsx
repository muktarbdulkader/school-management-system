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
  Chip,
  Box,
  LinearProgress,
} from '@mui/material';

const ProgressIndicator = ({ value = '0/0' }) => {
  const [completed, total] = value.split('/').map(Number);
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: '60%', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 5,
            backgroundColor: '#f5f5f5',
            '& .MuiLinearProgress-bar': {
              backgroundColor: progress === 100 ? '#4caf50' : '#1976d2',
            },
          }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    </Box>
  );
};

const StatusChip = ({ status }) => {
  if (!status) {
    return (
      <Chip
        label="Not Started"
        color="warning"
        size="small"
        sx={{ fontWeight: 600, minWidth: 100 }}
      />
    );
  }

  const isComplete =
    status.unit_count &&
    status.employee_count &&
    status.unit_count.split('/')[0] === status.unit_count.split('/')[1] &&
    status.employee_count.split('/')[0] === status.employee_count.split('/')[1];

  return (
    <Chip
      label={isComplete ? 'Completed' : 'In Progress'}
      color={isComplete ? 'success' : 'info'}
      size="small"
      sx={{ fontWeight: 600, minWidth: 100 }}
    />
  );
};

const ManagersMonitoringTable = ({ data }) => {
  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 2,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        '& .MuiTableCell-root': {
          py: 1.5,
          px: 2,
        },
      }}
    >
      <Table>
        <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Unit Name
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Parent Unit
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Manager
              </Typography>
            </TableCell>
            {/* <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Status
              </Typography>
            </TableCell> */}
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Month
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Unit Progress
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Employee Progress
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              <TableCell sx={{ fontWeight: 500 }}>
                {row.name || 'N/A'}
              </TableCell>
              <TableCell>{row.parent || 'N/A'}</TableCell>
              <TableCell>{row.manager || 'N/A'}</TableCell>
              {/* <TableCell>
                <StatusChip status={row.monitoring_status} />
              </TableCell> */}
              <TableCell>{row.monitoring_status?.month_name || '-'}</TableCell>
              <TableCell>
                <ProgressIndicator
                  value={row.monitoring_status?.unit_count || '0/0'}
                />
              </TableCell>
              <TableCell>
                <ProgressIndicator
                  value={row.monitoring_status?.employee_count || '0/0'}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

ManagersMonitoringTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      parent: PropTypes.string,
      manager: PropTypes.string,
      monitoring_status: PropTypes.shape({
        month_name: PropTypes.string,
        unit_count: PropTypes.string,
        employee_count: PropTypes.string,
      }),
    }),
  ).isRequired,
};

export default ManagersMonitoringTable;
