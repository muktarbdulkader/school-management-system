import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Avatar,
  Divider,
  Stack,
  useTheme,
  Collapse,
  TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Backend from 'services/backend';
import React, { useEffect, useState } from 'react';
import GetToken from 'utils/auth-token';
import { toast, ToastContainer } from 'react-toastify';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import AddOcularHistory from './AddOcularHistory';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { hi } from 'date-fns/locale';
import { Edit } from '@mui/icons-material';
import EditOcularHistory from './EditOcularHistory';
import MedicalHistory from './MedicalHistory';

const HistoryTab = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [ocularHistories, setOcularHistories] = React.useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [mounted, setMounted] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [openAddOcularHistory, setOpenAddOcularHistory] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openEditOcularHistory, setOpenEditOcularHistory] =
    React.useState(false);
  const [selectedOcularHistory, setSelectedOcularHistory] =
    React.useState(null);
  const [pagination, setPagination] = React.useState({
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

  const handleFetchingOcularHistory = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.ocularHistories}?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}&visit_id=${visit?.id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to fetch ocular history',
        );
      }

      if (responseData.success) {
        setOcularHistories(responseData.data.data || []);
        const initialExpanded = {};
        responseData.data.data.forEach((item) => {
          initialExpanded[item.id] = false;
        });
        setExpandedItems(initialExpanded);
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

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingOcularHistory();
    }, 800);
    return () => clearTimeout(debounceTimeout);
  }, [search]);

  const handleAddOcularHistory = async (historyData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.ocularHistories}`;
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
            responseData.message || 'Failed to add ocular history',
          );
        }
        return;
      }

      if (responseData.success) {
        toast.success('ocular history added successfully');
        handleFetchingOcularHistory();
        setOpenAddOcularHistory(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOcularHistory = async (updatedHistoryData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.ocularHistories}/${selectedOcularHistory?.id}`;
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
          responseData.message || 'Failed to update ocular history',
        );
      }

      if (responseData.success) {
        toast.success('ocular history updated successfully');
        handleFetchingOcularHistory();
        setOpenEditOcularHistory(false);
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteHistory = async (selectedOcularHistoryId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.ocularHistories}/${selectedOcularHistoryId}`;
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
        throw new Error(responseData.message || 'Failed to delete complaint');
      }
      if (responseData.success) {
        toast.success('Complaint deleted successfully');
        handleFetchingOcularHistory();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (mounted) {
      handleFetchingOcularHistory();
    } else {
      setMounted(true);
    }
  }, [pagination.page, pagination.per_page]);

  return (
    <Box sx={{ p: 3 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={20} />
        </Box>
      ) : error ? (
        <ErrorPrompt
          title="Server Error"
          message="Unable to retrieve ocular history."
        />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Ocular History
                  </Typography>
                  <IconButton
                    color="primary"
                    aria-label="add ocular history"
                    sx={{
                      backgroundColor: theme.palette.primary.light,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                      },
                    }}
                  >
                    <AddIcon onClick={() => setOpenAddOcularHistory(true)} />
                  </IconButton>
                </Box>

                {ocularHistories.length > 0 ? (
                  <List disablePadding>
                    {ocularHistories.map((history, index) => (
                      <React.Fragment key={history.id}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{
                            p: 0,
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
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
                                  backgroundColor: theme.palette.primary.light,
                                  color: theme.palette.primary.dark,
                                }}
                              >
                                <DescriptionIcon />
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
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
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box p={3}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography
                                    variant="subtitle1"
                                    component="div"
                                  >
                                    <strong>Current Ocular Medication: </strong>
                                    {history.current_oscular_medication ||
                                      'Not specified'}
                                  </Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Stack spacing={2}>
                                  <Box>
                                    <Typography variant="body2">
                                      <strong>Contact Lens Use: </strong>
                                      {history.current_contact_lense_use
                                        ? 'Yes'
                                        : 'No'}
                                    </Typography>
                                    {history.current_contact_lense_use && (
                                      <Typography variant="body2">
                                        <strong>Lens Type: </strong>
                                        {history.lens_type || 'Not specified'}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      <strong>Family History: </strong>
                                    </Typography>
                                    {history.family_history?.length > 0 ? (
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          gap: 0.5,
                                        }}
                                      >
                                        {history.family_history.map(
                                          (condition) => (
                                            <Chip
                                              key={condition}
                                              label={condition}
                                              size="small"
                                              variant="outlined"
                                              sx={{
                                                backgroundColor:
                                                  theme.palette.grey[100],
                                              }}
                                            />
                                          ),
                                        )}
                                      </Box>
                                    ) : (
                                      'No family history recorded'
                                    )}
                                  </Box>
                                </Stack>
                              </Box>
                            </Collapse>
                          </Box>
                          <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                            <DotMenu
                              onEdit={() => {
                                setOpenEditOcularHistory(true);
                                setSelectedOcularHistory(history);
                              }}
                              onDelete={() => {
                                handleDeleteHistory(history.id);
                              }}
                            />
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3 }}>
                    <Fallbacks
                      severity="info"
                      title="No Ocular History Found"
                      description="Patient ocular history will be listed here when available."
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

          <Grid item xs={12} md={6}>
            <MedicalHistory visit={visit} />
          </Grid>
        </Grid>
      )}
      <AddOcularHistory
        open={openAddOcularHistory}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddOcularHistory(false)}
        onSubmit={handleAddOcularHistory}
        visit={visit}
      />

      <EditOcularHistory
        open={openEditOcularHistory}
        isSubmitting={isSubmitting}
        onClose={() => setOpenEditOcularHistory(false)}
        onSubmit={handleEditOcularHistory}
        ocularHistory={selectedOcularHistory}
      />
      <ToastContainer />
    </Box>
  );
};

export default HistoryTab;
