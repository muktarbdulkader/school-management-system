import React, { useState } from 'react';
import { Box, Card, CardContent, Grid, Tabs, Tab } from '@mui/material';
import { toast } from 'react-toastify';
import AddRole from './components/AddRoles';
import RoleTable from './components/RoleTable';
import PermissionsTable from './components/PermissionsTable';
import Search from 'ui-component/search';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import AddButton from 'ui-component/buttons/AddButton';

const Page = () => {
  const [adding, setAdding] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState('roles');

  const handleAddRole = async (newRole, permissionData) => {
    try {
      setAdding(true);
      const token = localStorage.getItem('token');
      const allPermissions = Object.values(permissionData).flat(); // Flatten permissions if grouped by type
      const permissionsUUIDs = newRole.permissions
        .map((permissionName) => {
          const permissionObject = allPermissions.find((perm) => perm.name === permissionName);
          return permissionObject ? permissionObject.id : null;
        })
        .filter((uuid) => uuid !== null);

      const response = await fetch(`${Backend.auth + Backend.roles}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newRole.roleName,
          permissions: permissionsUUIDs
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to add role');
      }
    } catch (error) {
      toast.error('An error occurred while adding the role');
    } finally {
      setAdding(false);
    }
  };

  const handlePermissionsFetch = (fetchedPermissions) => {
    if (Array.isArray(fetchedPermissions)) {
      const grouped = fetchedPermissions.reduce((acc, perm) => {
        const type = perm.name.split(':')[1]; // Extract permission type from name
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push({ name: perm.name, id: perm.uuid });
        return acc;
      }, {});

      setPermissions(grouped);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <PageContainer maxWidth="lg" title="Role and Permission">
      <DrogaCard sx={{ marginLeft: '10px', marginTop: '20px' }}>
        <Box p={3}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            color="#003B73"
            backgroundColor="#003B73"
            aria-label="Role and Permissions Tabs"
          >
            <Tab value="roles" label="Roles" sx={{ fontSize: '17px' }} />
            <Tab value="permissions" label="Permissions" sx={{ fontSize: '17px' }} />
          </Tabs>

          {tabValue === 'roles' && (
            <Box mt={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Search value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <AddButton title={'Add Role'} variant="contained" color="primary" onPress={() => setOpenRoleModal(true)} />
                      </Box>

                      <RoleTable searchQuery={searchQuery} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <AddRole
                open={openRoleModal}
                handleClose={() => setOpenRoleModal(false)}
                permissions={permissions}
                onSave={handleAddRole}
                submitting={adding}
              />
            </Box>
          )}

          {tabValue === 'permissions' && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <PermissionsTable onPermissionsFetch={handlePermissionsFetch} />
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </DrogaCard>
    </PageContainer>
  );
};

export default Page;
