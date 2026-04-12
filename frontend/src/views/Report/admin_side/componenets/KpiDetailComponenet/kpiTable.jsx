import React, { useState } from 'react';
import {
  Typography,
  Grid,
  Box,
  Card,
  Snackbar,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Paper,
  CardContent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Fallbacks from 'utils/components/Fallbacks';
import Search from 'ui-component/search';

const KpiTable = () => {
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [loading, setLoading] = useState(false); // Update with your actual loading state
  const [error, setError] = useState(null); // Update with your actual error state
  const [data, setData] = useState([
    {
      id: 1,
      plan: 'Increase Revenue',
      completed: '75%',
      status: 'Assigned',
      department: 'Marketing',
      date: '2024-08-01'
    },
    {
      id: 2,
      plan: 'Reduce Costs',
      completed: '50%',
      status: 'Assigned',
      department: 'Finance',
      date: '2024-08-05'
    },
    {
      id: 3,
      plan: 'Improve Customer Satisfaction',
      completed: '90%',
      status: 'Not Assigned',
      department : 'Sales',
      date: '2024-08-10'
    }
  ]);

  const theme = useTheme();

  // Handle edit action
  const handleEdit = () => {
    setOpen(true);
    handleMenuClose();
  };

  // Handle detail view
  const handleDetailOpen = (record) => {
    // Implement detail view logic
  };

  // Handle delete action
  const handleDelete = () => {
    // Implement delete logic
    handleMenuClose();
  };

  // Handle menu open
  const handleMenuClick = (event, record) => {
    setAnchorEl(event.currentTarget);
    setCurrentRecord(record);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentRecord(null);
  };

  // Handle dialog close
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
      challenge_faced: '',
      department: ''
    });
    setEditIndex(null);
  };

  // Handle form field change
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value
    }));
  };

  return (
    <Card>
      <CardContent>
        <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.grey[300], marginY: 3 }} />

        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h3" sx={{ mt: 0, color: 'grey.500' }}>
              All KPI
            </Typography>
          </Grid>
<Search />
        </Grid>

        <Box mt={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {['KPI Name', 'Weight', 'Status', 'Department', 'Date', ].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        background: theme.palette.grey[100],
                        color: '#000',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        borderBottom: `2px solid ${theme.palette.divider}`,
                        position: 'relative',
                        padding: '12px 16px',
                        '&:not(:last-of-type)': {
                          borderRight: `1px solid ${theme.palette.divider}`
                        }
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
                        <CircularProgress size={22} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Fallbacks severity="error" title="Server error" description="There is an error fetching data" />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box sx={{ paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Fallbacks severity="info" title="No Data" description="No KPI records found" />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((record) => (
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
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{record.plan}</TableCell>
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{record.completed}</TableCell>
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{record.status}</TableCell>
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{record.department}</TableCell>
                      <TableCell sx={{ border: 0, padding: '12px 16px' }}>{record.date}</TableCell>
                  
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardContent>


      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default KpiTable;
