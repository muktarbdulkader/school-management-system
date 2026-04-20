import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconListCheck,
  IconAlertCircle
} from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const MEASUREMENT_TYPES = [
  { value: 'rating_1_5', label: 'Rating Scale (1-5)' },
  { value: 'rating_1_10', label: 'Rating Scale (1-10)' },
  { value: 'percentage', label: 'Percentage (0-100)' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'text', label: 'Text/Comment' },
  { value: 'numeric', label: 'Numeric Value' }
];

const DEFAULT_CRITERIA = [
  { name: 'Teaching Quality', code: 'teaching_quality', description: 'Overall effectiveness of teaching methods', measurement_type: 'rating_1_5', weight: 1.5 },
  { name: 'Punctuality', code: 'punctuality', description: 'Regularity and timeliness', measurement_type: 'rating_1_5', weight: 1.0 },
  { name: 'Communication', code: 'communication', description: 'Clarity and effectiveness of communication', measurement_type: 'rating_1_5', weight: 1.2 },
  { name: 'Classroom Management', code: 'classroom_management', description: 'Ability to manage classroom effectively', measurement_type: 'rating_1_5', weight: 1.3 },
  { name: 'Student Engagement', code: 'student_engagement', description: 'Level of student participation and interest', measurement_type: 'rating_1_5', weight: 1.4 },
  { name: 'Professionalism', code: 'professionalism', description: 'Professional conduct and ethics', measurement_type: 'rating_1_5', weight: 1.0 },
  { name: 'Collaboration', code: 'collaboration', description: 'Teamwork with colleagues and staff', measurement_type: 'rating_1_5', weight: 0.8 },
  { name: 'Innovation', code: 'innovation', description: 'Use of innovative teaching methods', measurement_type: 'rating_1_5', weight: 0.8 }
];

const CriteriaFormDialog = ({ open, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    measurement_type: 'rating_1_5',
    weight: 1.0,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        measurement_type: initialData.measurement_type || 'rating_1_5',
        weight: initialData.weight || 1.0,
        is_active: initialData.is_active !== false
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        measurement_type: 'rating_1_5',
        weight: 1.0,
        is_active: true
      });
    }
    setErrors({});
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    if (formData.weight < 0 || formData.weight > 100) newErrors.weight = 'Weight must be between 0 and 100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error is handled by parent
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    if (formData.name && !initialData) {
      const code = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      setFormData(prev => ({ ...prev, code }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {initialData ? 'Edit Criteria' : 'Add New Criteria'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Criteria Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={generateCode}
                error={!!errors.name}
                helperText={errors.name || 'e.g., Teaching Quality'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code *"
                name="code"
                value={formData.code}
                onChange={handleChange}
                error={!!errors.code}
                helperText={errors.code || 'Unique identifier, auto-generated from name'}
                disabled={initialData?.is_default}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
                helperText="Detailed explanation of what this criteria measures"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Measurement Type *"
                name="measurement_type"
                value={formData.measurement_type}
                onChange={handleChange}
              >
                {MEASUREMENT_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Weight *"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                error={!!errors.weight}
                helperText={errors.weight || 'Weight in overall calculation (default: 1.0)'}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleChange}
                    name="is_active"
                  />
                }
                label="Active"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                Inactive criteria won't appear in evaluations
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const CriteriaManagement = ({ open, onClose }) => {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (open) {
      fetchCriteria();
    }
  }, [open]);

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.performanceCriteria}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCriteria(data.data || []);
      } else {
        toast.error(data.message || 'Failed to load criteria');
      }
    } catch (error) {
      console.error('Error fetching criteria:', error);
      toast.error('Failed to load criteria');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      const token = await GetToken();
      const url = editingCriteria
        ? `${Backend.api}${Backend.performanceCriteria}${editingCriteria.id}/`
        : `${Backend.api}${Backend.performanceCriteria}`;
      const method = editingCriteria ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(editingCriteria ? 'Criteria updated successfully' : 'Criteria created successfully');
        fetchCriteria();
        return Promise.resolve();
      } else {
        toast.error(data.message || 'Failed to save criteria');
        return Promise.reject();
      }
    } catch (error) {
      console.error('Error saving criteria:', error);
      toast.error('Failed to save criteria');
      return Promise.reject();
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.performanceCriteria}${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Criteria deleted successfully');
        fetchCriteria();
      } else {
        toast.error(data.message || 'Failed to delete criteria');
      }
    } catch (error) {
      console.error('Error deleting criteria:', error);
      toast.error('Failed to delete criteria');
    }
    setDeleteConfirm(null);
  };

  const handleCreateDefaults = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.performanceCriteriaBulkCreate}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ criteria: DEFAULT_CRITERIA })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Created ${data.data?.length || 0} default criteria`);
        fetchCriteria();
      } else {
        toast.error(data.message || 'Failed to create default criteria');
      }
    } catch (error) {
      console.error('Error creating default criteria:', error);
      toast.error('Failed to create default criteria');
    }
  };

  const openEditForm = (criteriaItem) => {
    setEditingCriteria(criteriaItem);
    setFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingCriteria(null);
    setFormOpen(true);
  };

  const getMeasurementTypeLabel = (value) => {
    const type = MEASUREMENT_TYPES.find(t => t.value === value);
    return type?.label || value;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Performance Measurement Criteria Management
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={openCreateForm}
              >
                Add Criteria
              </Button>
              <Button
                variant="outlined"
                startIcon={<IconListCheck size={18} />}
                onClick={handleCreateDefaults}
              >
                Create Defaults
              </Button>
            </Stack>
            <Button
              startIcon={<IconRefresh size={18} />}
              onClick={fetchCriteria}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>

          {/* Info Alert */}
          <Alert severity="info" icon={<IconAlertCircle size={20} />}>
            <Typography variant="body2">
              These criteria define how teacher performance is measured. Admins can create custom criteria with different measurement types (ratings, percentages, yes/no, etc.). 
              Criteria weights affect the overall score calculation. Only active criteria appear in evaluations.
            </Typography>
          </Alert>

          {/* Criteria Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Measurement Type</TableCell>
                    <TableCell>Weight</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {criteria.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <code>{item.code}</code>
                      </TableCell>
                      <TableCell>{getMeasurementTypeLabel(item.measurement_type)}</TableCell>
                      <TableCell>{item.weight}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={item.is_active ? 'success' : 'default'}
                        />
                        {item.is_default && (
                          <Chip
                            label="Default"
                            size="small"
                            color="info"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openEditForm(item)}
                              color="primary"
                            >
                              <IconEdit size={18} />
                            </IconButton>
                          </Tooltip>
                          {!item.is_default && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => setDeleteConfirm(item)}
                                color="error"
                              >
                                <IconTrash size={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {criteria.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No criteria found. Click "Add Criteria" or "Create Defaults" to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>

      {/* Form Dialog */}
      <CriteriaFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initialData={editingCriteria}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteConfirm.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default CriteriaManagement;
