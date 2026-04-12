import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { DotMenu } from 'ui-component/menu/DotMenu';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';
import AddPerpectives from './components/AddPerpectives';
import EditPerspectives from './components/EditPerspectives';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

function Perspectives() {
  const theme = useTheme();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [perceptives, setPerceptives] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPerspective, setSelectedPerspective] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);

  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    last_page: 0,
    total: 0
  });

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpeningEditDialog = () => {
    setOpenEdit(true);
  };

  const handleClosingEditDialog = () => {
    setOpenEdit(false);
  };

  const handleSave = async (values) => {
    try {
      setSubmitting(true);
      const token = await GetToken();
      if (!token) {
        throw new Error('No token found');
      }

      const Api = Backend.api + Backend.perspectiveTypes;
      const response = await fetch(Api, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: values.perspectiveName, weight: values.weight })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.data.data.message);
        handleClose();
        fetchPerceptives();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavingUpdate = async (values) => {
    try {
      setSubmitting(true);
      const token = await GetToken();
      if (!token) {
        throw new Error('No token found');
      }

      const Api = Backend.api + Backend.perspectiveTypes + `/${selectedPerspective?.id}`;

      const response = await fetch(Api, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*'
        },
        body: JSON.stringify({ name: values.perspectiveName, weight: values.weight })
      });

      const result = await response.json();

      if (result.success) {
        handleClosingEditDialog();
        toast.success('Successfully updated!');
        fetchPerceptives();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (perspective) => {
    setSelectedPerspective(perspective);
    handleOpeningEditDialog();
  };

  const handleDelete = async (id) => {
    try {
      const token = await GetToken();
      const Api = Backend.api + Backend.perspectiveTypes + `/${id}`;

      fetch(Api, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            toast.success(response.data.message);
            fetchPerceptives();
          } else {
            toast.error(response.data.message);
          }
        })
        .catch((error) => {
          toast.success(error.message);
        });
    } catch (error) {
      toast.success(error.message);
    }
  };

  const fetchPerceptives = async () => {
    try {
      perceptives.length === 0 && setLoading(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.perspectiveTypes;
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
        setPagination({ ...pagination, last_page: data.data.last_page, total: data.data.total });
      } else {
        toast.error(data.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerceptives();
  }, []);

  return (
    <PageContainer
      title="Perspectives"
      // rightOption={<AddButton title="Create Perspective" variant="contained" onPress={() => handleOpen()} />}
    >
      <Grid container>
        <Grid item xs={12} sx={{ margin: 2 }}>
          {loading ? (
            <Grid container>
              <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size={22} />
              </Grid>
            </Grid>
          ) : perceptives.length === 0 ? (
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
                  borderCollapse: 'collapse'
                }}
              >
                <TableHead>
                  <TableRow>
                    {['Perspectives', 'Weights', 'Actions'].map((header) => (
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
                  {perceptives.map((perceptive) => (
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
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          border: 0
                        }}
                      >
                        {perceptive.name}
                      </TableCell>

                      <TableCell
                        sx={{
                          border: 0
                        }}
                      >
                        {perceptive.weight}%
                      </TableCell>

                      <TableCell
                        sx={{
                          border: 0
                        }}
                      >
                        <DotMenu onEdit={() => handleEdit(perceptive)} onDelete={() => handleDelete(perceptive.id)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>

      <AddPerpectives open={open} handleClose={handleClose} handleSubmission={(values) => handleSave(values)} submitting={submitting} />
      {selectedPerspective && (
        <EditPerspectives
          open={openEdit}
          selected={selectedPerspective}
          handleClose={handleClosingEditDialog}
          handleSubmission={(values) => handleSavingUpdate(values)}
          submitting={submitting}
        />
      )}

      <ToastContainer />
    </PageContainer>
  );
}

export default Perspectives;
