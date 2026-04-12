import React, { useEffect, useState } from 'react';
import PageContainer from 'ui-component/MainPage';
import Search from 'ui-component/search';
import {
  Box,
  Chip,
  Grid,
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
import FilterEmployees from './components/FilterEmployees';
import UpdateEmployee from './components/UpdateEmployee';
import DeletePrompt from 'ui-component/modal/DeletePrompt';
import UploadFile from 'ui-component/modal/UploadFile';
import axios from 'axios';
import GetToken from 'utils/auth-token';
import hasPermission from 'utils/auth/hasPermission';
import { IconUserExclamation, IconUserStar } from '@tabler/icons-react';
import { ExcelTemplates } from 'configration/templates';
import { useSelector } from 'react-redux';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const AddEmployeeOptions = [
  'Add Employee',
  'Import From Excel',
  'Export To Excel',
];
const templateUrl = ExcelTemplates.employee_data;

const MyEmployees = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [mounted, setMounted] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleAddEmployeeModal = (employee) => {
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
    setPage(0);
  };

  const handleFetchingEmployees = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const Api =
      Backend.api +
      Backend.getChildEmployees +
      `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.perPage}&search=${search}`;
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
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
        setLoading(false);
      });
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
  }, [pagination.page, pagination.perPage]);

  return (
    <PageContainer
      title="Employees"
      searchField={
        <Search
          title="Filter Employees"
          value={search}
          onChange={(event) => handleSearchFieldChange(event)}
          filter={false}
        >
          <FilterEmployees />
        </Search>
      }
      rightOption={
        <Box>
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
            <Table sx={{ minWidth: 650 }} aria-label="Employes table">
              <TableHead>
                <TableRow>
                  <TableCell>Id</TableCell>
                  <TableCell>Name</TableCell>
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
                  <TableRow
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    <TableCell
                      colSpan={7}
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

      <ToastContainer />
    </PageContainer>
  );
};

export default MyEmployees;
