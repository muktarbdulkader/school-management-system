import { useEffect, useState } from 'react';
import PageContainer from 'ui-component/MainPage';
import Search from 'ui-component/search';
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
  Typography,
  useTheme,
} from '@mui/material';
import Backend from 'services/backend';
import { AddEmployee } from './components/AddEmployee';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { DotMenu } from 'ui-component/menu/DotMenu';
import SplitButton from 'ui-component/buttons/SplitButton';
import UpdateEmployee from './components/UpdateEmployee';
import DeletePrompt from 'ui-component/modal/DeletePrompt';
import UploadFile from 'ui-component/modal/UploadFile';
import axios from 'axios';
import GetToken from 'utils/auth-token';
import hasPermission from 'utils/auth/hasPermission';
import {
  IconAdjustments,
  IconDownload,
  IconSortAscending,
  IconSortDescending,
  IconUserExclamation,
  IconUserStar,
} from '@tabler/icons-react';
import { ExcelTemplates } from 'configration/templates';
import RightSlideIn from 'ui-component/modal/RightSlideIn';
import FilterEmployees from './components/FilterEmployeeForm';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import { useSelector } from 'react-redux';

const AddEmployeeOptions = ['Add Employee', 'Import From Excel'];
const templateUrl = ExcelTemplates.employee_data;

