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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
import AddOcularMotility from './AddOcularMotility';
import EditOcularMotility from './EditOcularMotility';
// import EditOcularMotility from './EditOcularMotility';

const OcularMotility = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [ocularMotilities, setOcularMotilities] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [openEditOcularMotility, setOpenEditOcularMotility] =
    React.useState(false);
  const [openAddOcularMotility, setOpenAddOcularMotility] =
    React.useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [selectedOcularMotility, setSelectedOcularMotility] =
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

  const fetchOcularMotilities = async () => {
    setLoading(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.ocularMotilities}?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}&visit_id=${visit?.id}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to fetch ocular motility examinations',
        );
      }

      if (data.success) {
        setOcularMotilities(data.data.data || []);
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

  const handleEditOcularMotility = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.ocularMotilities}/${selectedOcularMotility?.id}`;
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
          responseData.message ||
            'Failed to update ocular motility examination',
        );
      }

      if (responseData.success) {
        toast.success('Ocular motility examination updated successfully');
        fetchOcularMotilities();
        setOpenEditOcularMotility(false);
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddOcularMotility = async (motilityData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.ocularMotilities}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(motilityData),
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
            responseData.message || 'Failed to add ocular motility examination',
          );
        }
        return;
      }

      if (responseData.success) {
        toast.success('Ocular motility examination added successfully');
        fetchOcularMotilities();
        setOpenAddOcularMotility(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOcularMotility = async (motilityId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.ocularMotilities}/${motilityId}`;
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
          responseData.message ||
            'Failed to delete ocular motility examination',
        );
      }
      if (responseData.success) {
        toast.success('Ocular motility examination deleted successfully');
        fetchOcularMotilities();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchOcularMotilities();
  }, [pagination.page, pagination.per_page, search]);

  const renderExaminationDetails = (motility) => {
    return (
      <Box sx={{ p: 3 }}>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Test</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row">
                  Extraocular Movements (EOM)
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      <strong>Value:</strong> {motility.eom?.value || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Gaze:</strong> {motility.eom?.gaze || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Eye:</strong> {motility.eom?.eye || '-'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Hirschberg Test
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      <strong>Value:</strong>{' '}
                      {motility.hirschberg_test?.value || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Eye:</strong>{' '}
                      {motility.hirschberg_test?.eye || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Deviation:</strong>{' '}
                      {motility.hirschberg_test?.deviation || '-'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Cover/Uncover Test
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      <strong>Value:</strong>{' '}
                      {motility.cover_uncover_test?.value || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phoria:</strong>{' '}
                      {motility.cover_uncover_test?.phoria || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tropia:</strong>{' '}
                      {motility.cover_uncover_test?.tropia || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Direction:</strong>{' '}
                      {motility.cover_uncover_test?.direction || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Distance:</strong>{' '}
                      {motility.cover_uncover_test?.distance || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Near:</strong>{' '}
                      {motility.cover_uncover_test?.near || '-'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Stereopsis
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      <strong>Value:</strong>{' '}
                      {motility.stereopsis?.value || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Test:</strong> {motility.stereopsis?.test || '-'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
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
          message="Unable to retrieve ocular motility examinations."
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
                    Ocular Motility Examinations
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
                    onClick={() => setOpenAddOcularMotility(true)}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>

                {ocularMotilities.length > 0 ? (
                  <List disablePadding>
                    {ocularMotilities.map((motility) => (
                      <React.Fragment key={motility.id}>
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
                              onClick={() => toggleExpand(motility.id)}
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
                                  {new Date(
                                    motility.created_at,
                                  ).toLocaleDateString()}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Recorded by: System
                                </Typography>
                              </Box>
                              <IconButton size="small">
                                {expandedItems[motility.id] ? (
                                  <ExpandLessIcon />
                                ) : (
                                  <ExpandMoreIcon />
                                )}
                              </IconButton>
                            </Box>
                            <Collapse
                              in={expandedItems[motility.id]}
                              unmountOnExit
                            >
                              {renderExaminationDetails(motility)}
                            </Collapse>
                          </Box>
                          <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                            <DotMenu
                              onEdit={() => {
                                setOpenEditOcularMotility(true);
                                setSelectedOcularMotility(motility);
                              }}
                              onDelete={() =>
                                handleDeleteOcularMotility(motility.id)
                              }
                            />
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box p={3}>
                    <Fallbacks
                      severity="info"
                      title="No Ocular Motility Examinations Found"
                      description="Patient ocular motility examinations will be listed here when available."
                    />
                  </Box>
                )}
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
          </Grid>
        </Grid>
      )}

      <AddOcularMotility
        open={openAddOcularMotility}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddOcularMotility(false)}
        onSubmit={handleAddOcularMotility}
        visit={visit}
      />

      <EditOcularMotility
        open={openEditOcularMotility}
        isSubmitting={isSubmitting}
        onClose={() => setOpenEditOcularMotility(false)}
        onSubmit={handleEditOcularMotility}
        initialData={selectedOcularMotility}
      />
      <ToastContainer />
    </Box>
  );
};

OcularMotility.propTypes = {
  visit: PropTypes.object,
};

export default OcularMotility;
