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
} from '@mui/material';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const EmployeePlanRemoveTable = ({ data, openDeletePrompt }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleDeleteClick = (planId) => {
    openDeletePrompt(planId);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ backgroundColor: '#eee' }}>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                UserName
              </Typography>
            </TableCell>
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
                Manager
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Unit
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Phone
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle1" fontWeight="bold">
                Action
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              sx={{
                backgroundColor: 'white', // Default white background
                transition: 'background-color 0.3s ease', // Smooth transition effect
                ':hover': {
                  backgroundColor: theme.palette.grey[100], // Light grey on hover
                  cursor: 'pointer',
                },
              }}
              onClick={() => navigate('/employees/view', { state: row })}
            >
              <TableCell sx={{ fontWeight: 'bold' }}>{row.username}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.job_position}</TableCell>
              <TableCell>{row.manager}</TableCell>
              <TableCell>{row.unit}</TableCell>
              <TableCell>{row.phone}</TableCell>
              <TableCell>
                <DotMenu
                  onDelete={() => handleDeleteClick(row.id)}
                  onView={() => navigate('/employees/view', { state: row })}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
EmployeePlanRemoveTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      username: PropTypes.string,
      name: PropTypes.string,
      manager: PropTypes.string,
      plan_status: PropTypes.string,
      weight_sum: PropTypes.number,
    }).isRequired,
  ).isRequired,
  openDeletePrompt: PropTypes.func.isRequired,
};

export default EmployeePlanRemoveTable;