const Employees = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    perPage: 10,
    last_page: 0,
    total: 0,
  });

  const [add, setAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [update, setUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteUser, setDeleteUser] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importExcel, setImportExcel] = useState(false);
  const [exporting, setExporting] = useState(false);
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [uploadProgress, setUploadProgress] = useState(0);

  //  ------------ FILTER EMPLOYEES ----------- START -------
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);

  const initialFilterState = {
    id: 'asc',
    name: 'asc',
    gender: 'All',
    unit: 'All',
    job_position: 'All',
    sort_by: '',
    sort_order: '',
    eligibility: 'All',
    created_at: 'asc',
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
      id: 'Asc',
      name: 'Asc',
      gender: 'All',
      unit: 'All',
      job_position: 'All',
      eligibility: 'All',
      sort_by: '',
      sort_order: '',
      created_at: 'Asc',
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

  const handleOpenDialog = () => {
    setImportExcel(true);
  };

  const handleCloseDialog = () => {
    setImportExcel(false);
  };

  const handleUpload = async (file) => {
    const token = localStorage.getItem('token');
    const Api = Backend.api + Backend.employeeExcel;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(Api, formData, {
        headers: headers,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percent);
        },
      });

      if (response.success) {
        toast.success(response.data.data.message);
      } else {
        toast.success(response.data.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddEmployeeModal = () => {
    setAdd(true);
  };

  const handleAddEmployeeClose = () => {
    setAdd(false);
  };

  const handleEmployeeUpdate = (employee) => {
    setSelectedRow(employee);
    setUpdate(true);
  };

  const handleUpdateEmployeeClose = () => {
    setUpdate(false);
  };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleEmployeeAdd = (index) => {
    if (index === 0) {
      handleAddEmployeeModal();
    } else if (index === 1) {
      handleOpenDialog();
    } else {
      alert('We will be implement importing from odoo');
    }
  };

  const handleEmployeeAddition = (value, roles) => {
    setIsAdding(true);
    const token = localStorage.getItem('token');
    const Api = Backend.api + Backend.employees;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      name: value?.name,
      gender: value?.gender,
      email: value?.email,

      id: value?.id,
      phone: value?.phone,
      job_position_id: value?.job_position_id,
      job_position: value?.job_position,
      unit_id: value?.unit,
      roles: roles,
      started_date: value?.start_date,
      password: 'password',
      password_confirmation: 'password',
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setIsAdding(false);
          handleAddEmployeeClose();
          toast.success(response.data.message);
          handleFetchingEmployees();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setIsAdding(false);
      });
  };

  const handleUpdatingEmployees = (value, roles) => {
    setIsUpdating(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authorization token is missing.');
      setIsUpdating(false);
      return;
    }

    const Api = Backend.api + Backend.employees + `/${selectedRow?.id || ''}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      name: value?.name,
      gender: value?.gender,
      email: value?.email,
      id: value?.id,
      phone: value?.phone,
      job_position_id: value?.job_position_id,
      job_position: value?.job_position,
      unit_id: value?.unit,
      roles: roles,
      started_date: value?.start_date,
    };

    fetch(Api, {
      method: 'PATCH',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setIsUpdating(false);
          handleUpdateEmployeeClose();
          handleFetchingEmployees();
        } else {
          setIsUpdating(false);
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        setIsUpdating(false);
        toast.error(error.message);
      });
  };

  const handleEmployeeEligiblity = async (employee) => {
    setIsUpdating(true);

    const token = await GetToken();
    if (!token) {
      toast.error('Authorization token is missing.');
      setIsUpdating(false);
      return;
    }

    const Api = Backend.api + Backend.employeeEligiblity + employee?.id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      eligible: employee?.is_eligible,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          handleFetchingEmployees();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const handleRemoveEmployee = (employee) => {
    setSelectedRow(employee);
    setDeleteUser(true);
  };

  const handleDeleteEmployee = () => {
    setDeleting(true);
    const token = localStorage.getItem('token');
    const Api = Backend.api + Backend.employees + '/' + selectedRow.id;

    const headers = {
      Authorization: `Bearer` + token,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'DELETE',
      headers: headers,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setDeleting(false);
          setDeleteUser(false);
          toast.success(response.data.message);

          handleFetchingEmployees();
        } else {
          setDeleting(false);
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        setDeleting(false);
        toast.error(error.message);
      });
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, perPage: event.target.value });
  };

  const handleFetchingEmployees = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api =
      Backend.api +
      Backend.employees +
      `?page=${pagination.page + 1}&per_page=${pagination.perPage}&search=${search}&sort_by=${filters.sort_by}&sort_order=${filters.sort_order}&gender=${filters.gender === 'All' ? '' : filters.gender}&unit_id=${filters.unit === 'All' ? '' : filters.unit}&job_position_id=${filters.job_position === 'All' ? '' : filters.position}&eligible=${filters.eligibility === 'All' ? '' : filters.eligibility === 'Eligible' ? 1 : 0}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'GET',
      headers: header,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setData(response.data.data);
          setPagination({
            ...pagination,
            last_page: response.data.last_page,
            total: response.data.total,
          });
          setLoading(false);
          setError(false);
        } else {
          setLoading(false);
          setError(false);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
        setLoading(false);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingEmployees();
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  useEffect(() => {
    if (mounted) {
      handleFetchingEmployees();
    } else {
      setMounted(true);
    }

    return () => {};
  }, [pagination.page, pagination.perPage, filters]);

  const handleExportingExcel = async () => {
    try {
      setExporting(true);
      const token = await GetToken();

      const payload = {
        fiscal_year_id: selectedYear?.id,
        filter: filters,
        search: search,
      };

      const apiEndpoint = Backend.exportEmployees;

      // Generate the export file
      const response = await fetch(`${Backend.api}${apiEndpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate export');
      }

      const { data: fileUrl } = await response.json();

      // Create temporary download link
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', '');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // const handleExportingExcel = async () => {
  //   try {
  //     setExporting(true);
  //     const token = await GetToken();

  //     const payload = {
  //       fiscal_year_id: selectedYear?.id,
  //       filter: filters,
  //       search: search,
  //       per_page: pagination.perPage,
  //       gender: filters.gender === 'All' ? '' : filters.gender,
  //       unit_id: filters.unit === 'All' ? '' : filters.unit,
  //       job_position_id:
  //         filters.job_position === 'All' ? '' : filters.job_position,
  //     };

  //     const response = await fetch(`${Backend.api}${Backend.exportEmployees}`, {
  //       method: 'POST',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!response.ok) {
  //       const error = await response.json();
  //       throw new Error(error.message || 'Failed to generate export');
  //     }

  //     const result = await response.json();

  //     // Fix: Access the URL directly from result.data (not result.data.fileUrl)
  //     const fileUrl = result.data;

  //     if (!fileUrl) {
  //       throw new Error('No file URL returned from server.');
  //     }

  //     // Create temporary download link
  //     const link = document.createElement('a');
  //     link.href = fileUrl;
  //     link.setAttribute('download', 'employees_export.xlsx'); // You can customize the filename
  //     document.body.appendChild(link);
  //     link.click();

  //     // Cleanup
  //     setTimeout(() => {
  //       document.body.removeChild(link);
  //     }, 100);
  //   } catch (err) {
  //     console.error('Export error:', err);
  //     toast.error(`Export failed: ${err.message}`);
  //   } finally {
  //     setExporting(false);
  //   }
  // };

  return (
    <PageContainer
      title="Patients"
      searchField={
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
      }
      rightOption={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {hasPermission('create:employee') && (
            <DrogaButton
              type="button"
              icon={<IconDownload size="1rem" style={{ paddingRight: 3 }} />}
              title="Export Excel"
              variant="contained"
              color="primary"
              fullWidth={false}
              onPress={() => handleExportingExcel()}
              disabled={exporting}
              sx={{ ml: 1 }}
            />
          )}
          {hasPermission('create:employee') && (
            <SplitButton
              options={AddEmployeeOptions}
              handleSelection={(value) => handleEmployeeAdd(value)}
            />
          )}
        </Box>
      }
    >
      <Grid container padding={2}>
        <Grid item xs={12}>
          <TableContainer
            sx={{
              minHeight: '66dvh',
              border: 0.4,
              borderColor: theme.palette.divider,
              borderRadius: 2,
            }}
          >
            <Table sx={{ minWidth: 650 }} aria-label="Employees table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Id{' '}
                      <IconButton
                        sx={{ ml: 1 }}
                        onClick={() =>
                          handleSorting(
                            'id',
                            filters.id === 'asc' ? 'desc' : 'asc',
                          )
                        }
                        title={
                          filters.id === 'desc'
                            ? 'Descending order'
                            : 'Ascending order'
                        }
                      >
                        {filters.id === 'asc' ? (
                          <IconSortAscending size="1.1rem" />
                        ) : (
                          <IconSortDescending size="1.1rem" />
                        )}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Name{' '}
                      <IconButton
                        sx={{ ml: 1 }}
                        onClick={() =>
                          handleSorting(
                            'name',
                            filters.name === 'asc' ? 'desc' : 'asc',
                          )
                        }
                        title={
                          filters.name === 'desc'
                            ? 'Descending order'
                            : 'Ascending order'
                        }
                      >
                        {filters.name === 'asc' ? (
                          <IconSortAscending size="1.1rem" />
                        ) : (
                          <IconSortDescending size="1.1rem" />
                        )}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Eligibility</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow sx={{ justifyContent: 'center', padding: 4 }}>
                    <TableCell
                      sx={{ justifyContent: 'center', border: 0 }}
                      colSpan={8}
                    >
                      <ActivityIndicator size={20} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow sx={{ padding: 4 }}>
                    <TableCell colSpan={7} sx={{ border: 0 }}>
                      <Typography variant="body2">
                        There is error fetching the Employees
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow sx={{ padding: 4 }}>
                    <TableCell colSpan={7} sx={{ border: 0 }}>
                      <Typography variant="body2">
                        Employee not found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.map((employee, index) => (
                    <TableRow
                      key={employee.id}
                      sx={{
                        backgroundColor:
                          selectedRow == index
                            ? theme.palette.grey[100]
                            : theme.palette.background.default,
                        ':hover': {
                          backgroundColor: theme.palette.grey[100],
                          color: theme.palette.background.default,
                          cursor: 'pointer',
                          borderRadius: 2,
                        },
                      }}
                      onClick={() =>
                        navigate('/employees/view', { state: employee })
                      }
                    >
                      <TableCell sx={{ border: 0 }}>
                        {employee?.user?.username}
                      </TableCell>
                      <TableCell
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          border: 0,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          color={theme.palette.text.primary}
                        >
                          {employee?.user?.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: 0 }}>
                        {employee?.gender ? employee?.gender : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ border: 0 }}>
                        {employee?.user?.email}
                      </TableCell>
                      <TableCell sx={{ border: 0 }}>
                        {employee?.unit?.unit?.name}
                      </TableCell>
                      <TableCell sx={{ border: 0 }}>
                        {employee?.job_position?.name
                          ? employee?.job_position?.name
                          : 'N/A'}
                      </TableCell>

                      <TableCell sx={{ border: 0 }}>
                        {employee?.is_eligible ? (
                          <Chip
                            label="Eligible"
                            sx={{
                              backgroundColor: '#d8edd9',
                              color: 'green',
                            }}
                          />
                        ) : (
                          <Chip
                            label="Not Eligible"
                            sx={{
                              backgroundColor: '#f7e4e4',
                              color: 'red',
                            }}
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
                          status={
                            employee?.is_eligible ? 'Not Eligible' : 'Eligible'
                          }
                          statusIcon={
                            employee?.is_eligible ? (
                              <IconUserStar size={18} />
                            ) : (
                              <IconUserExclamation size={18} />
                            )
                          }
                          onStatusChange={
                            hasPermission('update:employee')
                              ? () => handleEmployeeEligiblity(employee)
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
          <TablePagination
            component="div"
            rowsPerPageOptions={[10, 25, 50, 100]}
            count={pagination.total}
            rowsPerPage={pagination.perPage}
            page={pagination.page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Grid>
      </Grid>

      <AddEmployee
        add={add}
        isAdding={isAdding}
        onClose={handleAddEmployeeClose}
        handleSubmission={(value, role) => handleEmployeeAddition(value, role)}
      />

      {selectedRow && (
        <UpdateEmployee
          update={update}
          isUpdating={isUpdating}
          EmployeeData={selectedRow}
          onClose={() => handleUpdateEmployeeClose()}
          handleSubmission={(value, roles) =>
            handleUpdatingEmployees(value, roles)
          }
        />
      )}

      {deleteUser && (
        <DeletePrompt
          type="Delete"
          open={deleteUser}
          title="Removing Employee"
          description={
            `Are you sure you want to remove ` + selectedRow?.user?.name
          }
          onNo={() => setDeleteUser(false)}
          onYes={() => handleDeleteEmployee()}
          deleting={deleting}
          handleClose={() => setDeleteUser(false)}
        />
      )}

      <UploadFile
        open={importExcel}
        onClose={handleCloseDialog}
        onUpload={(file) => handleUpload(file)}
        uploadProgress={uploadProgress}
        onRemove={() => setUploadProgress(0)}
        templateUrl={templateUrl}
      />

      <RightSlideIn
        title="Filter Employees"
        open={openFilterModal}
        handleClose={handleClosingFilterModal}
      >
        <FilterEmployees
          filters={filters}
          onInputChange={handleChange}
          onReset={handleReset}
          onSort={(name, value) => handleSorting(name, value)}
        />
      </RightSlideIn>

      <ToastContainer />
    </PageContainer>
  );
};

export default Employees;
