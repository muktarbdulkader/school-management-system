import * as React from 'react';
import { Box, Button, Modal, Typography, TextField, MenuItem, LinearProgress, InputLabel, Select, Grid, useTheme } from '@mui/material';
import { SliderPicker } from 'react-color';
import { toast, ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import PageContainer from 'ui-component/MainPage';
import AddButton from 'ui-component/buttons/AddButton';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { IconStarFilled } from '@tabler/icons-react';
import { DotMenu } from 'ui-component/menu/DotMenu';
import AddRating from './components/AddRating';
import EditRating from './components/EditRating';

function LinearProgressWithLabel({ value, color }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={value}
          sx={{
            backgroundColor: '#eee',
            '& .MuiLinearProgress-bar': { backgroundColor: color },
            padding: 0.6,
            borderRadius: 4
          }}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{`${Math.round(value)}`}</Typography>
      </Box>
    </Box>
  );
}

function PerformanceRating() {
  const theme = useTheme();
  const [progressBars, setProgressBars] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const handleFetchProgressBars = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.performanceratingscale;

    fetch(Api, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setProgressBars(response.data.data);
          setLoading(false);
        } else {
          setLoading(false);
          setError(true);
          toast(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.data.data.message);
        setError(true);
        setLoading(false);
      });
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleOpenEdit = () => setOpenEdit(true);
  const handleCloseEdit = () => setOpenEdit(false);

  const handleSave = async (formValues) => {
    setSubmitting(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.performanceratingscale;

    fetch(Api, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scale: formValues.scale,
        score: formValues.score,
        color: formValues.color,
        description: formValues.description
      })
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setProgressBars((prevBars) => [...prevBars, response.data]);
          handleClose();
          handleFetchProgressBars();
          toast.success(response.data.message);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error('Error: ' + error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleInitEditing = (rating) => {
    setSelectedRecord(rating);
    handleOpenEdit();
  };

  const handleSavingEdit = async (formValues) => {
    setSubmitting(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.performanceratingscale + `/${selectedRecord.id}`;

    fetch(Api, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scale: formValues.scale,
        score: formValues.score,
        color: formValues.color,
        description: formValues.description
      })
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          handleCloseEdit();
          toast.success(response.data.message);
          handleFetchProgressBars();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error('Error: ' + error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleDeleting = async (id) => {
    const token = await GetToken();
    const Api = Backend.api + Backend.performanceratingscale + `/${id}`;

    fetch(Api, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data.message);
          handleFetchProgressBars();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error('Error: ' + error.message);
      });
  };

  React.useEffect(() => {
    handleFetchProgressBars();
  }, []);

  return (
    <PageContainer
      title="Performance Scales"
      rightOption={
        <Box mr={3}>
          <AddButton title="Add Scale" variant="contained" onPress={() => handleOpen()} />
        </Box>
      }
    >
      <Grid container>
        <Grid item xs={12} sx={{ margin: 2 }}>
          {progressBars.length === 0 ? (
            <Typography sx={{ mt: 2 }}>No Performance Rating Scale Created Yet. Click the Add button to create one.</Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              {progressBars.map((bar, index) => (
                <DrogaCard key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ width: '6%', display: 'flex', alignItems: 'center' }}>
                      <IconStarFilled size="1.6rem" stroke="1.4" style={{ color: theme.palette.warning.dark }} />
                    </Box>

                    <Box sx={{ marginLeft: 3, width: '90%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', marginY: 1 }}>
                        <Typography variant="body2">Rating </Typography>
                        <Typography variant="h4" sx={{ marginLeft: 1 }}>
                          {bar.scale}
                        </Typography>
                      </Box>
                      <LinearProgressWithLabel value={bar.score} color={bar.color} />
                      <Typography variant="body2">{bar.remark}</Typography>
                    </Box>
                    <DotMenu onEdit={() => handleInitEditing(bar)} onDelete={() => handleDeleting(bar.id)} />
                  </Box>
                </DrogaCard>
              ))}
            </Box>
          )}

          <AddRating open={open} handleClose={() => handleClose()} handleSubmission={(values) => handleSave(values)} loading={submitting} />

          {selectedRecord && (
            <EditRating
              open={openEdit}
              selected={selectedRecord}
              handleClose={() => handleCloseEdit()}
              handleSubmission={(values) => handleSavingEdit(values)}
              loading={submitting}
            />
          )}
          <ToastContainer />
        </Grid>
      </Grid>
    </PageContainer>
  );
}

export default PerformanceRating;
