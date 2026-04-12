import React, { useCallback, useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  Avatar,
  useTheme,
  TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { DotMenu } from 'ui-component/menu/DotMenu';
import PropTypes from 'prop-types';
import AddInitialImpressions from './AddInitialImpressions';
import EditInitialImpressions from './EditInitialImpressions';

// import AddInitialImpression from './AddInitialImpression';
// import EditInitialImpression from './EditInitialImpression';

const InitialImpressionsTab = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [impressions, setImpressions] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
  });
  const [meta, setMeta] = useState({
    last_page: 0,
    total: 0,
  });

  const [openAddImpression, setOpenAddImpression] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedImpression, setSelectedImpression] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleFetchingImpressions = useCallback(async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.initialImpressions}?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}&visit_id=${visit?.id}`;
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
          responseData.message || 'Failed to fetch initial impressions',
        );
      }

      if (responseData.success) {
        setImpressions(responseData.data.data);
        setPagination({
          ...pagination,
        });
        setMeta({
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
  }, [pagination.page, pagination.per_page, search, visit?.id]);

  const handleAddImpression = async (impressionData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.initialImpressions}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(impressionData),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to add initial impression',
        );
      }

      if (responseData.success) {
        toast.success('Initial impression added successfully');
        handleFetchingImpressions();
        setOpenAddImpression(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateImpression = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.initialImpressions}/${selectedImpression?.id}`;
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
        throw new Error(
          responseData.message || 'Failed to update initial impression',
        );
      }

      if (responseData.success) {
        toast.success('Initial impression updated successfully');
        handleFetchingImpressions();
        setEditModalOpen(false);
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
      setSelectedImpression(null);
    }
  };

  const handleDeleteImpression = async (impressionId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.initialImpressions}/${impressionId}`;
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
          responseData.message || 'Failed to delete initial impression',
        );
      }
      if (responseData.success) {
        toast.success('Initial impression deleted successfully');
        handleFetchingImpressions();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingImpressions();
    }, 800);
    return () => clearTimeout(debounceTimeout);
  }, [search]);

  useEffect(() => {
    if (mounted) {
      handleFetchingImpressions();
    } else {
      setMounted(true);
    }
  }, [pagination.page, pagination.per_page]);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Initial Impressions
        </Typography>
        <IconButton
          color="primary"
          aria-label="add initial impression"
          onClick={() => setOpenAddImpression(true)}
          sx={{
            backgroundColor: theme.palette.primary.light,
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
              color: 'white',
            },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={20} />
        </Box>
      ) : error ? (
        <ErrorPrompt
          title="Server Error"
          message="Unable to retrieve initial impressions."
        />
      ) : impressions.length === 0 ? (
        <Fallbacks
          severity="info"
          title="No Initial Impressions Found"
          description="Initial impressions will be listed here when available."
          sx={{ paddingTop: 6 }}
        />
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <List disablePadding>
              {impressions.map((impression, index) => (
                <React.Fragment key={impression.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      p: 3,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
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
                    <ListItemText
                      primary={
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="subtitle1"
                            component="div"
                            sx={{ mb: 1 }}
                          >
                            <strong>Primary Diagnosis: </strong>
                            {impression.primary_diagnosis}
                          </Typography>
                          <Typography
                            variant="body1"
                            component="div"
                            sx={{ mb: 1 }}
                          >
                            <strong>Plan: </strong>
                            {impression.plan}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            flexWrap="wrap"
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <strong>Created: </strong>
                              <Chip
                                icon={<EventIcon fontSize="small" />}
                                label={new Date(
                                  impression.created_at,
                                ).toLocaleDateString()}
                                size="small"
                                variant="outlined"
                                sx={{
                                  ml: 1,
                                  backgroundColor: theme.palette.grey[100],
                                }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              <strong>By: </strong>
                              {impression.created_by}
                            </Typography>
                          </Stack>
                        </Box>
                      }
                    />
                    <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                      <DotMenu
                        onEdit={() => {
                          setEditModalOpen(true);
                          setSelectedImpression(impression);
                        }}
                        onDelete={() => handleDeleteImpression(impression.id)}
                      />
                    </Box>
                  </ListItem>
                  {index < impressions.length - 1 && (
                    <Divider component="li" sx={{ mx: 3 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
          <TablePagination
            component="div"
            count={meta.total}
            page={pagination.page}
            onPageChange={handleChangePage}
            rowsPerPage={pagination.per_page}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Card>
      )}

      <AddInitialImpressions
        open={openAddImpression}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddImpression(false)}
        onSubmit={handleAddImpression}
        visit={visit}
      />

      <EditInitialImpressions
        open={editModalOpen}
        isSubmitting={isUpdating}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateImpression}
        initialData={selectedImpression}
      />

      <ToastContainer />
    </Box>
  );
};

InitialImpressionsTab.propTypes = {
  visit: PropTypes.object.isRequired,
};

export default InitialImpressionsTab;
