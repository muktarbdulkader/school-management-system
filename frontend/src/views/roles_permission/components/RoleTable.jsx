import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
  TextField,
  useTheme,
  ListItemIcon,
  Checkbox,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Chip,
  InputLabel
} from '@mui/material';
import { toast } from 'react-toastify';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { IconChevronDown, IconChevronRight, IconX } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import Backend from 'services/backend';
import Fallbacks from 'utils/components/Fallbacks';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import Search from 'ui-component/search';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';

const RoleTable = ({ searchQuery }) => {
  const theme = useTheme();
  const [roleLoading, setRoleLoading] = useState(true);
  const [permLoading, setPermLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editedRole, setEditedRole] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]); // To store all available permissions
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const filteredRoles = roles.filter((role) => role.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleFetchingRole = () => {
    setRoleLoading(true);
    const token = localStorage.getItem('token');
    const Api = `${Backend.auth}${Backend.roles}`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    fetch(Api, {
      method: 'GET',
      headers: header
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setRoles(response.data); // Update roles state
        }
        setRoleLoading(false);
      })
      .catch((error) => {
        setRoleLoading(false);
        setError(true);
        toast(error.message);
      });
  };

  const filteredPermissions = Object.keys(allPermissions).reduce((acc, type) => {
    const filtered = allPermissions[type].filter((perm) => perm.name.toLowerCase().includes(search.toLowerCase()));
    if (filtered.length > 0) {
      acc[type] = filtered;
    }
    return acc;
  }, {});

  const handleSearchingPermission = (event) => {
    const value = event.target.value;
    setSearch(value);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenRole = (index) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  };

  const handleCloseDetailModal = () => {
    setOpenDetailModal(false);
    setSelectedRole(null);
  };

  const handleOpenEditModal = (role) => {
    setPermLoading(true);
    setEditedRole({ name: role.name });
    setSelectedRole(role);
    setSelectedPermissions((role.permissions || []).map((perm) => perm.id || perm.uuid)); // Map current permissions to the IDs
    setOpenEditModal(true);
    handleCloseMenu();

    // Fetch all permissions from the backend
    const token = localStorage.getItem('token');
    const Api = `${Backend.auth}role_permissions/permissions/`; // Fixed: correct endpoint for listing all permissions
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    fetch(Api, {
      method: 'GET',
      headers: header
    })
      .then((response) => response.json())
      .then((response) => {
        console.log('Permissions response:', response);
        if (response.success && response.data && Array.isArray(response.data)) {
          const permissionsData = response.data;

          if (permissionsData.length === 0) {
            console.warn('No permissions returned from server');
            setAllPermissions({});
            return;
          }

          const grouped = permissionsData.reduce((acc, perm) => {
            // Extract content type from permission name (e.g., "users | role | Can add role")
            const name = perm.name || '';
            const parts = name.split('|');
            const type = parts.length >= 2
              ? `${parts[0].trim()} | ${parts[1].trim()}`
              : (perm.content_type || 'General');

            if (!acc[type]) {
              acc[type] = [];
            }
            acc[type].push({ name: name, id: perm.id });
            return acc;
          }, {});

          console.log('Grouped permissions:', grouped);
          setAllPermissions(grouped);
        } else {
          console.error('Error fetching permissions:', response);
          toast.error('Error fetching permissions: ' + (response.message || 'Unknown error'));
        }
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        toast.error('Failed to load permissions: ' + error.message);
      })
      .finally(() => setPermLoading(false));
  };
  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedRole(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditedRole((prev) => ({ ...prev, [name]: value }));
  };
  const handlePermissionChange = (permissionId) => {
    setSelectedPermissions((prevSelected) => {
      if (prevSelected.includes(permissionId)) {
        return prevSelected.filter((id) => id !== permissionId); // Deselect permission
      } else {
        return [...prevSelected, permissionId]; // Select permission
      }
    });
  };

  const handleSaveEdit = async () => {
    setSubmitting(true);
    const token = await GetToken();
    const Api = Backend.auth + Backend.roles + `/${selectedRole.id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    // Prepare the payload with role name and selected permissions
    const payload = {
      name: editedRole.name,
      permissions: selectedPermissions // Send the updated list of permissions
    };

    fetch(Api, {
      method: 'PATCH',
      headers: header,
      body: JSON.stringify(payload)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast('Role updated successfully');
          handleFetchingRole();
          handleCloseEditModal();
        } else {
          toast('Error updating role');
        }
      })
      .catch((error) => {
        toast(error.message);
      })
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (roleId) => {
    const token = localStorage.getItem('token');
    const Api = Backend.auth + Backend.roles + `/${roleId}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    fetch(Api, {
      method: 'DELETE',
      headers: header
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setRoles((prevRoles) => prevRoles.filter((role) => role.id !== roleId));
          toast.success(response?.data?.message);
          handleFetchingRole();
        } else {
          toast('Error deleting role');
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  useEffect(() => {
    handleFetchingRole();
  }, []);

  return (
    <Box
      component={Paper}
      sx={{
        minHeight: '40dvh',
        width: '100%',
        border: 0.4,
        borderColor: theme.palette.divider,
        borderRadius: 2,
        p: 2
      }}
    >
      {roleLoading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40dvh'
          }}
        >
          <ActivityIndicator size={20} />
        </Box>
      ) : error ? (
        <Fallbacks severity="error" title="Server error" description="There is an error fetching Roles" />
      ) : filteredRoles.length === 0 ? (
        <Fallbacks severity="info" title="No Roles Found" description="The list of added Roles will be listed here" />
      ) : (
        filteredRoles.map((role, index) => (
          <Box key={role.id} onClick={() => handleOpenRole(index)}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: selectedIndex === index && theme.palette.primary.main,
                p: 1.4,
                borderRadius: 2
              }}
            >
              <Typography variant="h4" sx={{ color: selectedIndex === index ? 'white' : theme.palette.text.primary }}>
                {role.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DotMenu
                  orientation="horizontal"
                  onEdit={() => handleOpenEditModal(role)}
                  onDelete={() => handleDelete(role.id)}
                  sx={{ color: selectedIndex === index ? 'white' : theme.palette.text.primary }}
                />

                <IconButton onClick={() => handleOpenRole(index)} sx={{ marginLeft: 2 }}>
                  {selectedIndex === index ? (
                    <IconChevronDown
                      size="1.2rem"
                      stroke="1.4"
                      style={{ color: selectedIndex === index ? 'white' : theme.palette.text.primary }}
                    />
                  ) : (
                    <IconChevronRight
                      size="1.2rem"
                      stroke="1.4"
                      style={{ color: selectedIndex === index ? 'white' : theme.palette.text.primary }}
                    />
                  )}
                </IconButton>
              </Box>
            </Box>
            {selectedIndex === index && (
              <Box sx={{ mb: 2, transition: 'all 0.6s ease', px: 2 }}>
                <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.divider, my: 2 }} />
                <Typography
                  variant="h5"
                  sx={{
                    mb: 2,
                    color: theme.palette.primary.main,
                    fontWeight: 'bold'
                  }}
                >
                  Assigned Permissions ({role.permissions?.length || 0})
                </Typography>

                {role.permissions && role.permissions.length > 0 ? (
                  <Grid container spacing={2}>
                    {Object.entries(
                      role.permissions.reduce((acc, perm) => {
                        // Use content_type from backend (e.g., "users | rolepermission")
                        const contentType = perm.content_type || 'General';
                        if (!acc[contentType]) acc[contentType] = [];
                        acc[contentType].push(perm);
                        return acc;
                      }, {})
                    ).map(([contentType, perms]) => (
                      <Grid item xs={12} md={6} lg={4} key={contentType}>
                        <Paper
                          elevation={2}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              mb: 1.5,
                              color: theme.palette.primary.main,
                              fontWeight: 'bold',
                              borderBottom: `2px solid ${theme.palette.primary.main}`,
                              pb: 0.5
                            }}
                          >
                            {contentType}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {perms.map((perm, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  p: 0.75,
                                  borderRadius: 1,
                                  '&:hover': {
                                    backgroundColor: theme.palette.action.hover
                                  }
                                }}
                              >
                                <Checkbox
                                  size="small"
                                  checked={true}
                                  disabled
                                  sx={{
                                    p: 0,
                                    color: theme.palette.success.main,
                                    '&.Mui-disabled': {
                                      color: theme.palette.success.main
                                    }
                                  }}
                                />
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                  {perm.name.split('|').pop()?.trim() || perm.name}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                          <Chip
                            label={`${perms.length} permissions`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 1.5 }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                    <Typography>No permissions assigned to this role</Typography>
                  </Box>
                )}
              </Box>
            )}
            <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.divider, my: 0.8 }} />
          </Box>
        ))
      )}

      {/* Edit Modal */}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} fullWidth={true} maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', m: 3, mb: 1 }}>
          <Typography variant="h3">Edit Role</Typography>

          <motion.div
            whileHover={{
              rotate: 90
            }}
            transition={{ duration: 0.3 }}
            style={{ cursor: 'pointer', marginRight: 10 }}
            onClick={handleCloseEditModal}
          >
            <IconX size="1.4rem" stroke={2} />
          </motion.div>
        </Box>

        <DialogContent>
          <Box>
            <TextField label="Role Name" name="name" value={editedRole.name} onChange={handleEditChange} fullWidth margin="dense" />

            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h4" mb={1}>
                  Permissions
                </Typography>
              </Grid>

              <Grid item xs={12} mb={1}>
                <Search title="Search Permissions" filter={false} value={search} onChange={handleSearchingPermission}></Search>
              </Grid>
              {permLoading ? (
                <Grid container>
                  <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size={20} />
                  </Grid>
                </Grid>
              ) : Object.keys(allPermissions).length === 0 ? (
                <Grid item xs={12}>
                  <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                    No permissions available
                  </Typography>
                </Grid>
              ) : (
                Object.keys(filteredPermissions).map((type, index) => (
                  <Grid item xs={12} sm={6} md={4} xl={3} key={index}>
                    <DrogaCard
                      sx={{
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.01)'
                        }
                      }}
                    >
                      {filteredPermissions[type].map((permission) => (
                        <Box
                          key={permission.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1,
                            borderRadius: '2px',
                            transition: 'background-color 0.3s',
                            '&:hover': {
                              backgroundColor: '#f0f0f0'
                            }
                          }}
                        >
                          <Checkbox
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handlePermissionChange(permission.id)}
                          />

                          <Typography sx={{ ml: 1, cursor: 'pointer' }} onClick={() => handlePermissionChange(permission.id)}>
                            {permission.name}
                          </Typography>
                        </Box>
                      ))}
                    </DrogaCard>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Cancel</Button>
          <DrogaButton
            title={submitting ? <ActivityIndicator size={16} sx={{ color: 'white' }} /> : 'Save Changes'}
            onPress={handleSaveEdit}
            color="primary"
          />
        </DialogActions>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={openDetailModal} onClose={handleCloseDetailModal}>
        <DialogTitle>Role Details</DialogTitle>
        <DialogContent>
          <Typography variant="h6">Role Name:</Typography>
          <Typography>{selectedRole?.name}</Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Permissions:
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {(selectedRole?.permissions?.length ?? 0) === 0 ? (
              <Typography>No permissions assigned</Typography>
            ) : (
              selectedRole?.permissions?.map((perm) => <Chip key={perm.uuid} label={perm.name} sx={{ mr: 1, mb: 1 }} />)
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleTable;
