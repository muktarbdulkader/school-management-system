import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CardContent,
  useTheme
} from '@mui/material';

import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import PageContainer from 'ui-component/MainPage';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

function MeasuringUnits() {
  const [loading, setLoading] = useState(true);
  const [measuringUnits, setMeasuringUnits] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchMeasuringUnits();
  }, []);

  const fetchMeasuringUnits = async () => {
    try {
      measuringUnits.length === 0 && setLoading(true);
      const token = await GetToken();
      const Api = Backend.api + `measuring-units`;
      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setMeasuringUnits(data.data.data);
      } else {
        toast.error(`Failed to fetch measuring units: ${data.message}`);
      }
    } catch (error) {
      toast.error(`Error fetching measuring units: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    const method = editIndex !== null ? 'PATCH' : 'POST';
    const Api = editIndex !== null ? `${Backend.api}measuring-units/${measuringUnits[editIndex].id}` : `${Backend.api}measuring-units`;

    try {
      const token = await GetToken();
      const response = await fetch(Api, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: values.measuringUnit,
          description: values.measuringType
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchMeasuringUnits();
        handleClose();
        toast.success('Measuring unit saved successfully!');
      } else {
        toast.error(`Error saving measuring unit: ${data.message}`);
      }
    } catch (error) {
      toast.error(`Error saving measuring unit: ${error.message}`);
    }
  };

  const formik = useFormik({
    initialValues: {
      measuringUnit: '',
      measuringType: ''
    },
    onSubmit: (values, { resetForm }) => {
      handleSave(values);
      resetForm();
    }
  });

  const handleClose = () => {
    setOpen(false);
    formik.resetForm();
    setEditIndex(null);
  };
  const theme = useTheme();

  return (
    <PageContainer title="Measuring Units">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CardContent>
            {loading ? (
              <Grid container>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size={22} />
                </Grid>
              </Grid>
            ) : measuringUnits.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <SentimentDissatisfiedIcon color="disabled" style={{ fontSize: 60 }} />
                <Typography variant="subtitle1" color="textSecondary" align="center" marginLeft={2}>
                  No measuring units entered yet.
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
                      {['Measuring Unit', 'Description'].map((header) => (
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
                    {measuringUnits.map((unit) => (
                      <TableRow
                        key={unit.id}
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
                          {unit.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: 0,
                            padding: '12px 16px'
                          }}
                        >
                          {unit.description}
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
      <ToastContainer />
    </PageContainer>
  );
}

export default MeasuringUnits;
