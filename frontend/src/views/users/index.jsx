import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  useTheme,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { format } from 'date-fns';
import { IconCircleCheckFilled, IconForbid } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import Backend from 'services/backend';
import Search from 'ui-component/search';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';

import AddUser from './componenets/Addusers';

import EditUser from './componenets/EditUsers';
import hasPermission from 'utils/auth/hasPermission';
import ChangePassword from './componenets/ChangePassword';
import AddButton from 'ui-component/buttons/AddButton';
import { usePermissions } from '../../utils/auth/hasPermission';

const Users = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [add, setAdd] = useState(false);
  const [roles, setRoles] = useState([]);
  const [data, setData] = useState([]);
  const [paginationData, setPaginationData] = useState([]);
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
  const [branchOpen, setBranchOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const { hasPermission } = usePermissions(); // CALL THIS ONCE AT TOP LEVEL
  
  // Get user roles directly for super_admin check
  const userRoles = useSelector((state) => state?.user?.user?.roles || []);
  const normalizedRoles = (userRoles || []).map(role => 
    typeof role === 'string' ? role.toLowerCase() : (role?.name || '').toLowerCase()
  );
  const isSuperAdmin = normalizedRoles.includes('super_admin') || normalizedRoles.includes('superadmin') || normalizedRoles.includes('admin');

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

  const handleFetchingUsers = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api =
      Backend.auth +
      Backend.users +
      `?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}&role=${selectedRole}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, { method: 'GET', headers: header })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          console.log('Fetched Users:', response.data); // Debugging log
          setData(response.data);
          setPagination({
            ...pagination,
            last_page: Math.ceil(response.data.length / pagination.per_page),
            total: response.data.length,
          });
          const startIndex = pagination.page * pagination.per_page || 0;
          const endIndex = startIndex + pagination.per_page || 10;
          setPaginationData(data.slice(startIndex, endIndex));
          setError(false);
        } else {
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleUserAddition = async (value) => {
    setIsAdding(true);
    const token = await GetToken();
    const Api = Backend.auth + Backend.userRegister + '/';
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const data = {
      email: value.email,
      full_name: value.name,
      password: value.password,
      role_name: value.roles,
    };
    if (!value.email || !value.name || !value.password) {
      toast.error('Please fill all required fields.');
      setIsAdding(false);
      return;
    }

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.data.message || 'Error adding user');
      }

      const responseData = await response.json();
      if (responseData.success) {
        toast.success(responseData.data.message);
        handleFetchingUsers();
        handleUserModalClose();
      } else {
        toast.error(responseData.data.message || 'Failed to add user.');
      }
    } catch (error) {
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleFetchingRoles = async () => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.roles}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, { method: 'GET', headers: header })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setRoles(response.data);
        }
      })
      .catch((error) => {
        toast(error.message);
      });
  };

  const handleUpdatingUser = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();

    const Api = `${Backend.auth}${Backend.users}/${selectedRow?.id}/`; // Update the selected user by ID

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      name: updatedData.name,
      email: updatedData.email,
      roles: updatedData.roles,
    };

    try {
      const response = await fetch(Api, {
        method: 'PUT',
        headers: header,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || 'Error updating user');
      }

      const responseData = await response.json();
      if (responseData.success) {
        toast.success('User updated successfully');
        setIsUpdating(false);
        handleFetchingUsers(); // Refresh the users list after successful update
        handleUpdateUserClose(); // Close the modal
      } else {
        setIsUpdating(false);
        toast.error('Failed to update user.');
      }
    } catch (error) {
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatingPassword = async (updatedPassword) => {
    if (!selectedRow) {
      toast.error('User selection is required to change the password');
      return;
    }

    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.users}${selectedRow?.id}/change-password/`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      new_password: updatedPassword.newPassword,
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (responseData.success) {
        toast.success('Password updated successfully');
        setIsUpdating(false);
        handleFetchingUsers();
        handleChangePasswordClose();
      } else {
        toast.error(responseData.data.message || 'Failed to update password');
      }
    } catch (error) {
      // Handle any unexpected errors and display a generic error message if no specific message is available
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUserStatus = async (user) => {
    setIsUpdating(true);

    const token = await GetToken();
    if (!token) {
      toast.error('Authorization token is missing.');
      setIsUpdating(false);
      return;
    }

    const Api = `${Backend.auth || '/api/'}${Backend.users || 'users/'}${user?.id}/update_status/`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      status: user?.status === 'active' ? 'inactive' : 'active',
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
          handleFetchingUsers();
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

  const handleUserModalClose = () => {
    setAdd(false);
  };

  const handleUserUpdate = (updatedData) => {
    console.log('Setting selected row for update:', updatedData);
    setSelectedRow(updatedData);
    handleFetchingRoles();
    setUpdate(true);
  };

  const handleUpdateUserClose = () => {
    setUpdate(false);
    setSelectedRow(null);
  };

  const handleChangePasswordClose = () => {
    setChange(false);
    setSelectedRow(null);
  };

  const handlePasswordUpdate = (updatedPassword) => {
    console.log('Setting selected row for password update:', updatedPassword);
    setChange(true);
    setSelectedRow(updatedPassword);
  };

  const handleBranchClick = (user) => {
    navigate(`/users/branch-access/${user.id}`);
  };

  const handleBranchClose = () => {
    setBranchOpen(false);
    setSelectedRow(null);
  };

  const fetchRoles = async () => {
    try {
      const token = await GetToken();
      const url = `${Backend.auth}${Backend.roles || '/roles'}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success) {
        const normalized = result.data.map((r) =>
          typeof r === 'string' ? r : r.name || r.role || r.id,
        );
        setRoles(normalized);
      } else {
        toast.warn('Could not load roles list');
      }
    } catch (err) {
      console.error(err);
      toast.warn('Error loading roles');
    }
  };

  useEffect(() => {
    fetchRoles();
    handleFetchingUsers(); // ✅ load initial users
  }, [search, selectedRole]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingUsers();
    }, 800);
    return () => clearTimeout(debounceTimeout);
  }, [search]);

  useEffect(() => {
    if (mounted) {
      const startIndex = pagination.page * pagination.per_page || 0;
      const endIndex = startIndex + pagination.per_page || 10;
      setPaginationData(data.slice(startIndex, endIndex));
    } else {
      setMounted(true);
    }
  }, [pagination.page, pagination.per_page, data]);

  const handleAddUserClick = () => {
    setAdd(true);
    handleFetchingRoles(); // Make sure roles are loaded when opening the modal
  };

  return (
    <PageContainer title="Users">
      {isSuperAdmin || hasPermission('view_users') || hasPermission('view_user') ? (
        <Grid container>
          <Grid item xs={12} padding={3}>
            <Grid item xs={10} md={12} marginBottom={3}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Search
                  title="Search Employees"
                  value={search}
                  onChange={handleSearchFieldChange}
                  filter={false}
                />
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="role-filter-label">
                      Filter by Role
                    </InputLabel>
                    <Select
                      labelId="role-filter-label"
                      value={selectedRole}
                      label="Filter by Role"
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      {roles.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                {(isSuperAdmin || hasPermission('create_user') ||
                  hasPermission('add_user')) && (
                  <AddButton title="Add User" onPress={handleAddUserClick} />
                )}
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
                    message="Unable to retrieve users."
                  />
                ) : paginationData.length === 0 ? (
                  <Fallbacks
                    severity="evaluation"
                    title="User Not Found"
                    description="The list of users will be listed here."
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
                    <Table aria-label="users table" sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>User Id</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Roles</TableCell>
                          <TableCell>Created At</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginationData.map((item) => (
                          <TableRow
                            key={item.id}
                            sx={{
                              ':hover': {
                                backgroundColor: theme.palette.grey[50],
                              },
                            }}
                          >
                            <TableCell>{item?.full_name}</TableCell>
                            <TableCell>{item?.id}</TableCell>
                            <TableCell>{item?.email}</TableCell>
                            <TableCell>
                              {item?.roles.map((role, index) => (
                                <Chip
                                  key={`${role}-${index}`}
                                  label={role}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                  sx={{ margin: 0.5 }}
                                />
                              ))}
                            </TableCell>
                            <TableCell>
                              {format(new Date(item.created_at), 'dd-MM-yyyy')}
                            </TableCell>
                            <TableCell>
                              {item?.is_active ? (
                                <Chip
                                  label="Active"
                                  sx={{
                                    backgroundColor: '#d8edd9',
                                    color: 'green',
                                  }}
                                />
                              ) : (
                                <Chip
                                  label="Inactive"
                                  sx={{
                                    backgroundColor: '#f7e4e4',
                                    color: 'red',
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell
                              sx={{
                                ':hover': {
                                  backgroundColor: theme.palette.grey[50],
                                },
                              }}
                            >
                              <DotMenu
                                onEdit={
                                  (isSuperAdmin || hasPermission('change_user') || hasPermission('edit_user'))
                                    ? () => handleUserUpdate(item)
                                    : null
                                }
                                onChangePassword={
                                  (isSuperAdmin || hasPermission('change_user') || hasPermission('edit_user'))
                                    ? () => handlePasswordUpdate(item)
                                    : null
                                }
                                onBranches={
                                  (isSuperAdmin || hasPermission('change_user') || hasPermission('edit_user')) && 
                                  item.roles?.some(role => ['Super_Admin', 'Admin', 'Head_Admin', 'CEO', 'Staff', 'Teacher'].includes(role))
                                    ? () => handleBranchClick(item)
                                    : null
                                }
                                status={
                                  item?.is_active ? 'Inactivate' : 'Activate'
                                }
                                statusIcon={
                                  item?.is_active ? (
                                    <IconForbid
                                      size={18}
                                      style={{ color: '#a34' }}
                                    />
                                  ) : (
                                    <IconCircleCheckFilled
                                      size={18}
                                      style={{ color: '#008000' }}
                                    />
                                  )
                                }
                                onStatusChange={
                                  (isSuperAdmin || hasPermission('change_user') || hasPermission('edit_user'))
                                    ? () => {
                                        toast.success(
                                          'Changing the user status operation will added soon',
                                        );
                                        {
                                          /** handleUserStatus(item) */
                                        }
                                      }
                                    : null
                                }
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
      ) : (
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: '60vh' }}
        >
          <Box textAlign="center">
            <Chip
              label="You do not have permission to view users."
              color="error"
              variant="outlined"
              size="medium"
            />
          </Box>
        </Grid>
      )}
      <ToastContainer />
      <AddUser
        add={add}
        roles={roles}
        onClose={handleUserModalClose}
        onSubmit={handleUserAddition}
        isAdding={isAdding}
      />

      {selectedRow && (
        <EditUser
          edit={update}
          roles={roles}
          isUpdating={isUpdating}
          userData={selectedRow}
          onClose={handleUpdateUserClose}
          onSubmit={handleUpdatingUser}
        />
      )}

      {selectedRow && (
        <ChangePassword
          change={change}
          user={selectedRow}
          onClose={handleChangePasswordClose}
          onSubmit={handleUpdatingPassword}
          isUpdating={isUpdating}
        />
      )}
    </PageContainer>
  );
};

export default Users;
