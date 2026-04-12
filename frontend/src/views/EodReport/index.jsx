import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Box,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  DeleteOutlineOutlined as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import Fallbacks from 'utils/components/Fallbacks';
import MainCard from 'ui-component/cards/MainCard';
import { Stack, useTheme } from '@mui/system';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import { DotMenu } from 'ui-component/menu/DotMenu';
import EditEodReport from './components/EditEodReport';
import DeleteEodReport from './components/DeleteEodReport';
import StarRating from 'ui-component/Rating/StarRating';

const ViewEmployeeEOD = ({ eodReport, onRefresh }) => {
  const [data, setData] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    perPage: 10,
    last_page: 0,
    total: 0,
  });
  const theme = useTheme();

  const [modalState, setModalState] = useState({
    openModal: false,
    submitting: false,
  });

  const state = useSelector((state) => state.customization.user);
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, perPage: event.target.value });
    setPage(0);
  };

  const handleFetchingEod = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const Api =
      Backend.api +
      Backend.endOfDayReports +
      `?employee_id=${state?.employee_id}&fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.perPage}`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'GET',
      headers: header,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setData(response.data?.data?.data || response.data?.data || []);
          setPagination({
            ...pagination,
            last_page: response.data.data.last_page,
            total: response.data.data.total,
          });
          setLoading(false);
          setError(false);
        } else {
          setLoading(false);
          setError(false);
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (eodReport && eodReport.length > 0) {
      setData(eodReport);
      setLoading(false);
      return;
    }

    if (state?.employee_id && selectedYear?.id) {
      handleFetchingEod(1);
    } else {
      setLoading(false);
    }
  }, [eodReport, state?.employee_id, selectedYear?.id]);

  useEffect(() => {
    if (mounted) {
      handleFetchingEod();
    } else {
      setMounted(true);
    }

    return () => {};
  }, [pagination.page, pagination.perPage]);

  useEffect(() => {
    if (selectedYear?.id) {
      handleFetchingEod();
    } else {
      setLoading(false);
    }
  }, [state?.employee_id, selectedYear?.id, onRefresh]);

  const handleEditClick = (report) => {
    setCurrentItem(report);
    setModalState((prev) => ({ ...prev, editModalOpen: true }));
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleSaveEod = async (updatedData) => {
    setModalState((prev) => ({ ...prev, submitting: true }));
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.endOfDayReports}/${currentItem.id}`,
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

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.endOfDayReports}/${itemToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success('EOD report deleted successfully');
        handleFetchingEod();
        onRefresh?.();
      } else {
        throw new Error(result.message || 'Failed to delete EOD report');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete EOD report');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const renderSatisfaction = (value) => {
    const numericValue = Number(value || 0);

    return (
      <Box display="flex" alignItems="center">
        <StarRating value={numericValue} size="small" />
      </Box>
    );
  };

  return (
    <MainCard content={false}>
      <Grid container>
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
                message="There was an error loading EOD reports"
                size={100}
              />
            ) : data.length === 0 ? (
              <Fallbacks
                severity="info"
                title="No EOD reports found"
                description="There are no end of day reports available"
                sx={{ paddingTop: 6 }}
                size={100}
              />
            ) : (
              <TableContainer
                sx={{
                  minHeight: '66dvh',
                  border: 0.4,
                  borderColor: theme.palette.divider,
                  borderRadius: 2,
                }}
              >
                <Table sx={{ minWidth: 650 }} aria-label="EOD reports table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Completed</TableCell>
                      <TableCell>Not Completed</TableCell>
                      <TableCell>Challenges</TableCell>
                      <TableCell>Next Actions</TableCell>
                      <TableCell>Satisfaction</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Tooltip title={report.completed}>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {report.completed}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Tooltip title={report.not_completed}>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {report.not_completed}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Tooltip title={report.challenge_faced}>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {report.challenge_faced}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Tooltip title={report.next_action}>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {report.next_action}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {renderSatisfaction(Number(report.satisfaction || 0))}
                        </TableCell>

                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 10 }}>
                            <DotMenu
                              onEdit={() => handleEditClick(report)}
                              onDelete={() => handleDeleteClick(report)}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <TablePagination
              component="div"
              rowsPerPageOptions={[10, 25, 50, 100]}
              count={pagination.total}
              rowsPerPage={pagination.perPage}
              page={pagination.page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </Grid>
      </Grid>

      <EditEodReport
        open={modalState.editModalOpen}
        onClose={() =>
          setModalState((prev) => ({ ...prev, editModalOpen: false }))
        }
        item={currentItem}
        handleEditSubmission={handleSaveEod}
        loading={modalState.submitting}
      />

      <DeleteEodReport
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </MainCard>
  );
};

ViewEmployeeEOD.propTypes = {
  onRefresh: PropTypes.func,
};

export default ViewEmployeeEOD;
