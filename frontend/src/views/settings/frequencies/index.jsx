import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  Menu,
  MenuItem,
  useTheme,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import {
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import PageContainer from 'ui-component/MainPage';
import { DotMenu } from 'ui-component/menu/DotMenu';
import AddButton from 'ui-component/buttons/AddButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import hasPermission from 'utils/auth/hasPermission';

function Frequencies() {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [frequencies, setFrequencies] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchFrequencies = async () => {
    try {
      setLoading(true);
      const token = await GetToken();
      const Api = Backend.api + `frequencies`;
      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        setFrequencies(result.data.data);
        setError(false);
      } else {
        toast.error('Failed to fetch frequencies');
        setError(false);
      }
    } catch (error) {
      toast.error('Error occurred while fetching frequencies');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleformSubmission = async (values) => {
    try {
      setSubmitting(true);
      const method = editIndex !== null ? 'PATCH' : 'POST';

      const Api =
        editIndex !== null
          ? `${Backend.api}frequencies/${frequencies[editIndex].id}`
          : `${Backend.api}frequencies`;
      const token = await GetToken();
      const response = await fetch(Api, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          value: values.value,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(
          editIndex !== null ? 'Frequency updated' : 'Frequency created',
        );
        fetchFrequencies();
        handleClose();
      } else {
        toast.error(result.message || 'Failed to save frequency');
      }
    } catch (error) {
      toast.error('Error occurred while saving frequency');
    } finally {
      setSubmitting(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      value: '',
    },
    onSubmit: async (values) => {
      handleformSubmission(values);
    },
  });

  const handleEdit = (index) => {
    formik.setFieldValue('name', frequencies[index].name);
    formik.setFieldValue('value', frequencies[index].value);
    setEditIndex(index);
    handleOpen();
    handleMenuClose();
  };

  const handleDelete = async (index) => {
    try {
      const token = await GetToken();
      const Api = Backend.api + `frequencies/${frequencies[index].id}`;
      const response = await fetch(Api, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Frequency deleted');
        fetchFrequencies();
        handleMenuClose();
      } else {
        toast.error(result.message || 'Failed to delete frequency');
      }
    } catch (error) {
      toast.error('Error occurred while deleting frequency');
    }
  };

  const handleMenuOpen = (event, index) => {
    setAnchorEl(event.currentTarget);
    setSelectedIndex(index);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedIndex(null);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    formik.resetForm();
    setEditIndex(null);
  };

  useEffect(() => {
    fetchFrequencies();
  }, []);

  const auth = getRolesAndPermissionsFromToken();

  return (
    <React.Fragment>
      <PageContainer
        title="Frequencies"
        rightOption={
          <AddButton
            title="Create Frequency"
            variant="outlined"
            onPress={handleOpen}
          />
        }
      >
        <Grid container>
          <Grid item xs={12} sx={{ margin: 2, mt: 4 }}>
            {loading ? (
              <Grid container>
                <Grid
                  item
                  xs={12}
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 8,
                  }}
                >
                  <ActivityIndicator size={20} />
                </Grid>
              </Grid>
            ) : error ? (
              <ErrorPrompt
                title="Server Error"
                message="Unable to retrieve fiscal years"
              />
            ) : frequencies.length === 0 ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <SentimentDissatisfiedIcon
                  color="disabled"
                  style={{ fontSize: 60 }}
                />
                <Typography
                  variant="subtitle1"
                  color="textSecondary"
                  align="center"
                  marginLeft={2}
                >
                  No frequencies registered yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {['Frequency Name', 'Value', 'Actions'].map((header) => (
                        <TableCell
                          key={header}
                          sx={{
                            background: theme.palette.grey[100],
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            position: 'relative',
                            padding: '12px 16px',
                          }}
                        >
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {frequencies.map((frequency, index) => (
                      <TableRow
                        key={frequency.id}
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          borderRadius: 2,
                          '&:nth-of-type(odd)': {
                            backgroundColor: theme.palette.grey[50],
                          },
                          '&:hover': {
                            backgroundColor: theme.palette.grey[100],
                          },
                        }}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: 0,
                            padding: '12px 16px',
                          }}
                        >
                          {frequency.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: 0,
                            padding: '12px 16px',
                          }}
                        >
                          {frequency.value}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: 0,
                            padding: '12px 16px',
                          }}
                        >
                          <IconButton
                            color="primary"
                            onClick={(event) => handleMenuOpen(event, index)}
                          >
                            <IconDotsVertical
                              size={'1.4rem'}
                              stroke={1.8}
                              color="grey"
                            />
                          </IconButton>
                          <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl) && selectedIndex === index}
                            onClose={handleMenuClose}
                          >
                            {hasPermission('update:frequency') && (
                              <MenuItem
                                onClick={() => handleEdit(index)}
                                sx={{
                                  margin: 0.5,
                                  borderRadius: theme.shape.borderRadius,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <IconPencil size={18} />
                                <Typography
                                  variant="body2"
                                  color={theme.palette.text.primary}
                                  sx={{ marginLeft: 1 }}
                                >
                                  Edit
                                </Typography>
                              </MenuItem>
                            )}

                            <MenuItem
                              onClick={() => handleDelete(index)}
                              sx={{
                                margin: 0.5,
                                borderRadius: theme.shape.borderRadius,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <IconTrash size={18} color="red" />
                              <Typography
                                variant="body2"
                                color={theme.palette.error.main}
                                sx={{ marginLeft: 1 }}
                              >
                                Delete
                              </Typography>
                            </MenuItem>
                          </Menu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>
        </Grid>
      </PageContainer>

      <Dialog open={open} onClose={handleClose}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
          >
            <DialogTitle
              variant="h3"
              color={theme.palette.text.primary}
              id="responsive-dialog-title"
            >
              {editIndex !== null ? 'Edit Frequency' : 'Create Frequency'}
            </DialogTitle>
          </Box>

          <motion.div
            whileHover={{
              rotate: 90,
            }}
            transition={{ duration: 0.3 }}
            style={{ cursor: 'pointer', marginRight: 20 }}
            onClick={handleClose}
          >
            <IconX
              size="1.4rem"
              stroke={2}
              color={theme.palette.text.disabled}
            />
          </motion.div>
        </Box>

        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <TextField
              margin="dense"
              id="name"
              name="name"
              label="Frequency Name"
              type="text"
              fullWidth
              value={formik.values.name}
              onChange={formik.handleChange}
              required
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              margin="dense"
              id="value"
              name="value"
              label="Value"
              type="number"
              fullWidth
              required
              value={formik.values.value}
              onChange={formik.handleChange}
              error={formik.touched.value && Boolean(formik.errors.value)}
              helperText={formik.touched.value && formik.errors.value}
              sx={{ marginTop: 2 }}
            />
            <DialogActions sx={{ marginTop: 2 }}>
              <Button onClick={handleClose} color="primary">
                Cancel
              </Button>

              <DrogaButton
                title={
                  submitting ? (
                    <CircularProgress size={16} sx={{ color: '#fff' }} />
                  ) : (
                    'Submit'
                  )
                }
                type="submit"
                sx={{ boxShadow: 0, paddingX: 6 }}
              />
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      <ToastContainer />
    </React.Fragment>
  );
}

export default Frequencies;
