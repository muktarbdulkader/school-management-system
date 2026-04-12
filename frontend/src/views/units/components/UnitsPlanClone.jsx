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
  Box,
  Button,
  Checkbox,
  Avatar,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Search from 'ui-component/search';
import Backend from 'services/backend';
import { ToastContainer } from 'react-toastify';
import toast from 'react-hot-toast';

import { useSelector } from 'react-redux';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const UnitsPlanClone = ({ open, onClose, onUnitSelect, handleClonePlans }) => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    perPage: 10,
    total: 0,
  });
  const [search, setSearch] = useState('');

  const handleFetchingUnits = async () => {
    setLoading(true);
    const token = await GetToken();
    const apiUrl = `${Backend.api}${Backend.childDepartments}?fiscal_year_id=${selectedYear?.id}&search=${search}`;

    fetch(apiUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          console.log(res.data);

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
    if (open) handleFetchingUnits();
  }, [open, search, pagination.page, pagination.perPage]);

  const handleSelectUnit = (unit) => {
    setSelectedUnits((prevSelected) =>
      prevSelected.includes(unit.id)
        ? prevSelected.filter((id) => id !== unit.id)
        : [...prevSelected, unit.id],
    );
  };

  useEffect(() => {
    onUnitSelect(selectedUnits);
  }, [selectedUnits, onUnitSelect]);

  const handleSend = async () => {
    if (selectedUnits.length === 0) {
      toast.error('Please select at least one unit.');
      return;
    }
    handleClonePlans(selectedUnits);
    onClose();
  };
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUnits(data.map((unit) => unit.id));
    } else {
      setSelectedUnits([]);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Units
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
            title="Search Units"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Box display="flex" justifyContent="center" marginTop={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSend}
              disabled={loading || selectedUnits?.length === 0}
            >
              Send
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
                      selectedUnits.length === data.length && data.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Unit Name</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Manager Badge</TableCell>
                <TableCell>Unit Type</TableCell>
                <TableCell>Parent</TableCell>
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
                    No units found
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUnits.includes(unit.id)}
                        onChange={() => handleSelectUnit(unit)}
                      />
                    </TableCell>
                    <TableCell>{unit?.name}</TableCell>
                    <TableCell>
                      <Avatar
                        alt={unit.manager?.user?.name}
                        sx={{ width: 25, height: 25, marginRight: 1 }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle3" sx={{ flexGrow: 1 }}>
                          {unit?.manager}
                        </Typography>
                        <Typography variant="subtitle2">
                          {unit.manager?.position}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell> {unit?.manage_badge_id}</TableCell>
                    <TableCell> {unit?.unit_type}</TableCell>
                    <TableCell>
                      {' '}
                      {unit?.parent ? unit?.parent : 'No Parent'}
                    </TableCell>
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
UnitsPlanClone.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUnitSelect: PropTypes.func.isRequired,
  handleClonePlans: PropTypes.func.isRequired,
};

export default UnitsPlanClone;
