import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Button,
  Checkbox,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Search from 'ui-component/search';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const EmployeesModal = ({
  open,
  onClose,
  onEmployeeSelect,
  handleClonePlans,
}) => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    perPage: 10,
    total: 0,
  });
  const [search, setSearch] = useState('');

  const handleFetchingEmployees = async () => {
    setLoading(true);
    const token = await GetToken();
    const apiUrl = `${Backend.api}${Backend.childEmployees}?fiscal_year_id=${selectedYear?.id}&search=${search}`;

    fetch(apiUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setPagination((prev) => ({ ...prev, total: res.data.total }));
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) handleFetchingEmployees();
  }, [open, search, pagination.page, pagination.perPage]);

  // Handle checkbox selection
  const handleSelectEmployee = (employee) => {
    setSelectedEmployees((prevSelected) =>
      prevSelected.includes(employee.id)
        ? prevSelected.filter((id) => id !== employee.id)
        : [...prevSelected, employee.id],
    );
  };

  // Send selected employees to parent when selection changes
  useEffect(() => {
    onEmployeeSelect(selectedEmployees);
  }, [selectedEmployees, onEmployeeSelect]);

  // Handle the send button logic (cloning the plan)
  const handleSend = async () => {
    if (selectedEmployees.length === 0) {
      toast('Please select at least one employee.');
      return;
    }
    handleClonePlans(selectedEmployees); // Trigger clone plan function from parent
    onClose(); // Close the modal after sending
  };
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedEmployees(data.map((employee) => employee.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Employees
        <IconButton
          onClick={onClose}
          style={{ position: 'absolute', right: 10, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          display="flex"
          alignItems="center"
          sx={{ justifyContent: 'space-between' }}
        >
          <Search
            title="Search Employees"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Box display="flex" justifyContent="center" marginTop={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSend}
              disabled={loading || selectedEmployees.length === 0}
            >
              Send Plan
            </Button>
          </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Checkbox
                    checked={
                      selectedEmployees.length === data.length &&
                      data.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Job Position</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Manager</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <ActivityIndicator />
                  </TableCell>
                </TableRow>
              ) : data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleSelectEmployee(employee)}
                      />
                    </TableCell>
                    <TableCell>{employee?.username}</TableCell>
                    <TableCell>{employee?.name}</TableCell>
                    <TableCell>{employee?.phone || 'N/A'}</TableCell>
                    <TableCell>{employee?.job_position || 'N/A'}</TableCell>
                    <TableCell>{employee?.unit}</TableCell>
                    <TableCell>{employee?.manager}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* <TablePagination
          component="div"
          rowsPerPageOptions={[10, 25, 50]}
          count={pagination.total}
          rowsPerPage={pagination.perPage}
          page={pagination.page}
          onPageChange={(e, newPage) =>
            setPagination((prev) => ({ ...prev, page: newPage }))
          }
          onRowsPerPageChange={(e) =>
            setPagination((prev) => ({
              ...prev,
              perPage: parseInt(e.target.value, 10),
              page: 0,
            }))
          }
        /> */}
      </DialogContent>

      <ToastContainer />
    </Dialog>
  );
};
EmployeesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEmployeeSelect: PropTypes.func.isRequired,
  handleClonePlans: PropTypes.func.isRequired,
};

export default EmployeesModal;
