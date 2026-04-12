import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Grid,
  List,
  ListItem,
  Chip,
  CircularProgress,
  Avatar,
  Stack,
  useTheme,
  Collapse,
  TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PropTypes from 'prop-types';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Backend from 'services/backend';
import React, { useEffect, useState } from 'react';
import GetToken from 'utils/auth-token';
import { toast, ToastContainer } from 'react-toastify';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { DotMenu } from 'ui-component/menu/DotMenu';
import AddIntraocularPressure from './AddIntraocularPressure';
import EditIntraocularPressure from './EditIntraocularPressure';

const IntraocularPressureTab = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [pressures, setPressures] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [selectedPressure, setSelectedPressure] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    last_page: 0,
    total: 0,
  });

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchPressures = async () => {
    setLoading(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.intraocularPressures}?page=${pagination.page + 1}&per_page=${pagination.per_page}&visit_id=${visit?.id}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to fetch intraocular pressures',
        );
      }

      if (data.success) {
        setPressures(data.data.data || []);
        const initialExpanded = {};
        data.data.data.forEach((item) => {
          initialExpanded[item.id] = false;
        });
        setExpandedItems(initialExpanded);
        setPagination((prev) => ({
          ...prev,
          last_page: data.data.last_page,
          total: data.data.total,
        }));
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPressure = async (pressureData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.intraocularPressures}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(pressureData),
      });
      const responseData = await response.json();

      if (!response.ok) {
        if (responseData?.data?.errors) {
          const allErrors = Object.values(responseData.data.errors)
            .flat()
            .join(', ');
          toast.error(allErrors);
        } else {
          throw new Error(
            responseData.message || 'Failed to add pressure measurement',
          );
        }
        return;
      }

      if (responseData.success) {
        toast.success('Pressure measurement added successfully');
        fetchPressures();
        setOpenAddModal(false);
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPressure = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.intraocularPressures}/${selectedPressure?.id}`;
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
        if (responseData?.data?.errors) {
          const allErrors = Object.values(responseData.data.errors)
            .flat()
            .join(', ');
          toast.error(allErrors);
        } else {
          throw new Error(
            responseData.message || 'Failed to add pressure measurement',
          );
        }
        return;
      }

      if (responseData.success) {
        toast.success('Pressure measurement updated successfully');
        fetchPressures();
        setOpenEditModal(false);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePressure = async (pressureId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.intraocularPressures}/${pressureId}`;
    const header = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'DELETE',
        headers: header,
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to delete pressure measurement',
        );
      }

      if (responseData.success) {
        toast.success('Pressure measurement deleted successfully');
        fetchPressures();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchPressures();
  }, [pagination.page, pagination.per_page]);

  const parseMethod = (method) => {
    if (!method) return 'Unknown';

    if (method.value && method.value.value === 'other' && method.other) {
      return method.other;
    }
    return method.value?.value || 'Unknown';
  };

  return (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={20} />
        </Box>
      ) : error ? (
        <ErrorPrompt
          title="Server Error"
          message="Unable to retrieve intraocular pressure measurements."
        />
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                >
                  <Typography variant="h6" fontWeight={600}>
                    Intraocular Pressure Measurements
                  </Typography>
                  <IconButton
                    color="primary"
                    sx={{
                      backgroundColor: theme.palette.primary.light,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                      },
                    }}
                    onClick={() => setOpenAddModal(true)}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>

                {pressures.length > 0 ? (
                  <>
                    <List disablePadding>
                      {pressures.map((pressure) => (
                        <React.Fragment key={pressure.id}>
                          <ListItem
                            sx={{
                              p: 0,
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <Box width="100%">
                              <Box
                                display="flex"
                                alignItems="center"
                                p={2}
                                onClick={() => toggleExpand(pressure.id)}
                                sx={{
                                  cursor: 'pointer',
                                  borderBottom: `1px solid ${theme.palette.divider}`,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    mr: 2,
                                    backgroundColor:
                                      theme.palette.primary.light,
                                    color: theme.palette.primary.dark,
                                  }}
                                >
                                  <DescriptionIcon />
                                </Avatar>
                                <Box flexGrow={1}>
                                  <Typography variant="subtitle1">
                                    {new Date(
                                      pressure.created_at,
                                    ).toLocaleDateString()}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Recorded by: {pressure.created_by}
                                  </Typography>
                                </Box>
                                <IconButton size="small">
                                  {expandedItems[pressure.id] ? (
                                    <ExpandLessIcon />
                                  ) : (
                                    <ExpandMoreIcon />
                                  )}
                                </IconButton>
                              </Box>
                              <Collapse
                                in={expandedItems[pressure.id]}
                                unmountOnExit
                              >
                                <Box p={3}>
                                  <Stack spacing={2}>
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1">
                                          <strong>Left Eye:</strong>{' '}
                                          {pressure.left_eye} mmHg
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1">
                                          <strong>Right Eye:</strong>{' '}
                                          {pressure.right_eye} mmHg
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1">
                                          <strong>Time of Measurement:</strong>{' '}
                                          {pressure.time_of_measurement}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1">
                                          <strong>Method:</strong>{' '}
                                          {parseMethod(pressure.method)}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </Stack>
                                </Box>
                              </Collapse>
                            </Box>
                            <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                              <DotMenu
                                onEdit={() => {
                                  setOpenEditModal(true);
                                  setSelectedPressure(pressure);
                                }}
                                onDelete={() =>
                                  handleDeletePressure(pressure.id)
                                }
                              />
                            </Box>
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </>
                ) : (
                  <Box p={3}>
                    <Fallbacks
                      severity="info"
                      title="No Pressure Measurements Found"
                      description="Intraocular pressure measurements will be listed here when available."
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              onPageChange={handleChangePage}
              rowsPerPage={pagination.per_page}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Grid>
        </Grid>
      )}

      <AddIntraocularPressure
        open={openAddModal}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddModal(false)}
        onSubmit={handleAddPressure}
        visit={visit}
      />

      <EditIntraocularPressure
        open={openEditModal}
        isSubmitting={isUpdating}
        onClose={() => setOpenEditModal(false)}
        onSubmit={handleEditPressure}
        pressure={selectedPressure}
        visit={visit}
      />
      <ToastContainer />
    </Box>
  );
};

IntraocularPressureTab.propTypes = {
  visit: PropTypes.object.isRequired,
};

export default IntraocularPressureTab;
