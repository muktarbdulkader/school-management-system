import * as React from 'react';
import { Box, Button, Modal, Typography, TextField, MenuItem, LinearProgress, InputLabel, Select } from '@mui/material';
import { SliderPicker } from 'react-color';
import { toast, ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

// Helper function to render LinearProgress with a label
function LinearProgressWithLabel({ value, color }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={value}
          sx={{
            backgroundColor: '#eee',
            '& .MuiLinearProgress-bar': { backgroundColor: color }
          }}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{`${Math.round(value)}`}</Typography>
      </Box>
    </Box>
  );
}

export default function ProgressBarManager() {
  const [progressBars, setProgressBars] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState({ scale: '', score: '', color: '', description: '' });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

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
        toast.error(error.message);
        setError(true);
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleColorChange = (color) => {
    setFormValues({ ...formValues, color: color.hex });
  };

  const handleSave = async () => {
    setLoading(true);
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
          setFormValues({ scale: '', score: '', color: '', description: '' });
          toast.success(response.data.message);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error('Error: ' + error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  React.useEffect(() => {
    handleFetchProgressBars();
  }, []);

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Add
      </Button>

      {progressBars.length === 0 ? (
        <Typography sx={{ mt: 2 }}>No Performance Rating Scale Created Yet. Click the Add button to create one.</Typography>
      ) : (
        <Box sx={{ mt: 2 }}>
          {progressBars?.map((bar, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="h6">{bar.description || `Performance Rate Scale - ${index + 1}`}</Typography>
              <Typography variant="body2">{`Scale: ${bar.scale}`}</Typography>
              <Typography variant="body2">{bar.description}</Typography>
              <LinearProgressWithLabel value={bar.score} color={bar.color} />
            </Box>
          ))}
        </Box>
      )}

      <Modal open={open} onClose={handleClose}>
        <Box sx={{ p: 4, bgcolor: 'background.paper', maxWidth: 400, mx: 'auto', my: '5%' }}>
          <Typography variant="h6" gutterBottom>
            Create Performance Rating Scale
          </Typography>

          <InputLabel id="scale-select-label">Scale</InputLabel>
          <Select labelId="scale-select-label" name="scale" value={formValues.scale} onChange={handleInputChange} fullWidth sx={{ mb: 2 }}>
            <MenuItem value="Very Good">Very Good</MenuItem>
            <MenuItem value="Good">Good</MenuItem>
            <MenuItem value="Average">Average</MenuItem>
            <MenuItem value="Poor">Poor</MenuItem>
          </Select>

          <TextField
            name="score"
            label="Score (e.g., >50, <90, =30)"
            value={formValues.score}
            onChange={handleInputChange}
            fullWidth
            type="text"
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" gutterBottom>
            Select Color
          </Typography>
          <SliderPicker color={formValues.color} onChangeComplete={handleColorChange} />

          <TextField
            name="description"
            label="Description"
            value={formValues.description}
            onChange={handleInputChange}
            fullWidth
            sx={{ mt: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button variant="outlined" color="error" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      </Modal>
      <ToastContainer />
    </Box>
  );
}
