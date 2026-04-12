import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Collapse,
  TablePagination,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { DotMenu } from 'ui-component/menu/DotMenu';
import AddVisualAcuity from './AddVisualAcuity';
import EditVisualAcuity from './EditVisualAcuity';

const VisualAcuityTab = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [visualAcuities, setVisualAcuities] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [error, setError] = useState(false);
  const [openAddVisualAcuity, setOpenAddVisualAcuity] = useState(false);
  const [openEditVisualAcuity, setOpenEditVisualAcuity] = useState(false);
  const [selectedVisualAcuity, setSelectedVisualAcuity] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    last_page: 0,
    total: 0,
  });

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  const fetchVisualAcuities = async () => {
    setLoading(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.visualAcuities}?page=${pagination.page + 1}&per_page=${pagination.per_page}&visit_id=${visit?.id}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch visual acuities');
      }

      if (data.success) {
        setVisualAcuities(data.data.data || []);
        const initialExpanded = {};
        data.data.data.forEach((item) => {
          initialExpanded[item.id] = false;
        });
        setExpandedItems(initialExpanded);
        setPagination({
          ...pagination,
          last_page: data.data.last_page,
          total: data.data.total,
        });
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVisualAcuity = async (acuityData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.visualAcuities}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(acuityData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add visual acuity');
      }

      if (data.success) {
        toast.success('Visual acuity added successfully');
        fetchVisualAcuities();
        setOpenAddVisualAcuity(false);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVisualAcuity = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.visualAcuities}/${selectedVisualAcuity?.id}`;
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
          responseData.message || 'Failed to update Visual Acuity',
        );
      }

      if (responseData.success) {
        toast.success('Visual Acuity updated successfully');
        fetchVisualAcuities();
        setOpenEditVisualAcuity(false);
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteVisualAcuity = async (VisualAcuityId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.visualAcuities}/${VisualAcuityId}`;
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
          responseData.message || 'Failed to delete visual Acuities',
        );
      }
      if (responseData.success) {
        toast.success('visual Acuities deleted successfully');
        fetchVisualAcuities();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchVisualAcuities();
  }, [pagination.page, pagination.per_page]);

  const renderAcuityTable = (acuityData, title) => {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell align="right">OD (Right Eye)</TableCell>
                <TableCell align="right">OS (Left Eye)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row">
                  UCVA
                </TableCell>
                <TableCell align="right">
                  {acuityData?.distance_od?.ucva || '-'}
                </TableCell>
                <TableCell align="right">
                  {acuityData?.distance_os?.ucva || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  SCVA
                </TableCell>
                <TableCell align="right">
                  {acuityData?.distance_od?.scva || '-'}
                </TableCell>
                <TableCell align="right">
                  {acuityData?.distance_os?.scva || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  BCVA
                </TableCell>
                <TableCell align="right">
                  {acuityData?.distance_od?.bcva || '-'}
                </TableCell>
                <TableCell align="right">
                  {acuityData?.distance_os?.bcva || '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Visual Acuity Records
        </Typography>
        <IconButton
          color="primary"
          onClick={() => setOpenAddVisualAcuity(true)}
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
          message="Unable to retrieve visual acuity records."
        />
      ) : visualAcuities.length === 0 ? (
        <Fallbacks
          severity="info"
          title="No Visual Acuity Records Found"
          description="Patient visual acuity records will be listed here when available."
          sx={{ paddingTop: 6 }}
        />
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <List disablePadding>
              {visualAcuities.map((record, index) => (
                <React.Fragment key={record.id}>
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
                        onClick={() => toggleExpand(record.id)}
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
                        <Box flexGrow={1}>
                          <Typography variant="subtitle1">
                            {new Date(record.created_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Recorded by: {record.created_by}
                          </Typography>
                        </Box>
                        <IconButton size="small">
                          {expandedItems[record.id] ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </Box>
                      <Collapse in={expandedItems[record.id]} unmountOnExit>
                        <Box p={3}>
                          {renderAcuityTable(record, 'Distance Visual Acuity')}
                          {renderAcuityTable(record, 'Near Visual Acuity')}
                          {renderAcuityTable(record, 'Pupil Reaction')}
                        </Box>
                      </Collapse>
                    </Box>
                    <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                      <DotMenu
                        onEdit={() => {
                          setOpenEditVisualAcuity(true);
                          setSelectedVisualAcuity(record);
                        }}
                        onDelete={() => handleDeleteVisualAcuity(record.id)}
                      />
                    </Box>
                  </ListItem>
                  {index < visualAcuities.length - 1 && (
                    <Divider component="li" sx={{ mx: 3 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page}
            onPageChange={handleChangePage}
            rowsPerPage={pagination.per_page}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      )}

      <AddVisualAcuity
        open={openAddVisualAcuity}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddVisualAcuity(false)}
        onSubmit={handleAddVisualAcuity}
        visit={visit}
      />

      <EditVisualAcuity
        open={openEditVisualAcuity}
        isSubmitting={isSubmitting}
        onClose={() => setOpenEditVisualAcuity(false)}
        onSubmit={handleUpdateVisualAcuity}
        visualAcuity={selectedVisualAcuity}
      />

      <ToastContainer />
    </Box>
  );
};

export default VisualAcuityTab;
