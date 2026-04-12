import React, { useState, useEffect } from 'react';
import {
  Button,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Box,
  Grid
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const PerspectiveTable = () => {
  const [perspectives, setPerspectives] = useState([]);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [newPerspective, setNewPerspective] = useState('');
  const [newDescPerspective, setNewDescPerspective] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPerspectives = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const api = Backend.api + Backend.perspectiveTypes;
      const response = await fetch(api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data?.success) {
        setPerspectives(data?.data?.data);
      } else {
        toast.error(response?.message || 'Failed to fetch perspectives');
      }
    } catch (error) {
      toast.error(error?.message || 'Error fetching perspectives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerspectives();
  }, []);

  const fetchPerceptives = async () => {
    try {
      const token = await GetToken();
      const Api = Backend.api + `perspective-types`;
      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setPerceptives(data.data.data);
      } else {
        console.error('Failed to fetch perceptives:', data.message);
      }
    } catch (error) {
      console.error('Error fetching perceptives:', error);
    }
  };

  const handleSave = async (values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const method = editIndex !== null ? 'PATCH' : 'POST';
      const url = editIndex !== null ? `${Backend.api}perspective-types/${perceptives[editIndex].id}` : `${Backend.api}perspective-types`;

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*'
        },
        body: JSON.stringify({ name: values.perspectiveName })
      });

      const result = await response.json();

      if (!response.ok) {
        setSnackbarMessage('Perspective already exists');
        setSnackbarSeverity('warning');
      } else {
        if (result.success) {
          setPerceptives((prevPerceptives) => {
            if (editIndex !== null) {
              return prevPerceptives.map((p, i) => (i === editIndex ? result.data : p));
            } else {
              return [...prevPerceptives, result.data];
            }
          });
          handleClose();
          setSnackbarMessage('Perspective saved successfully!');
          setSnackbarSeverity('success');
        } else {
          setSnackbarMessage('Error creating/updating perspective: ' + result.message);
          setSnackbarSeverity('error');
        }
      }
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Error creating/updating perspective: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleUpdate = async (values) => {
    await handleSave(values);
  };

  const handleEdit = (index) => {
    formik.setFieldValue('perspectiveName', perceptives[index].name);
    setEditIndex(index);
    handleOpen();
    handleCloseMenu();
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${Backend.api}perspective-types/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 204) {
        setPerceptives((prevPerceptives) => prevPerceptives.filter((p) => p.id !== id));
        setSnackbarMessage('Perspective deleted successfully!');
        setSnackbarSeverity('success');
      } else {
        const data = await response.json();
        if (data.success) {
          setPerceptives((prevPerceptives) => prevPerceptives.filter((p) => p.id !== id));
          setSnackbarMessage('Perspective deleted successfully!');
          setSnackbarSeverity('success');
        } else {
          setSnackbarMessage('Failed to delete perspective: ' + data.message);
          setSnackbarSeverity('error');
        }
      }
    } catch (error) {
      setSnackbarMessage('Error deleting perspective: ' + error.message);
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
    handleCloseMenu();
  };

  const formik = useFormik({
    initialValues: {
      perspectiveName: ''
    },
    onSubmit: (values, { resetForm }) => {
      if (editIndex !== null) {
        handleUpdate(values);
      } else {
        handleSave(values);
      }
      resetForm();
    }
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewPerspective('');
    setNewDescPerspective('');
    setEditedName('');
    setEditedDescription('');
    setEditingIndex(null);
  };

  const handleMenuOpen = (event, index) => {
    setAnchorEl(event.currentTarget);
    setSelectedIndex(index);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedIndex(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  const theme = useTheme();
  return (
    <Box p={0}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Grid item xs={12} p={2} style={{ padding: '2px 2px 2px 25px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                formik.resetForm();
                setEditIndex(false);
                handleOpen();
              }}
            >
              Create New Perspective
            </Button>
          </Grid>
          <CardContent>
            {perceptives.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <SentimentDissatisfiedIcon color="disabled" style={{ fontSize: 60 }} />
                <Typography variant="subtitle1" color="textSecondary" align="center" marginLeft={2}>
                  No perspectives entered yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer style={{ border: '1px solid #ddd' }}>
                <Table
                  sx={{
                    minWidth: 650,
                    borderCollapse: 'collapse'
                  }}
                >
                  <TableHead>
                    <TableRow>
                      {['Perspectives', 'Actions'].map((header) => (
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
                    {perceptives.map((perceptive, index) => (
                      <TableRow
                        key={perceptive.id}
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
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: 0,
                            padding: '12px 16px'
                          }}
                        >
                          {perceptive.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: 0,
                            padding: '12px 16px'
                          }}
                        >
                          <IconButton color="primary" onClick={(event) => handleMenuOpen(event, index)}>
                            <MoreVertIcon />
                          </IconButton>
                          <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && selectedIndex === index} onClose={handleMenuClose}>
                            <MenuItem
                              onClick={() => {
                                setEditingIndex(index);
                                setEditedName(perspective.name);
                                setEditedDescription(perspective.description);
                                handleMenuClose();
                                handleOpen();
                              }}
                            >
                              <EditIcon fontSize="small" /> Edit
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                handleDelete();
                                handleMenuClose();
                              }}
                            >
                              <DeleteIcon fontSize="small" /> Delete
                            </MenuItem>
                          </Menu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Grid>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>{editingIndex !== null ? 'Edit Perspective' : 'Add Perspective'}</DialogTitle>
          <DialogContent>
            <form onSubmit={formik.handleSubmit}>
              <TextField
                autoFocus
                margin="dense"
                label="Perspective Name"
                type="text"
                fullWidth
                variant="outlined"
                value={editingIndex !== null ? editedName : newPerspective}
                onChange={editingIndex !== null ? handleEditChange : handleChange}
              />
              <TextField
                margin="dense"
                label="Description"
                type="text"
                fullWidth
                variant="outlined"
                value={editingIndex !== null ? editedDescription : newDescPerspective}
                onChange={editingIndex !== null ? handleEditDesChange : handleDescriptionChange}
              />
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            {editingIndex !== null ? (
              <Button onClick={handleEditSave} color="primary">
                Save
              </Button>
            ) : (
              <Button onClick={handleSave} color="primary">
                Add
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <ToastContainer />
      </Grid>
    </Box>
  );
};

export default PerspectiveTable;
