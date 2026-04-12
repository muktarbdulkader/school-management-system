import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Chip,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { format } from 'date-fns';
import PageContainer from 'ui-component/MainPage';
import Backend from 'services/backend';
import Search from 'ui-component/search';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';

import ChangePassword from './componenets/ChangePassword';
import AddButton from 'ui-component/buttons/AddButton';
import AddPatients from './componenets/AddPatients';
import EditPatients from './componenets/EditPatients';
import { IconAdjustments } from '@tabler/icons-react';
import RightSlideIn from 'ui-component/modal/RightSlideIn';
import FilterPatients from './componenets/FilterPatients';
import { useNavigate } from 'react-router-dom';

const Patients = () => {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [add, setAdd] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    last_page: 0,
    total: 0,
  });
  const [search, setSearch] = useState('');
  const [update, setUpdate] = useState(false);
  const [change, setChange] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const navigate = useNavigate();

  //  ------------ FILTER EMPLOYEES ----------- START -------

  const initialFilterState = {
    id: 'asc',
    name: 'asc',
    gender: 'All',
    rooms: 'All',
    full_name: 'All',
    sort_by: '',
    sort_order: '',
    eligibility: 'All',
    created_at: 'asc',
    date: '',
  };
  const [filters, setFilters] = useState(initialFilterState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSorting = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      sort_by: name,
      sort_order: value,
    }));
  };

  const handleReset = () => {
    setFilters({
      ...initialFilterState,
      date: '',
    });
  };

  const handleOpeningFilterModal = () => {
    setOpenFilterModal(true);
  };

  const handleClosingFilterModal = () => {
    setOpenFilterModal(false);
  };

  useEffect(() => {
    const isFilterApplied = Object.keys(initialFilterState).some(
      (key) => filters[key] !== initialFilterState[key],
    );

    setFilterApplied(isFilterApplied);
  }, [filters]);

  //  ------------ FILTER EMPLOYEES ----------- END -------

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleFetchingPatients = async () => {
    setLoading(true);
    const token = await GetToken();

    const params = new URLSearchParams();
    params.append('page', pagination.page + 1);
    params.append('per_page', pagination.per_page);

    if (search) params.append('search', search);
    if (filters.date) {
      params.append('date', format(new Date(filters.date), 'yyyy-MM-dd'));
    }
    const Api = `${Backend.auth}${Backend.patients}?${params.toString()}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch patients');
      }

      if (responseData.success) {
        setData(responseData.data.data);
        setPagination({
          ...pagination,
          last_page: responseData.data.last_page,
          total: responseData.data.total,
        });
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAddition = async (patientData) => {
    setIsAdding(true);
    const token = await GetToken();
    const Api = Backend.auth + Backend.patients;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(patientData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw responseData;
      }

      if (responseData.success) {
        toast.success('Patient added successfully');
        handleFetchingPatients();
        handlePatientModalClose();
      } else {
        toast.error(responseData?.message || 'Failed to add patient');
      }
    } catch (error) {
      const errorMessage =
        error?.data?.message || error?.message || 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleFetchingRooms = async () => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.rooms}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setRooms(responseData.data);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdatingPatient = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.patients}/${selectedRow?.id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'PATCH',
        headers: header,
        body: JSON.stringify(updatedData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update patient');
      }

      if (responseData.success) {
        toast.success('Patient updated successfully');
        handleFetchingPatients();
        handleUpdatePatientClose();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePatient = async (PatientId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.patients}/${PatientId}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };
    try {
      const response = await fetch(Api, {
        method: 'DELETE',
        headers: header,
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to delete Patient');
      }
      if (responseData.success) {
        toast.success('Patient deleted successfully');
        handleFetchingPatients();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePatientModalClose = () => {
    setAdd(false);
  };

  const handlePatientUpdate = (patientData) => {
    setSelectedRow(patientData);
    setUpdate(true);
  };

  const handleUpdatePatientClose = () => {
    setUpdate(false);
    setSelectedRow(null);
  };

  const handleChangePasswordClose = () => {
    setChange(false);
    setSelectedRow(null);
  };

  const handleAddPatientClick = () => {
    handleFetchingRooms();
    setAdd(true);
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingPatients();
    }, 800);
    return () => clearTimeout(debounceTimeout);
  }, [search, filters.date]);

  useEffect(() => {
    if (mounted) {
      handleFetchingPatients();
    } else {
      setMounted(true);
    }
  }, [pagination.page, pagination.per_page]);

  return (
    <PageContainer title="Patients">
      <Grid container>
        <Grid item xs={12} padding={3}>
          <Grid item xs={10} md={12} marginBottom={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Search
                  title="Filter Patients"
                  value={search}
                  onChange={(event) => handleSearchFieldChange(event)}
                  filter={false}
                />

                <IconButton
                  sx={{ ml: 1.2, p: 1.2, backgroundColor: 'grey.50' }}
                  onClick={() => handleOpeningFilterModal()}
                >
                  <IconAdjustments size="1.4rem" stroke="1.8" />
                  <Badge
                    overlap="circular"
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    sx={{
                      display: filterApplied ? 'flex' : 'none',
                      position: 'absolute',
                      top: 12,
                      right: 11,
                    }}
                    badgeContent={
                      <Box
                        sx={{
                          position: 'relative',
                          width: 5,
                          height: 5,
                          ml: 0.6,
                          backgroundColor: 'red',
                          borderRadius: '50%',
                          animation: 'pulse 4s infinite ease-out',
                          '@keyframes pulse': {
                            '0%': {
                              transform: 'scale(1)',
                              opacity: 1,
                            },
                            '50%': {
                              transform: 'scale(1.4)',
                              opacity: 0.6,
                            },
                            '100%': {
                              transform: 'scale(1)',
                              opacity: 0.8,
                            },
                          },
                        }}
                      />
                    }
                  />
                </IconButton>
              </Box>
              <AddButton title="Add Patient" onPress={handleAddPatientClick} />
            </Box>
          </Grid>
          <Grid container>
            <Grid item xs={12}>
              {loading ? (
                <Grid container>
                  <Grid
                    item
                    xs={12}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    <ActivityIndicator size={20} />
                  </Grid>
                </Grid>
              ) : error ? (
                <ErrorPrompt
                  title="Server Error"
                  message="Unable to retrieve patients."
                />
              ) : data.length === 0 ? (
                <Fallbacks
                  severity="evaluation"
                  title="Patients Not Found"
                  description="The list of patients will be listed here."
                  sx={{ paddingTop: 6 }}
                />
              ) : (
                <TableContainer
                  sx={{
                    minHeight: '66dvh',
                    border: 0.4,
                    borderColor: theme.palette.divider,
                    borderRadius: 2,
                  }}
                >
                  <Table aria-label="patients table" sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Full Name</TableCell>
                        <TableCell>EMR Number</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Visit Type</TableCell>
                        <TableCell>Date of Birth</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.map((patient) => (
                        <TableRow
                          key={patient.id}
                          sx={{
                            ':hover': {
                              backgroundColor: theme.palette.grey[50],
                            },
                          }}
                        >
                          <TableCell>{patient.full_name}</TableCell>
                          <TableCell>{patient.emr_number}</TableCell>
                          <TableCell>{patient.email || 'N/A'}</TableCell>
                          <TableCell>{patient.phone}</TableCell>
                          <TableCell>
                            <Chip
                              label={patient.patient_category}
                              color={
                                patient.patient_category === 'regular'
                                  ? 'primary'
                                  : 'secondary'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {patient.visits.length > 0
                              ? patient.visits[0].visit_type
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(patient.date_of_birth),
                              'MM/dd/yyyy',
                            )}
                          </TableCell>
                          <TableCell>{patient.gender}</TableCell>
                          <TableCell>
                            <DotMenu
                              onEdit={() => handlePatientUpdate(patient)}
                              onView={() =>
                                navigate('/patients/view', { state: patient })
                              }
                              onDelete={() => handleDeletePatient(patient.id)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={pagination.total}
                    page={pagination.page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pagination.per_page}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableContainer>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <ToastContainer />
      <AddPatients
        add={add}
        rooms={rooms}
        onClose={handlePatientModalClose}
        onSubmit={handlePatientAddition}
        isAdding={isAdding}
      />

      <RightSlideIn
        title="Filter Patients"
        open={openFilterModal}
        handleClose={handleClosingFilterModal}
      >
        <FilterPatients
          filters={filters}
          onInputChange={handleChange}
          onReset={handleReset}
          onSort={(name, value) => handleSorting(name, value)}
        />
      </RightSlideIn>
      {selectedRow && (
        <EditPatients
          edit={update}
          rooms={rooms}
          isUpdating={isUpdating}
          patientData={selectedRow}
          onClose={handleUpdatePatientClose}
          onSubmit={handleUpdatingPatient}
        />
      )}
      {selectedRow && (
        <ChangePassword
          change={change}
          patient={selectedRow}
          onClose={handleChangePasswordClose}
          isUpdating={isUpdating}
        />
      )}
    </PageContainer>
  );
};

export default Patients;
