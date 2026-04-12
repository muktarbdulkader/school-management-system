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
  CardContent,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import 'react-toastify/dist/ReactToastify.css';
import config from '../../configration/config';
import Backend from 'services/backend';
import DrogaButton from 'ui-component/buttons/DrogaButton';

function EvalType() {
  const [evalTypes, setEvalTypes] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvalTypes();
  }, []);

  const fetchEvalTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const Api = Backend.api + Backend.evaluationTypes;
      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setEvalTypes(result.data.data);
      } else {
        toast.error('Failed to fetch evaluation types');
      }
    } catch (error) {
      toast.error('Error occurred while fetching evaluation types');
    }
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      description: ''
    },
    onSubmit: async (values, { resetForm }) => {
      if (editIndex !== null) {
        await handleEditSave();
      } else {
        await handleAdd();
      }
      resetForm();
    }
  });

  const handleAdd = async () => {
    if (formik.values.name.trim()) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Authorization token is missing.');
          setLoading(false);
          return;
        }

        const api = Backend.api + Backend.evaluationTypes;

        const response = await fetch(api, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formik.values)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          handleClose();
          toast.success('Evaluation type added successfully');
          await fetchEvalTypes();
        } else {
          toast.error(data?.message || 'Failed to add evaluation type');
        }
      } catch (error) {
        toast.error(error?.message || 'Error occurred while adding evaluation type');
      } finally {
        setLoading(false);
      }
    } else {
      toast.error('Evaluation type name cannot be empty.');
    }
  };

  const handleEditSave = async () => {
    if (formik.values.name.trim() && editIndex !== null) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const evalTypeId = evalTypes[editIndex]?.id;
        const api = `${config.API_URL_Units}/evaluation-types/${evalTypeId}`;

        const response = await fetch(api, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formik.values)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          handleClose();
          toast.success('Evaluation type updated successfully');
          await fetchEvalTypes();
        } else {
          toast.error(data?.message || 'Failed to update evaluation type');
        }
      } catch (error) {
        toast.error(error?.message || 'Error occurred while updating evaluation type');
      } finally {
        setLoading(false);
        setEditIndex(null);
      }
    } else {
      toast.error('Evaluation type name and description cannot be empty.');
    }
  };

  const handleDelete = async (index) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const evalTypeId = evalTypes[index]?.id;
      const api = `${config.API_URL_Units}/evaluation-types/${evalTypeId}`;

      const response = await fetch(api, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = response.status === 204 ? null : await response.json();
        if (data?.success || response.status === 204) {
          toast.success('Evaluation type deleted successfully');
          await fetchEvalTypes();
        } else {
          toast.error(data?.message || 'Failed to delete evaluation type');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData?.message || 'Failed to delete evaluation type');
      }
    } catch (error) {
      toast.error(error?.message || 'Error occurred while deleting evaluation type');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    formik.setValues({
      name: evalTypes[index]?.name || '',
      description: evalTypes[index]?.description || ''
    });
    setOpen(true);
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

  const theme = useTheme();

  return (
    <React.Fragment>
      <Grid container spacing={3}>
        <Grid xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4 }}>
          <Box></Box>
          <DrogaButton title="Add Evaluation Type" variant="outlined" onPress={handleOpen} />
        </Grid>
        <Grid item xs={12}>
          <CardContent>
            {evalTypes.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <SentimentDissatisfiedIcon color="disabled" style={{ fontSize: 60 }} />
                <Typography variant="subtitle1" color="textSecondary" align="center" marginLeft={2}>
                  No evaluation types entered yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ border: 1, borderColor: theme.palette.divider, borderRadius: theme.shape.borderRadius }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {['Evaluation Type', 'Description', 'Actions'].map((header) => (
                        <TableCell key={header}>{header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evalTypes.map((type, index) => (
                      <TableRow key={type.id}>
                        <TableCell component="th" scope="row">
                          {type.name}
                        </TableCell>
                        <TableCell>{type.description || '-'}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={(event) => handleMenuOpen(event, index)}>
                            <MoreVertIcon />
                          </IconButton>
                          <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && selectedIndex === index} onClose={handleMenuClose}>
                            <MenuItem
                              onClick={() => {
                                handleEdit(index);
                                handleMenuClose();
                              }}
                            >
                              <EditIcon /> Edit
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                handleDelete(index);
                                handleMenuClose();
                              }}
                            >
                              <DeleteIcon /> Delete
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
      </Grid>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editIndex === null ? 'Add Evaluation Type' : 'Edit Evaluation Type'}</DialogTitle>
        <DialogContent>
          <form onSubmit={formik.handleSubmit}>
            <TextField
              name="name"
              label="Evaluation Type"
              variant="outlined"
              margin="normal"
              fullWidth
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              name="description"
              label="Description"
              variant="outlined"
              margin="normal"
              fullWidth
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={formik.handleSubmit} color="primary" disabled={loading || !formik.isValid}>
            {editIndex === null ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <ToastContainer />
    </React.Fragment>
  );
}

export default EvalType;
