import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Box,
  Grid,
  Button,
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  DeleteOutlineOutlined as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatDate } from 'utils/function';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import EditCoaching from './components/EditCoaching';

import Fallbacks from 'utils/components/Fallbacks';
import MainCard from 'ui-component/cards/MainCard';
import { Stack } from '@mui/system';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import DeleteCoaching from './components/DeleteCoaching';

const CoachingTable = ({ feedBack, onRefresh }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  //   const [isSaving, setIsSaving] = useState(false);
  const [modalState, setModalState] = useState({
    openModal: false,
    submitting: false,
  });

  const state = useSelector((state) => state.customization.user);
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await GetToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const Api = `${Backend.api}${Backend.coaching}?employee_id=${state?.employee_id}&fiscal_year_id=${selectedYear?.id}`;

      // First check if the URL is correct
      console.log('Fetching from:', Api);

      const response = await fetch(Api, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        redirect: 'follow',
      });

      // Check for redirects
      if (response.redirected) {
        console.warn('Request was redirected to:', response.url);
      }

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = '';
        try {
          const errorResponse = await response.json();
          errorDetails = errorResponse.message || JSON.stringify(errorResponse);
        } catch (e) {
          errorDetails = await response.text();
        }
        throw new Error(
          `HTTP error! status: ${response.status}. Details: ${errorDetails}`,
        );
      }

      const result = await response.json();
      console.log('API Response:', result);

      // Process response data
      let responseData = [];
      if (result.data?.data) {
        responseData = result.data.data;
      } else if (Array.isArray(result.data)) {
        responseData = result.data;
      } else if (Array.isArray(result)) {
        responseData = result;
      } else if (result.data) {
        // Handle case where data is a single object
        responseData = [result.data];
      }

      setData(responseData || []);

      if (!result.success) {
        toast.warning(result.message || 'Failed to fetch coaching sessions');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to fetch coaching sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If feedBack prop is provided, use it directly
    if (feedBack && feedBack.length > 0) {
      setData(feedBack);
      setLoading(false);
      return;
    }

    // Otherwise fetch data
    if (state?.employee_id && selectedYear?.id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [feedBack, state?.employee_id, selectedYear?.id]);

  const handleEditClick = (item) => {
    setCurrentItem(item);
    setModalState((prev) => ({ ...prev, openModal: true }));
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.coaching}/${itemToDelete.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success('Coaching session deleted successfully');
        onRefresh();
      } else {
        toast.error(result.message || 'Failed to delete coaching session');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete coaching session');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSaveCoaching = async (updatedData) => {
    setModalState((prev) => ({ ...prev, submitting: true }));
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.coaching}/${currentItem.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updatedData,
            employee_id: state?.employee_id,
            fiscal_year_id: selectedYear?.id,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Coaching session updated successfully');
        onRefresh();
      } else {
        throw new Error(result.message || 'Failed to update coaching session');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update coaching session');
    } finally {
      setModalState((prev) => ({
        ...prev,
        submitting: false,
        openModal: false,
      }));
    }
  };

  return (
    <MainCard border={true} content={false} boxShadow>
      <Grid container>
        <Grid item xs={12}>
          <Grid
            container
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ pt: 2, px: 2 }}
          >
            <Grid item>
              <Stack direction="row" spacing={2}>
                <Typography variant="h4">Coaching Sessions</Typography>
              </Stack>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ p: 2, height: '64.6dvh', overflowY: 'auto' }}>
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress />
              </Box>
            ) : error ? (
              <ErrorPrompt
                title="Server Error"
                message="There was an error loading coaching sessions"
                size={100}
              />
            ) : data.length === 0 ? (
              <Fallbacks
                severity="info"
                title="No coaching sessions found"
                description="There are no coaching sessions available for the selected employee and fiscal year"
                sx={{ paddingTop: 6 }}
                size={100}
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data.map((entry, index) => (
                  <Box
                    key={entry.id || index}
                    sx={{
                      width: '100%',
                      borderLeft: '4px solid',
                      p: 2,
                      border: '0.5px solid grey',
                      borderRadius: 4,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" mb={1}>
                          {entry.title || `Coaching Session #${index + 1}`}
                        </Typography>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Typography variant="caption" color="gray">
                            Created:
                          </Typography>
                          <Typography variant="caption">
                            {entry?.created_at
                              ? formatDate(entry?.created_at).formattedDate
                              : ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          sx={{
                            p: 0.8,
                            bgcolor: '#2F78EE',
                            borderRadius: 2,
                            '&:hover': { backgroundColor: '#2a71e3' },
                          }}
                          onClick={() => handleEditClick(entry)}
                        >
                          <EditIcon fontSize="small" sx={{ color: 'white' }} />
                        </IconButton>
                        <IconButton
                          sx={{ p: 0.8, bgcolor: '#E03137', borderRadius: 2 }}
                          onClick={() => handleDeleteClick(entry)}
                        >
                          <DeleteIcon
                            fontSize="small"
                            sx={{ color: 'white' }}
                          />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">{entry.body}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      <EditCoaching
        open={modalState.openModal}
        onClose={() => setModalState((prev) => ({ ...prev, openModal: false }))}
        item={currentItem}
        onSave={handleSaveCoaching}
        loading={modalState.submitting}
      />

      <DeleteCoaching
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </MainCard>
  );
};

CoachingTable.propTypes = {
  onRefresh: PropTypes.func,
  feedBack: PropTypes.array,
};

export default CoachingTable;
