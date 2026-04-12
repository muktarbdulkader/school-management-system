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
import { Box } from '@mui/system';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { useNavigate } from 'react-router-dom';

const EmployeeTaskTable = ({ data }) => {
  const navigate = useNavigate();
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
                Actions
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell sx={{ fontWeight: 'bold' }}>{row.username}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.job_position}</TableCell>
              <TableCell>{row.manager}</TableCell>
              <TableCell>{row.unit}</TableCell>
              <TableCell>{row.phone}</TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 10 }}>
                  <DotMenu
                    onView={() => navigate('/hr/view', { state: row })}
                  />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
EmployeeTaskTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      username: PropTypes.string,
      name: PropTypes.string,
      manager: PropTypes.string,
      plan_status: PropTypes.string,
      weight_sum: PropTypes.number,
    }),
  ).isRequired,
};

export default EmployeeTaskTable;
