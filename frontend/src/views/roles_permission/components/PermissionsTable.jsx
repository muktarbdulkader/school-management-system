import React, { useState, useEffect } from 'react';
import { TableContainer, Paper, useTheme, Box, Typography, Grid, Divider, Tooltip } from '@mui/material';
import Backend from 'services/backend';
import Fallbacks from 'utils/components/Fallbacks';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import DrogaCard from 'ui-component/cards/DrogaCard';

const PermissionsTable = ({ onPermissionsFetch }) => {
  const theme = useTheme();
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [error, setError] = useState(false);
  const [permissionMap, setPermissionMap] = useState({});

  const handleFetchingPermissions = () => {
    setPermissionLoading(true);
    const token = localStorage.getItem('token');
    const Api = Backend.auth + Backend.permissions;
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
        setPermissionLoading(false);

        if (response.success) {
          const permissionsData = response.data;

          const grouped = permissionsData.reduce((acc, perm) => {
            const type = perm.name.split(':')[1];
            if (!acc[type]) {
              acc[type] = [];
            }
            acc[type].push({ name: perm.name, id: perm.uuid });
            return acc;
          }, {});

          const permissionMap = permissionsData.reduce((map, perm) => {
            map[perm.name] = perm.uuid;
            return map;
          }, {});

          setGroupedPermissions(grouped);
          setPermissionMap(permissionMap);
          onPermissionsFetch(permissionsData);
        } else {
          setError(true);
        }
      })
      .catch((error) => {
        setPermissionLoading(false);
        setError(true);
      });
  };

  useEffect(() => {
    handleFetchingPermissions();
  }, []);

  return (
    <TableContainer
      component={Paper}
      sx={{
        minHeight: '5dvh',
        margin: 0,
        marginTop: 0,
        paddingY: 4,
        backgroundColor: theme.palette.background.default
      }}
    >
      {permissionLoading ? (
        <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size={20} />
        </Box>
      ) : error ? (
        <Fallbacks severity="error" title="Server error" description="There is an error fetching Permissions" />
      ) : Object.keys(groupedPermissions).length === 0 ? (
        <Fallbacks
          severity="info"
          title="Permission not found"
          description="The list of added Permissions will be listed here"
          sx={{ paddingTop: 6 }}
        />
      ) : (
        <Grid container spacing={2}>
          {Object.keys(groupedPermissions).map((type) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={type}>
              <DrogaCard
                sx={{
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box>
                  {groupedPermissions[type].map((perm) => (
                    <Box
                      key={perm.id}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        marginBottom: 1,
                        padding: 0.5,
                        borderRadius: 1
                      }}
                    >
                      <Tooltip title={perm.name} placement="top">
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            maxWidth: '180px',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {perm.name}
                        </Typography>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </DrogaCard>
            </Grid>
          ))}
        </Grid>
      )}
    </TableContainer>
  );
};

export default PermissionsTable;
