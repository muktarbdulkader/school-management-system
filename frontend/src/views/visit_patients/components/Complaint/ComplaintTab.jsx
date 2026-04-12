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
import AddComplaint from './AddComplaint';
import EditComplaint from './EditComplaint';

const ComplaintTab = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [complaints, setComplaints] = React.useState([]);
  const [mounted, setMounted] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
  });
  const [meta, setMeta] = useState({
    last_page: 0,
    total: 0,
  });

  const [openAddComplaint, setOpenAddComplaint] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const handleFetchingComplaints = useCallback(async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.complaints}?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}&visit_id=${visit?.id}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch complaints');
      }

      if (responseData.success) {
        setComplaints(responseData.data.data);
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

  const handleAddComplaint = async (complaintData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.complaints}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(complaintData),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to add complaint');
      }

      if (responseData.success) {
        toast.success('Complaint added successfully');
        handleFetchingComplaints();
        setOpenAddComplaint(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComplaint = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.complaints}/${selectedComplaint?.id}`;
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
        throw new Error(responseData.message || 'Failed to update patient');
      }

      if (responseData.success) {
        toast.success('Patient updated successfully');
        handleFetchingComplaints();
        setEditModalOpen(false);
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
      setSelectedComplaint(null);
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.complaints}/${complaintId}`;
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
        handleFetchingComplaints();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingComplaints();
    }, 800);
    return () => clearTimeout(debounceTimeout);
  }, [search]);

  useEffect(() => {
    if (mounted) {
      handleFetchingComplaints();
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
          Patient Complaints
        </Typography>
        <IconButton
          color="primary"
          aria-label="add complaint"
          onClick={() => setOpenAddComplaint(true)}
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
          message="Unable to retrieve complaints."
        />
      ) : complaints.length === 0 ? (
        <Fallbacks
          severity="info"
          title="No Complaints Found"
          description="Patient complaints will be listed here when available."
          sx={{ paddingTop: 6 }}
        />
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <List disablePadding>
              {complaints.map((complaint, index) => (
                <React.Fragment key={complaint.id}>
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
                            <strong>Primary Complaint: </strong>
                            {complaint.primary_complaint}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            flexWrap="wrap"
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <strong>Visit Date: </strong>
                              <Chip
                                icon={<EventIcon fontSize="small" />}
                                label={new Date(
                                  complaint.visit_date,
                                ).toLocaleDateString()}
                                size="small"
                                variant="outlined"
                                sx={{
                                  ml: 1,
                                  backgroundColor: theme.palette.grey[100],
                                }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                <strong>Creator: </strong>
                                {complaint.created_by}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              <strong>Recorded: </strong>
                              {new Date(complaint.created_at).toLocaleString()}
                            </Typography>
                          </Stack>
                        </Box>
                      }
                    />
                    <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                      <DotMenu
                        onEdit={() => {
                          setEditModalOpen(true);
                          setSelectedComplaint(complaint);
                        }}
                        // onView={() => console.log('View', complaint.id)}
                        onDelete={() => handleDeleteComplaint(complaint.id)}
                      />
                    </Box>
                  </ListItem>
                  {index < complaints.length - 1 && (
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

      <AddComplaint
        open={openAddComplaint}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddComplaint(false)}
        onSubmit={handleAddComplaint}
        visit={visit}
      />

      <EditComplaint
        open={editModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateComplaint}
        complaint={selectedComplaint}
      />

      <ToastContainer />
    </Box>
  );
};

export default ComplaintTab;
