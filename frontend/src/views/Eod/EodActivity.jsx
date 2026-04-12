import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  ListItemIcon,
  useTheme,
  Grid
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { format } from 'date-fns';
import axios from 'axios';
import config from '../../configration/config';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddEditEodModal from '../Eod/components/AddEditEodModal';
import DetailEodModal from '../Eod/components/DetailEodModal';
import Fallbacks from 'utils/components/Fallbacks';
import PageContainer from 'ui-component/MainPage';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';
import { ViewList } from '@mui/icons-material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import { IconPlus } from '@tabler/icons-react';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

function EodActivity() {
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    date: new Date().toISOString().split('T')[0],
    revenue: '',
    expenses: '',
    profit: '',
    customer_satisfaction: '',
    plan: '',
    completed: '',
    challenge_faced: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 0,
    lastPage: 0,
    per_page: 10,
    total: 0
  });
  // const auth = getRolesAndPermissionsFromToken();
  // const hasPermission = auth.some((role) => role.permissions.some((per) => per.name === 'create:endofdayactivity'));
  useEffect(() => {
    fetchData(pagination.currentPage, pagination.per_page);
  }, [pagination.currentPage, pagination.per_page]);

  const fetchData = async (page, rowsPerPage) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL_Units}/end-of-day-activities`, {
        params: {
          page: page,
          per_page: rowsPerPage
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setData(
          response.data.data.data.map((item) => ({
            ...item,
            formattedDate: format(new Date(item.date), 'MM/dd/yyyy')
          }))
        );
        setPagination({
          currentPage: response.data.data.current_page - 1,
          lastPage: response.data.data.last_page,
          per_page: response.data.data.per_page,
          total: response.data.data.total
        });
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (index) => {
    if (index !== null) {
      const record = data[index];
      setFormValues({
        date: record.date || new Date().toISOString().split('T')[0],
        revenue: record.revenue || '',
        expenses: record.expenses || '',
        profit: record.profit || '',
        customer_satisfaction: record.customer_satisfaction || '',
        plan: record.plan || '',
        completed: record.completed || '',
        challenge_faced: record.challenge_faced || ''
      });
    } else {
      setFormValues({
        date: new Date().toISOString().split('T')[0],
        revenue: '',
        expenses: '',
        profit: '',
        customer_satisfaction: '',
        plan: '',
        completed: '',
        challenge_faced: ''
      });
    }
    setEditIndex(index);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormValues({
      date: new Date().toISOString().split('T')[0],
      revenue: '',
      expenses: '',
      profit: '',
      customer_satisfaction: '',
      plan: '',
      completed: '',
      challenge_faced: ''
    });
    setEditIndex(null);
    setTabIndex(0);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const method = editIndex !== null ? 'PATCH' : 'POST';
      const url =
        editIndex !== null
          ? `${config.API_URL_Units}/end-of-day-activities/${data[editIndex].id}`
          : `${config.API_URL_Units}/end-of-day-activities`;

      setIsLoading(true);

      const response = await axios({
        method,
        url,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: formValues
      });

      if (response.data.success) {
        fetchData(pagination.currentPage, pagination.per_page);
        handleClose();
        toast.success('Record saved successfully!');
      } else {
        toast.error(response.data.message || 'Error occurred');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 422) {
          const { message, errors } = error.response.data.data;
          if (message) {
            toast.error(message);
          } else {
            const errorMessages = Object.values(errors).flat().join(', ');
            toast.error(errorMessages || 'Validation error occurred.');
          }
        } else if (error.response.data && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Error saving record: ' + error.message);
        }
      } else {
        toast.error('Error saving record: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleDetailOpen = (record) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailOpen(false);
    setSelectedRecord(null);
  };

  const handleMenuClick = (event, record) => {
    setAnchorEl(event.currentTarget);
    setCurrentRecord(record);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.API_URL_Units}/end-of-day-activities/${currentRecord.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Record deleted successfully!');
      fetchData(page + 1);
    } catch (error) {
      toast.error('Error deleting record.');
    } finally {
      handleMenuClose();
    }
  };

  const handleEdit = () => {
    handleOpen(currentRecord.index);
    handleMenuClose();
  };
  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination((prev) => ({
      ...prev,
      per_page: parseInt(event.target.value, 10),
      currentPage: 0
    }));
  };

  return (
    <PageContainer
      maxWidth="lg"
      title={'EOD Reporting'}
      rightOption={
        <DrogaButton
          title="Create Activity"
          variant={'contained'}
          icon={<IconPlus size="1.2rem" stroke="1.2" style={{ marginRight: 4 }} />}
          sx={{ boxShadow: 0 }}
          onPress={() => handleOpen(null)}
        />
      }
    >
      <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3.8, px: 2 }}>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {[ 'Plan', 'Completed', 'Challenges Faced', 'Date', 'Actions'].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        backgroundColor: theme.palette.grey[100],
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        variant: 'h3',
                        position: 'relative',
                        padding: '12px 16px'
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size={22} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Fallbacks severity="error" title="Server error" description="There is an error fetching EOD" />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box sx={{ paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Fallbacks
                          severity="EOD"
                          title="EOD Activity is not found"
                          description="The list of added EOD activities will be listed here"
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((record, index) => (
                    <TableRow
                      key={record.id}
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 2,
                        '&:nth-of-type(odd)': {
                          backgroundColor: theme.palette.grey[50]
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.grey[100]
                        }
                      }}
                    >
                      {/* <TableCell
                        sx={{
                          border: 0,
                          padding: '12px 16px'
                        }}
                      >
                        {record.kpi?.name || 'N/A'}
                      </TableCell> */}
                      <TableCell
                        sx={{
                          border: 0,
                          padding: '12px 16px'
                        }}
                      >
                        {record.plan}
                      </TableCell>
                      <TableCell
                        sx={{
                          border: 0,
                          padding: '12px 16px'
                        }}
                      >
                        {record.completed}
                      </TableCell>
                      <TableCell
                        sx={{
                          border: 0,
                          padding: '12px 16px'
                        }}
                      >
                        {record.challenge_faced}
                      </TableCell>
                      <TableCell
                        sx={{
                          border: 0,
                          padding: '12px 16px'
                        }}
                      >
                        {record.formattedDate}
                      </TableCell>
                      <TableCell
                        sx={{
                          border: 0,
                          padding: '12px 16px'
                        }}
                      >
                        <IconButton onClick={(event) => handleMenuClick(event, { ...record, index })}>
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl)}
                          onClose={handleMenuClose}
                          sx={{
                            '& .MuiPaper-root': {
                              backdropFilter: 'blur(10px)',
                              backgroundColor: 'rgba(255, 255, 255, 0.3)',
                              borderRadius: 2,
                              boxShadow: theme.shadows[1]
                            }
                          }}
                        >
                          <MenuItem onClick={handleEdit}>
                            {' '}
                            <ListItemIcon>
                              <EditIcon fontSize="small" style={{ paddingRight: '2px', color: '#11365A' }} />
                            </ListItemIcon>
                            Update
                          </MenuItem>
                          <MenuItem onClick={() => handleDetailOpen(record)}>
                            {' '}
                            <ListItemIcon>
                              <ViewList fontSize="small" style={{ paddingRight: '2px', color: '#11365A' }} />
                            </ListItemIcon>
                            Details
                          </MenuItem>

                          <MenuItem onClick={handleDelete}>
                            {' '}
                            <ListItemIcon>
                              <DeleteIcon fontSize="small" style={{ paddingRight: '2px', color: 'red' }} />
                            </ListItemIcon>
                            Delete
                          </MenuItem>
                        </Menu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            rowsPerPage={pagination.per_page}
            component="div"
            count={pagination.total}
            page={pagination.currentPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Grid>
      </Grid>
      <AddEditEodModal
        open={open}
        handleClose={handleClose}
        handleSave={handleSave}
        formValues={formValues}
        handleChange={handleChange}
        handleTabChange={handleTabChange}
        tabIndex={tabIndex}
        editIndex={editIndex}
        formErrors={formErrors}
        isLoading={isLoading}
      />

      <DetailEodModal detailOpen={detailOpen} handleCloseDetails={handleCloseDetails} selectedRecord={selectedRecord} />
      <ToastContainer />
    </PageContainer>
  );
}

export default EodActivity;
