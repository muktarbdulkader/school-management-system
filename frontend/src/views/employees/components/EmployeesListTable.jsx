import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
  useTheme,
} from '@mui/material';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { IconUserStar, IconUserExclamation } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { formattedDate } from 'utils/function';
import hasPermission from 'utils/auth/hasPermission';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const EmployeeListTable = ({
  data,
  loading,
  error,
  selectedRow,
  handleEmployeeUpdate,
  handleEmployeeEligibility,
  handleRemoveEmployee,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <TableContainer
      sx={{
        minHeight: '66dvh',
        border: 0.4,
        borderColor: theme.palette.divider,
        borderRadius: 2,
      }}
    >
      <Table sx={{ minWidth: 650 }} aria-label="Employees table">
        <TableHead sx={{ backgroundColor: theme.palette.grey[50] }}>
          <TableRow>
            <TableCell>Id</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Gender</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Starting date</TableCell>
            <TableCell>Eligibility</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
            >
              <TableCell
                colSpan={10}
                sx={{
                  border: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator size={20} />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow sx={{ padding: 4 }}>
              <TableCell colSpan={10} sx={{ border: 0 }}>
                <Typography variant="body2">
                  There was an error fetching the employees.
                </Typography>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow sx={{ padding: 4 }}>
              <TableCell colSpan={10} sx={{ border: 0 }}>
                <Typography variant="body2">No employees found.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((employee, index) => (
              <TableRow
                key={employee.id}
                sx={{
                  backgroundColor:
                    selectedRow === index
                      ? theme.palette.grey[100]
                      : theme.palette.background.default,
                  ':hover': {
                    backgroundColor: theme.palette.grey[100],
                    cursor: 'pointer',
                    borderRadius: 2,
                  },
                }}
              >
                <TableCell sx={{ border: 0 }}>
                  {employee?.user?.username}
                </TableCell>
                <TableCell
                  sx={{ display: 'flex', alignItems: 'center', border: 0 }}
                >
                  <Typography
                    variant="subtitle1"
                    color={theme.palette.text.primary}
                  >
                    {employee?.user?.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  {employee?.gender || 'N/A'}
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  {employee?.user?.email}
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  {employee?.job_position?.name || 'N/A'}
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  {employee?.user?.roles?.length > 0
                    ? employee?.user?.roles.map((role, index) => (
                        <Box key={index}>
                          <Chip label={role.name} sx={{ margin: 0.4 }} />
                        </Box>
                      ))
                    : 'N/A'}
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  {formattedDate(employee?.unit?.started_date)}
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  {employee?.is_eligible ? (
                    <Chip
                      label="Eligible"
                      sx={{ backgroundColor: '#d8edd9', color: 'green' }}
                    />
                  ) : (
                    <Chip
                      label="Not Eligible"
                      sx={{ backgroundColor: '#f7e4e4', color: 'red' }}
                    />
                  )}
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  <DotMenu
                    onView={() =>
                      navigate('/employees/view', { state: employee })
                    }
                    onEdit={
                      hasPermission('update:employee')
                        ? () => handleEmployeeUpdate(employee)
                        : null
                    }
                    status={employee.is_eligible ? 'Not Eligible' : 'Eligible'}
                    statusIcon={
                      employee.is_eligible ? (
                        <IconUserStar size={18} />
                      ) : (
                        <IconUserExclamation size={18} />
                      )
                    }
                    onStatusChange={
                      hasPermission('update:employee')
                        ? () => handleEmployeeEligibility(employee)
                        : null
                    }
                    onDelete={
                      hasPermission('delete:employee')
                        ? () => handleRemoveEmployee(employee)
                        : null
                    }
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

EmployeeListTable.propTypes = {
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool,
  selectedRow: PropTypes.number,
  handleEmployeeUpdate: PropTypes.func.isRequired,
  handleEmployeeEligibility: PropTypes.func.isRequired,
  handleRemoveEmployee: PropTypes.func.isRequired,
};

export default EmployeeListTable;
