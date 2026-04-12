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
import PropTypes from 'prop-types';
import AddSlitLampExamination from './AddSlitLampExamination';
import EditSlitLampExamination from './EditSlitLampExamination';

const SlitLampExaminationTab = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [slitLampExaminations, setSlitLampExaminations] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [error, setError] = useState(false);
  const [openAddSlitLampExamination, setOpenAddSlitLampExamination] =
    useState(false);
  const [openEditSlitLampExamination, setOpenEditSlitLampExamination] =
    useState(false);
  const [selectedSlitLampExamination, setSelectedSlitLampExamination] =
    useState(null);
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

  const fetchSlitLampExaminations = async () => {
    setLoading(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.slitLampExaminations}?page=${pagination.page + 1}&per_page=${pagination.per_page}&visit_id=${visit?.id}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to fetch slit lamp examinations',
        );
      }

      if (data.success) {
        setSlitLampExaminations(data.data.data || []);
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

  const handleAddSlitLampExamination = async (examinationData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.slitLampExaminations}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(examinationData),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data?.data?.errors) {
          const allErrors = Object.values(data.data.errors).flat().join(', ');
          toast.error(allErrors);
        } else {
          throw new Error(
            data.message || 'Failed to add slit lamp examination',
          );
        }
        return;
      }

      if (data.success) {
        toast.success('Slit lamp examination added successfully');
        fetchSlitLampExaminations();
        setOpenAddSlitLampExamination(false);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSlitLampExamination = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.slitLampExaminations}/${selectedSlitLampExamination?.id}`;
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
          responseData.message || 'Failed to update Slit Lamp Examination',
        );
      }

      if (responseData.success) {
        toast.success('Slit Lamp Examination updated successfully');
        fetchSlitLampExaminations();
        setOpenEditSlitLampExamination(false);
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSlitLampExamination = async (examinationId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.slitLampExaminations}/${examinationId}`;
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
          responseData.message || 'Failed to delete slit lamp examination',
        );
      }
      if (responseData.success) {
        toast.success('Slit lamp examination deleted successfully');
        fetchSlitLampExaminations();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchSlitLampExaminations();
  }, [pagination.page, pagination.per_page]);

  const renderExaminationTable = (examinationData) => {
    return (
      <Box sx={{ mb: 3 }}>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Feature</TableCell>
                <TableCell align="right">OD (Right Eye)</TableCell>
                <TableCell align="right">OS (Left Eye)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row">
                  Cornea
                </TableCell>
                <TableCell align="right">
                  {examinationData.cornea?.od?.value === 'Other'
                    ? examinationData.cornea?.od?.other
                    : examinationData.cornea?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.cornea?.os?.value === 'Other'
                    ? examinationData.cornea?.os?.other
                    : examinationData.cornea?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Anterior Chamber
                </TableCell>
                <TableCell align="right">
                  {examinationData.anterior_chamber?.od?.value === 'Other'
                    ? examinationData.anterior_chamber?.od?.other
                    : examinationData.anterior_chamber?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.anterior_chamber?.os?.value === 'Other'
                    ? examinationData.anterior_chamber?.os?.other
                    : examinationData.anterior_chamber?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Iris
                </TableCell>
                <TableCell align="right">
                  {examinationData.iris?.od?.value === 'Synechiae'
                    ? `${examinationData.iris?.od?.value} (${examinationData.iris?.od?.synechiae_type})`
                    : examinationData.iris?.od?.value === 'Other'
                      ? examinationData.iris?.od?.other
                      : examinationData.iris?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.iris?.os?.value === 'Synechiae'
                    ? `${examinationData.iris?.os?.value} (${examinationData.iris?.os?.synechiae_type})`
                    : examinationData.iris?.os?.value === 'Other'
                      ? examinationData.iris?.os?.other
                      : examinationData.iris?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Lens
                </TableCell>
                <TableCell align="right">
                  {examinationData.lens?.od?.value === 'Cataract'
                    ? `${examinationData.lens?.od?.value} (${examinationData.lens?.od?.cataract_type})`
                    : examinationData.lens?.od?.value === 'IOL'
                      ? `${examinationData.lens?.od?.value} (${examinationData.lens?.od?.iol_type})`
                      : examinationData.lens?.od?.value === 'Other'
                        ? examinationData.lens?.od?.other
                        : examinationData.lens?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.lens?.os?.value === 'Cataract'
                    ? `${examinationData.lens?.os?.value} (${examinationData.lens?.os?.cataract_type})`
                    : examinationData.lens?.os?.value === 'IOL'
                      ? `${examinationData.lens?.os?.value} (${examinationData.lens?.os?.iol_type})`
                      : examinationData.lens?.os?.value === 'Other'
                        ? examinationData.lens?.os?.other
                        : examinationData.lens?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Vitreous
                </TableCell>
                <TableCell align="right">
                  {examinationData.vitreous?.od?.value === 'Other'
                    ? examinationData.vitreous?.od?.other
                    : examinationData.vitreous?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.vitreous?.os?.value === 'Other'
                    ? examinationData.vitreous?.os?.other
                    : examinationData.vitreous?.os?.value || '-'}
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
          Slit Lamp Examination Records
        </Typography>
        <IconButton
          color="primary"
          onClick={() => setOpenAddSlitLampExamination(true)}
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
          message="Unable to retrieve slit lamp examination records."
        />
      ) : slitLampExaminations.length === 0 ? (
        <Fallbacks
          severity="info"
          title="No Slit Lamp Examination Records Found"
          description="Patient slit lamp examination records will be listed here when available."
          sx={{ paddingTop: 6 }}
        />
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <List disablePadding>
              {slitLampExaminations.map((record, index) => (
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
                        <Box p={3}>{renderExaminationTable(record)}</Box>
                      </Collapse>
                    </Box>
                    <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                      <DotMenu
                        onEdit={() => {
                          setOpenEditSlitLampExamination(true);
                          setSelectedSlitLampExamination(record);
                        }}
                        onDelete={() =>
                          handleDeleteSlitLampExamination(record.id)
                        }
                      />
                    </Box>
                  </ListItem>
                  {index < slitLampExaminations.length - 1 && (
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

      <AddSlitLampExamination
        open={openAddSlitLampExamination}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddSlitLampExamination(false)}
        onSubmit={handleAddSlitLampExamination}
        visit={visit}
      />

      <EditSlitLampExamination
        open={openEditSlitLampExamination}
        isSubmitting={isUpdating}
        onClose={() => setOpenEditSlitLampExamination(false)}
        onSubmit={handleUpdateSlitLampExamination}
        initialData={selectedSlitLampExamination}
      />

      <ToastContainer />
    </Box>
  );
};

SlitLampExaminationTab.propTypes = {
  visit: PropTypes.object.isRequired,
};

export default SlitLampExaminationTab;
