import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { Modal, Box, Button, TextField, Checkbox, FormControlLabel, CircularProgress, Typography, Grid } from '@mui/material';
import { toast } from 'react-toastify';
import { Formik, Form, Field, FieldArray } from 'formik';
import { motion } from 'framer-motion';
import Fallbacks from 'utils/components/Fallbacks';
import * as Yup from 'yup';
import DrogaCard from 'ui-component/cards/DrogaCard';
import Search from 'ui-component/search';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import { IconX } from '@tabler/icons-react';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const roleSchema = Yup.object().shape({
  roleName: Yup.string().required('Role name is required'),
  permissions: Yup.array().of(Yup.string()).min(1, 'At least one permission is required')
});

const AddRole = ({ open, handleClose, onSave, submitting }) => {
  const [search, setSearch] = useState('');
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(false);

  const handleSearchingPermission = (event) => {
    const value = event.target.value;
    setSearch(value);
  };

  const filteredPermissions = Object.keys(permissions).reduce((acc, type) => {
    const filtered = permissions[type].filter((perm) => perm.name.toLowerCase().includes(search.toLowerCase()));
    if (filtered.length > 0) {
      acc[type] = filtered;
    }
    return acc;
  }, {});

  const handleFetchingPermissions = async () => {
    setPermissionLoading(true);
    const token = await GetToken();
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
        if (response.success) {
          const permissionsData = response.data;

          const grouped = permissionsData.reduce((acc, perm) => {
            // Extract content type from permission name (e.g., "users | role | Can add role")
            const parts = perm.name.split('|');
            const type = parts.length >= 2 ? parts.slice(0, 2).join(' | ') : (perm.content_type || 'General');
            if (!acc[type]) {
              acc[type] = [];
            }
            acc[type].push({ name: perm.name, id: perm.id || perm.uuid });

            return acc;
          }, {});

          setPermissions(grouped);
        }
      })
      .catch(() => { })
      .finally(() => setPermissionLoading(false));
  };

  useEffect(() => {
    handleFetchingPermissions();
  }, []);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }}
      fullWidth={true}
      maxWidth="lg"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          maxHeight: '80vh',
          overflowY: 'auto',
          transform: 'translate(-50%, -50%)',
          width: '50%',
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2,
          p: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h3">Add Role</Typography>

          <motion.div
            whileHover={{
              rotate: 90
            }}
            transition={{ duration: 0.3 }}
            style={{ cursor: 'pointer', marginRight: 10 }}
            onClick={handleClose}
          >
            <IconX size="1.4rem" stroke={2} />
          </motion.div>
        </Box>
        <Formik
          initialValues={{ roleName: '', permissions: [] }}
          validationSchema={roleSchema}
          onSubmit={(values, { setSubmitting, setFieldError }) => {
            if (values.permissions.length === 0) {
              setFieldError('permissions', 'Please select at least one permission.');
              setSubmitting(false);
              return;
            }

            onSave(values, permissions)
              .then(() => {
                handleClose();
                toast.success('Role created successfully');
              })
              .catch(() => {
                toast.error('Failed to save role. Please try again.');
              })
              .finally(() => {
                setSubmitting(false);
              });
          }}
        >
          {({ values, setFieldValue, errors, touched }) => (
            <Form>
              <TextField
                name="roleName"
                label="New Role"
                value={values.roleName}
                onChange={(e) => setFieldValue('roleName', e.target.value)}
                error={touched.roleName && Boolean(errors.roleName)}
                helperText={touched.roleName && errors.roleName}
                margin="normal"
                fullWidth
                sx={{ my: 2 }}
              />

              <Typography variant="h4" my={2}>
                Attach Permissions
              </Typography>

              <Search title="Search Permissions" filter={false} value={search} onChange={handleSearchingPermission}></Search>

              <Grid container spacing={2} mt={0.5}>
                {permissionLoading ? (
                  <Box
                    sx={{
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CircularProgress size={20} />
                  </Box>
                ) : error ? (
                  <Fallbacks severity="error" title="Server error" description="There is an error fetching Permissions" />
                ) : Object.keys(permissions).length === 0 ? (
                  <Fallbacks
                    severity="info"
                    title="No Permissions Found"
                    description="The list of added Permissions will be listed here"
                    sx={{ paddingTop: 6 }}
                  />
                ) : (
                  <FieldArray
                    name="permissions"
                    render={() =>
                      Object.keys(filteredPermissions).map((type) => (
                        <Grid item xs={12} sm={6} md={4} xl={3} key={type}>
                          <DrogaCard sx={{ mb: 1 }}>
                            {filteredPermissions[type].map((perm) => (
                              <FormControlLabel
                                key={perm.id}
                                control={
                                  <Field
                                    type="checkbox"
                                    name="permissions"
                                    value={perm.name}
                                    as={Checkbox}
                                    checked={values.permissions.includes(perm.name)}
                                    onChange={() => {
                                      if (values.permissions.includes(perm.name)) {
                                        setFieldValue(
                                          'permissions',
                                          values.permissions.filter((p) => p !== perm.name)
                                        );
                                      } else {
                                        setFieldValue('permissions', [...values.permissions, perm.name]);
                                      }
                                    }}
                                  />
                                }
                                label={perm.name}
                              />
                            ))}
                          </DrogaCard>
                        </Grid>
                      ))
                    }
                  />
                )}
              </Grid>

              <Grid container>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Button
                    onClick={() => {
                      resetForm();
                      handleClose();
                    }}
                    variant=""
                    sx={{ mt: 2, mr: 2 }}
                  >
                    Cancel
                  </Button>

                  <DrogaButton
                    title={submitting ? <ActivityIndicator size={16} sx={{ color: 'white' }} /> : 'Submit'}
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
              {errors.permissions && touched.permissions && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{
                    mt: 2,
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid red',
                    textAlign: 'center'
                  }}
                >
                  {errors.permissions}
                </Typography>
              )}
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
};

export default AddRole;
