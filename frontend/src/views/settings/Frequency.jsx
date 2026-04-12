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
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import { IconDotsVertical } from '@tabler/icons-react';

function Frequency() {
  const [frequencies, setFrequencies] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    fetchFrequencies();
  }, []);

  const fetchFrequencies = async () => {
    try {
      const token = await GetToken();
      const Api = Backend.api + `frequencies`;
      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setFrequencies(result.data.data);
      } else {
        toast.error('Failed to fetch frequencies');
      }
    } catch (error) {
      toast.error('Error occurred while fetching frequencies');
    }
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      value: ''
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        const method = editIndex !== null ? 'PATCH' : 'POST';

        const Api = editIndex !== null ? `${Backend.api}frequencies/${frequencies[editIndex].id}` : `${Backend.api}frequencies`;
        const token = await GetToken();
        const response = await fetch(Api, {
          method: method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: values.name,
            value: values.value
          })
        });

        const result = await response.json();
        if (result.success) {
          toast.success(editIndex !== null ? 'Frequency updated' : 'Frequency created');
          fetchFrequencies();
          handleClose();
        } else {
          toast.error(result.message || 'Failed to save frequency');
        }
      } catch (error) {
        toast.error('Error occurred while saving frequency');
      }
      resetForm();
    }
  });

  const handleEdit = (index) => {
    formik.setFieldValue('name', frequencies[index].name);
    formik.setFieldValue('value', frequencies[index].value);
    setEditIndex(index);
    handleOpen();
  };

  const handleDelete = async (index) => {
    try {
      const token = await GetToken();
      const Api = Backend.api + `frequencies/${frequencies[index].id}`;
      const response = await fetch(Api, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Frequency deleted');
        fetchFrequencies();
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
  const auth = getRolesAndPermissionsFromToken();
  const hasPermission = auth.some((role) => role.permissions.some((per) => per.name === 'create:endofdayactivity'));

  return (
    <React.Fragment>
      <Grid container>
        <Grid item xs={12}>
          <Grid xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2 }}>
            <Box></Box>
            <DrogaButton title="Create Frequency" variant="outlined" onPress={handleOpen} />
          </Grid>

          {frequencies.length === 0 ? (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <SentimentDissatisfiedIcon color="disabled" style={{ fontSize: 60 }} />
              <Typography variant="subtitle1" color="textSecondary" align="center" marginLeft={2}>
                No frequencies registered yet.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {['Frequency Name', 'Value', 'Actions'].map((header) => (
                      <TableCell key={header}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {frequencies.map((frequency, index) => (
                    <TableRow key={frequency.id}>
                      <TableCell component="th" scope="row">
                        {frequency.name}
                      </TableCell>
                      <TableCell>{frequency.value}</TableCell>
                      <TableCell>
                        <IconButton color="primary" onClick={(event) => handleMenuOpen(event, index)}>
                          <IconDotsVertical size={'1.4rem'} stroke={1.8} color="grey" />
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && selectedIndex === index} onClose={handleMenuClose}>
                          {hasPermission && (
                            <MenuItem
                              onClick={() => {
                                handleEdit(index);
                                handleMenuClose();
                              }}
                            >
                              <EditIcon fontSize="small" /> Edit
                            </MenuItem>
                          )}
                          <MenuItem
                            onClick={() => {
                              handleDelete(index);
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
        </Grid>
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editIndex !== null ? 'Edit Frequency' : 'Create Frequency'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              name="name"
              label="Frequency Name"
              type="text"
              fullWidth
              value={formik.values.name}
              onChange={formik.handleChange}
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
              value={formik.values.value}
              onChange={formik.handleChange}
              error={formik.touched.value && Boolean(formik.errors.value)}
              helperText={formik.touched.value && formik.errors.value}
            />
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button onClick={formik.handleSubmit} color="primary">
                Save
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      <ToastContainer />
    </React.Fragment>
  );
}

export default Frequency;
