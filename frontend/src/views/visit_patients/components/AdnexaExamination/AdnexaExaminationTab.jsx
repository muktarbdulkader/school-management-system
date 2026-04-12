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
import AddAdnexaExamination from './AddAdnexaExamination';
import EditAdnexaExamination from './EditAdnexaExamination';
import PropTypes from 'prop-types';

const AdnexaExaminationTab = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [adnexaExaminations, setAdnexaExaminations] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [error, setError] = useState(false);
  const [openAddAdnexaExamination, setOpenAddAdnexaExamination] =
    useState(false);
  const [openEditAdnexaExamination, setOpenEditAdnexaExamination] =
    useState(false);
  const [selectedAdnexaExamination, setSelectedAdnexaExamination] =
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

  const fetchAdnexaExaminations = async () => {
    setLoading(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.adnexaExamination}?page=${pagination.page + 1}&per_page=${pagination.per_page}&visit_id=${visit?.id}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch adnexa examinations');
      }

      if (data.success) {
        setAdnexaExaminations(data.data.data || []);
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

  const handleAddAdnexaExamination = async (examinationData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.adnexaExamination}`;
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
        // Try to display detailed validation errors
        if (data?.data?.errors) {
          const allErrors = Object.values(data.data.errors).flat().join(', ');
          toast.error(allErrors);
        } else {
          // Fallback error message
          throw new Error(data.message || 'Failed to add ocular history');
        }
        return;
      }

      if (data.success) {
        toast.success('Adnexa examination added successfully');
        fetchAdnexaExaminations();
        setOpenAddAdnexaExamination(false);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAdnexaExamination = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.adnexaExamination}/${selectedAdnexaExamination?.id}`;
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
          responseData.message || 'Failed to update Adnexa Examination',
        );
      }

      if (responseData.success) {
        toast.success('Adnexa Examination updated successfully');
        fetchAdnexaExaminations();
        setOpenEditAdnexaExamination(false);
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAdnexaExamination = async (examinationId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.adnexaExamination}/${examinationId}`;
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
          responseData.message || 'Failed to delete adnexa examination',
        );
      }
      if (responseData.success) {
        toast.success('Adnexa examination deleted successfully');
        fetchAdnexaExaminations();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchAdnexaExaminations();
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
                  Lids
                </TableCell>
                <TableCell align="right">
                  {examinationData.lids?.od?.value === 'Other'
                    ? examinationData.lids?.od?.other
                    : examinationData.lids?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.lids?.os?.value === 'Other'
                    ? examinationData.lids?.os?.other
                    : examinationData.lids?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Lashes
                </TableCell>
                <TableCell align="right">
                  {examinationData.lashes?.od?.value === 'Other'
                    ? examinationData.lashes?.od?.other
                    : examinationData.lashes?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.lashes?.os?.value === 'Other'
                    ? examinationData.lashes?.os?.other
                    : examinationData.lashes?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Conjunctiva
                </TableCell>
                <TableCell align="right">
                  {examinationData.conjunctiva?.od?.value === 'Other'
                    ? examinationData.conjunctiva?.od?.other
                    : examinationData.conjunctiva?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.conjunctiva?.os?.value === 'Other'
                    ? examinationData.conjunctiva?.os?.other
                    : examinationData.conjunctiva?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Sclera
                </TableCell>
                <TableCell align="right">
                  {examinationData.sclera?.od?.value === 'Other'
                    ? examinationData.sclera?.od?.other
                    : examinationData.sclera?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.sclera?.os?.value === 'Other'
                    ? examinationData.sclera?.os?.other
                    : examinationData.sclera?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Lacrimal System
                </TableCell>
                <TableCell align="right">
                  {examinationData.lacrimal_system?.od?.value === 'Other'
                    ? examinationData.lacrimal_system?.od?.other
                    : examinationData.lacrimal_system?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.lacrimal_system?.os?.value === 'Other'
                    ? examinationData.lacrimal_system?.os?.other
                    : examinationData.lacrimal_system?.os?.value || '-'}
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
          Adnexa Examination Records
        </Typography>
        <IconButton
          color="primary"
          onClick={() => setOpenAddAdnexaExamination(true)}
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
          message="Unable to retrieve adnexa examination records."
        />
      ) : adnexaExaminations.length === 0 ? (
        <Fallbacks
          severity="info"
          title="No Adnexa Examination Records Found"
          description="Patient adnexa examination records will be listed here when available."
          sx={{ paddingTop: 6 }}
        />
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <List disablePadding>
              {adnexaExaminations.map((record, index) => (
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
                          setOpenEditAdnexaExamination(true);
                          setSelectedAdnexaExamination(record);
                        }}
                        onDelete={() =>
                          handleDeleteAdnexaExamination(record.id)
                        }
                      />
                    </Box>
                  </ListItem>
                  {index < adnexaExaminations.length - 1 && (
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

      <AddAdnexaExamination
        open={openAddAdnexaExamination}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddAdnexaExamination(false)}
        onSubmit={handleAddAdnexaExamination}
        visit={visit}
      />

      <EditAdnexaExamination
        open={openEditAdnexaExamination}
        isSubmitting={isUpdating}
        onClose={() => setOpenEditAdnexaExamination(false)}
        onSubmit={handleUpdateAdnexaExamination}
        initialData={selectedAdnexaExamination}
      />

      <ToastContainer />
    </Box>
  );
};

AdnexaExaminationTab.propTypes = {
  visit: PropTypes.object.isRequired,
};

export default AdnexaExaminationTab;
