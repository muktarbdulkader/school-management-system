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
  Pagination,
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
import AddMedicalHistories from './AddMedicalHistories';
import EditMedicalHistories from './EditMedicalHistories';

const MedicalHistory = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [medicalHistories, setMedicalHistories] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [openEditMedicalHistories, setOpenEditMedicalHistories] =
    React.useState(false);
  const [openAddMedicalHistories, setOpenAddMedicalHistories] =
    React.useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [selectedMedicalHistory, setSelectedMedicalHistory] =
    React.useState(null);
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

  const fetchMedicalHistories = async () => {
    setLoading(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.medicalHistories}?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}&visit_id=${visit?.id}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch medical histories');
      }

      if (data.success) {
        setMedicalHistories(data.data.data || []);
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

  const handleEditMedicalHistories = async (updatedHistoryData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.medicalHistories}/${selectedMedicalHistory?.id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'PATCH',
        headers: header,
        body: JSON.stringify(updatedHistoryData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to update Medical History',
        );
      }

      if (responseData.success) {
        toast.success('Medical History updated successfully');
        fetchMedicalHistories();
        setOpenEditMedicalHistories(false);
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddMedicalHistory = async (historyData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.medicalHistories}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(historyData),
      });
      const responseData = await response.json();

      if (!response.ok) {
        // Try to display detailed validation errors
        if (responseData?.data?.errors) {
          const allErrors = Object.values(responseData.data.errors)
            .flat()
            .join(', ');
          toast.error(allErrors);
        } else {
          // Fallback error message
          throw new Error(
            responseData.message || 'Failed to add medical histories',
          );
        }
        return;
      }

      if (responseData.success) {
        toast.success('medical histories added successfully');
        fetchMedicalHistories();
        setOpenAddMedicalHistories(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedicalHistory = async (selectedOcularHistoryId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.medicalHistories}/${selectedOcularHistoryId}`;
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
        throw new Error(
          responseData.message || 'Failed to delete Medical History',
        );
      }
      if (responseData.success) {
        toast.success('Medical History deleted successfully');
        fetchMedicalHistories();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchMedicalHistories();
  }, [pagination.page, pagination.per_page, search]);

  // useEffect(() => {
  //   if (mounted) {
  //     fetchMedicalHistories();
  //   } else {
  //     setMounted(true);
  //   }
  // }, [pagination.page, pagination.per_page]);

  return (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={20} />
        </Box>
      ) : error ? (
        <ErrorPrompt
          title="Server Error"
          message="Unable to retrieve Medical History."
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
                    Medical History
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
                  >
                    <AddIcon onClick={() => setOpenAddMedicalHistories(true)} />
                  </IconButton>
                </Box>

                {medicalHistories.length > 0 ? (
                  <>
                    <List disablePadding>
                      {medicalHistories.map((history) => (
                        <React.Fragment key={history.id}>
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
                                onClick={() => toggleExpand(history.id)}
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
                                      history.created_at,
                                    ).toLocaleDateString()}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Recorded by: {history.created_by}
                                  </Typography>
                                </Box>
                                <IconButton size="small">
                                  {expandedItems[history.id] ? (
                                    <ExpandLessIcon />
                                  ) : (
                                    <ExpandMoreIcon />
                                  )}
                                </IconButton>
                              </Box>
                              <Collapse
                                in={expandedItems[history.id]}
                                unmountOnExit
                              >
                                <Box p={3}>
                                  <Stack spacing={2}>
                                    <Box>
                                      <Typography variant="subtitle1">
                                        <strong>Systemic Conditions:</strong>
                                      </Typography>
                                      {history.systemic_conditions?.length >
                                      0 ? (
                                        <Box
                                          display="flex"
                                          flexWrap="wrap"
                                          gap={1}
                                          mt={1}
                                        >
                                          {history.systemic_conditions.map(
                                            (condition) => (
                                              <Chip
                                                key={condition}
                                                label={condition}
                                                size="small"
                                                variant="outlined"
                                              />
                                            ),
                                          )}
                                        </Box>
                                      ) : (
                                        <Typography variant="body2">
                                          None recorded
                                        </Typography>
                                      )}
                                    </Box>

                                    <Box>
                                      <Typography variant="subtitle1">
                                        <strong>Allergies:</strong>
                                      </Typography>
                                      {history.allergies?.length > 0 ? (
                                        <Box
                                          display="flex"
                                          flexWrap="wrap"
                                          gap={1}
                                          mt={1}
                                        >
                                          {history.allergies.map((allergy) => (
                                            <Chip
                                              key={allergy}
                                              label={allergy}
                                              size="small"
                                              variant="outlined"
                                              color="error"
                                            />
                                          ))}
                                        </Box>
                                      ) : (
                                        <Typography variant="body2">
                                          No known allergies
                                        </Typography>
                                      )}
                                    </Box>

                                    <Box>
                                      <Typography variant="subtitle1">
                                        <strong>
                                          Current Systemic Medication:
                                        </strong>
                                      </Typography>
                                      <Typography variant="body2">
                                        {history.current_systemic_medication ||
                                          'Not specified'}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>
                              </Collapse>
                            </Box>
                            <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                              <DotMenu
                                onEdit={() => {
                                  setOpenEditMedicalHistories(true);
                                  setSelectedMedicalHistory(history);
                                }}
                                onDelete={() =>
                                  handleDeleteMedicalHistory(history.id)
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
                      title="No Medical History Found"
                      description="Patient medical history will be listed here when available."
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

      <AddMedicalHistories
        open={openAddMedicalHistories}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddMedicalHistories(false)}
        onSubmit={handleAddMedicalHistory}
        visit={visit}
      />

      <EditMedicalHistories
        open={openEditMedicalHistories}
        isSubmitting={isSubmitting}
        onClose={() => setOpenEditMedicalHistories(false)}
        onSubmit={handleEditMedicalHistories}
        medicalHistory={selectedMedicalHistory}
        visit={visit}
      />
      <ToastContainer />
    </Box>
  );
};

MedicalHistory.propTypes = {
  visit: PropTypes.object,
};

export default MedicalHistory;
