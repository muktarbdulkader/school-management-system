import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../../services/api';
import Backend from '../../../services/backend';

const ResourceRequestForm = ({ open, onClose, request, onSuccess }) => {
  const [formData, setFormData] = useState({
    request_type: 'supplies',
    title: '',
    description: '',
    quantity: 1,
    priority: 'medium',
    class_fk: '',
    needed_by: '',
    notes: '',
    items: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (request) {
      setFormData({
        request_type: request.request_type || 'supplies',
        title: request.title || '',
        description: request.description || '',
        quantity: request.quantity || 1,
        priority: request.priority || 'medium',
        class_fk: request.class_fk || '',
        needed_by: request.needed_by || '',
        notes: request.notes || '',
        items: request.items || []
      });
    } else {
      setFormData({
        request_type: 'supplies',
        title: '',
        description: '',
        quantity: 1,
        priority: 'medium',
        class_fk: '',
        needed_by: '',
        notes: '',
        items: []
      });
    }
  }, [request, open]);

  const fetchClasses = async () => {
    try {
      const response = await api.get(`${Backend.api}${Backend.classes}`);
      const classesData = response.data?.data || response.data?.results || response.data || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { item_name: '', description: '', quantity: 1, unit: '' }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.title || !formData.description) {
        setError('Title and description are required');
        setLoading(false);
        return;
      }

      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity) || 1,
        items: formData.items.map(item => ({
          ...item,
          quantity: parseInt(item.quantity) || 1
        }))
      };

      let response;
      if (request) {
        response = await api.put(`${Backend.api}${Backend.resourceRequests}${request.id}/`, submitData);
      } else {
        response = await api.post(`${Backend.api}${Backend.resourceRequests}`, submitData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving request:', error);
      const errorMsg = error.response?.data?.message ||
        error.response?.data?.error ||
        JSON.stringify(error.response?.data) ||
        error.message ||
        'Failed to save request';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{request ? 'Edit Request' : 'New Resource Request'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Request Type"
              name="request_type"
              value={formData.request_type}
              onChange={handleChange}
            >
              <MenuItem value="supplies">Office Supplies</MenuItem>
              <MenuItem value="exam_duplication">Exam Duplication</MenuItem>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              select
              fullWidth
              label="Class"
              name="class_fk"
              value={formData.class_fk}
              onChange={handleChange}
            >
              <MenuItem value="">Select Class</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.grade}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Needed By"
              name="needed_by"
              value={formData.needed_by}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Request Items</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddItem}>
                Add Item
              </Button>
            </Box>

            {formData.items.map((item, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Item Name"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      placeholder="e.g., pcs, box"
                    />
                  </Grid>
                  <Grid item xs={12} sm={11}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton color="error" onClick={() => handleRemoveItem(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResourceRequestForm;
