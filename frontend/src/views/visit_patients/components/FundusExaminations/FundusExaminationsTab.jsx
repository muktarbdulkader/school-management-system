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
// import AddFundusExamination from './AddFundusExamination';
// import EditFundusExamination from './EditFundusExamination';
import PropTypes from 'prop-types';
import AddFundusExaminations from './AddFundusExaminations';
import EditFundusExaminations from './EditFundusExaminations';

const FundusExaminationsTab = ({ visit }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [fundusExaminations, setFundusExaminations] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [error, setError] = useState(false);
  const [openAddFundusExamination, setOpenAddFundusExamination] =
    useState(false);
  const [openEditFundusExamination, setOpenEditFundusExamination] =
    useState(false);
  const [selectedFundusExamination, setSelectedFundusExamination] =
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

  const fetchFundusExaminations = async () => {
    setLoading(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.fundusExaminations}?page=${pagination.page + 1}&per_page=${pagination.per_page}&visit_id=${visit?.id}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch fundus examinations');
      }

      if (data.success) {
        setFundusExaminations(data.data.data || []);
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

  const handleAddFundusExamination = async (examinationData) => {
    setIsSubmitting(true);
    const token = await GetToken();
    const url = `${Backend.auth}${Backend.fundusExaminations}`;
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
          throw new Error(data.message || 'Failed to add fundus examination');
        }
        return;
      }

      if (data.success) {
        toast.success('Fundus examination added successfully');
        fetchFundusExaminations();
        setOpenAddFundusExamination(false);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFundusExamination = async (updatedData) => {
    setIsUpdating(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.fundusExaminations}/${selectedFundusExamination?.id}`;
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
          responseData.message || 'Failed to update Fundus Examination',
        );
      }

      if (responseData.success) {
        toast.success('Fundus Examination updated successfully');
        fetchFundusExaminations();
        setOpenEditFundusExamination(false);
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteFundusExamination = async (examinationId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.fundusExaminations}/${examinationId}`;
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
          responseData.message || 'Failed to delete fundus examination',
        );
      }
      if (responseData.success) {
        toast.success('Fundus examination deleted successfully');
        fetchFundusExaminations();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchFundusExaminations();
  }, [pagination.page, pagination.per_page]);

  const renderExaminationTable = (examinationData) => {
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Dilated: {examinationData.dilated?.value || 'No'}
          </Typography>
          {examinationData.dilated?.value === 'Yes' && (
            <Typography variant="body2" color="text.secondary">
              {examinationData.dilated?.time &&
                `Time: ${examinationData.dilated.time}`}
              {examinationData.dilated?.drops &&
                ` | Drops: ${examinationData.dilated.drops}`}
            </Typography>
          )}
        </Box>

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
                  Optic Disc
                </TableCell>
                <TableCell align="right">
                  {examinationData.optic_disc?.od?.value === 'Other'
                    ? examinationData.optic_disc?.od?.other
                    : examinationData.optic_disc?.od?.value === 'Cupping'
                      ? `${examinationData.optic_disc?.od?.value} (${examinationData.optic_disc?.od?.cupping})`
                      : examinationData.optic_disc?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.optic_disc?.os?.value === 'Other'
                    ? examinationData.optic_disc?.os?.other
                    : examinationData.optic_disc?.os?.value === 'Cupping'
                      ? `${examinationData.optic_disc?.os?.value} (${examinationData.optic_disc?.os?.cupping})`
                      : examinationData.optic_disc?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Macula
                </TableCell>
                <TableCell align="right">
                  {examinationData.macula?.od?.value === 'Other'
                    ? examinationData.macula?.od?.other
                    : examinationData.macula?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.macula?.os?.value === 'Other'
                    ? examinationData.macula?.os?.other
                    : examinationData.macula?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Vessels
                </TableCell>
                <TableCell align="right">
                  {examinationData.vessels?.od?.value === 'Other'
                    ? examinationData.vessels?.od?.other
                    : examinationData.vessels?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.vessels?.os?.value === 'Other'
                    ? examinationData.vessels?.os?.other
                    : examinationData.vessels?.os?.value || '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Periphery
                </TableCell>
                <TableCell align="right">
                  {examinationData.periphery?.od?.value === 'Other'
                    ? examinationData.periphery?.od?.other
                    : examinationData.periphery?.od?.value || '-'}
                </TableCell>
                <TableCell align="right">
                  {examinationData.periphery?.os?.value === 'Other'
                    ? examinationData.periphery?.os?.other
                    : examinationData.periphery?.os?.value || '-'}
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
          Fundus Examination Records
        </Typography>
        <IconButton
          color="primary"
          onClick={() => setOpenAddFundusExamination(true)}
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
          message="Unable to retrieve fundus examination records."
        />
      ) : fundusExaminations.length === 0 ? (
        <Fallbacks
          severity="info"
          title="No Fundus Examination Records Found"
          description="Patient fundus examination records will be listed here when available."
          sx={{ paddingTop: 6 }}
        />
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <List disablePadding>
              {fundusExaminations.map((record, index) => (
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
                          setOpenEditFundusExamination(true);
                          setSelectedFundusExamination(record);
                        }}
                        onDelete={() =>
                          handleDeleteFundusExamination(record.id)
                        }
                      />
                    </Box>
                  </ListItem>
                  {index < fundusExaminations.length - 1 && (
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

      <AddFundusExaminations
        open={openAddFundusExamination}
        isSubmitting={isSubmitting}
        onClose={() => setOpenAddFundusExamination(false)}
        onSubmit={handleAddFundusExamination}
        visit={visit}
      />

      <EditFundusExaminations
        open={openEditFundusExamination}
        isSubmitting={isUpdating}
        onClose={() => setOpenEditFundusExamination(false)}
        onSubmit={handleUpdateFundusExamination}
        examination={selectedFundusExamination}
      />

      <ToastContainer />
    </Box>
  );
};

FundusExaminationsTab.propTypes = {
  visit: PropTypes.object.isRequired,
};

export default FundusExaminationsTab;
