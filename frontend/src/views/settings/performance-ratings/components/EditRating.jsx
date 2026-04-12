import React from 'react';
import { Box, Button, Typography, TextField, MenuItem, InputLabel, Select, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { SliderPicker } from 'react-color';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import DrogaButton from 'ui-component/buttons/DrogaButton';

const EditRating = ({ open, selected, handleClose, handleSubmission, loading }) => {
  const [formValues, setFormValues] = React.useState({
    scale: selected ? selected?.scale : '',
    score: selected ? selected?.score : '',
    color: selected ? selected?.color : '',
    description: selected ? selected?.remark : ''
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleColorChange = (color) => {
    setFormValues({ ...formValues, color: color.hex });
  };

  const handleSave = (event) => {
    event.preventDefault();
    handleSubmission(formValues);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle variant="h4">Edit Performance Scale</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSave}>
          <InputLabel id="scale-select-label">Scale</InputLabel>
          <Select
            labelId="scale-select-label"
            name="scale"
            value={formValues.scale}
            onChange={handleInputChange}
            fullWidth
            sx={{ mb: 2 }}
            required
          >
            <MenuItem value="Very Good">Very Good</MenuItem>
            <MenuItem value="Good">Good</MenuItem>
            <MenuItem value="Average">Average</MenuItem>
            <MenuItem value="Poor">Poor</MenuItem>
          </Select>

          <TextField
            name="score"
            label="Score"
            value={formValues.score}
            onChange={handleInputChange}
            fullWidth
            type="text"
            sx={{ mb: 2 }}
            required
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
            <Button variant="text" color="error" onClick={handleClose}>
              Cancel
            </Button>

            <DrogaButton
              title={loading ? <ActivityIndicator size={18} sx={{ color: 'white' }} /> : 'Submit'}
              type="submit"
              disabled={loading}
            />
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRating;
