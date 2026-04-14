import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const ManageUnits = ({
  open,
  onClose,
  subjects,
  categories,
  units,
  subunits,
  classes,
  onCategoryCreated,
  onUnitCreated,
  onSubunitCreated,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState('category');
  const [loading, setLoading] = useState(false);

  // Refresh data when modal opens
  useEffect(() => {
    if (open && onRefresh) {
      onRefresh();
    }
  }, [open]);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    subject_id: '',
    class_fk_id: '',
    name: '',
  });

  const [unitForm, setUnitForm] = useState({
    category_id: '',
    name: '',
  });

  const [subunitForm, setSubunitForm] = useState({
    unit_id: '',
    name: '',
  });

  const handleCreateCategory = async () => {
    if (!categoryForm.subject_id || !categoryForm.class_fk_id || !categoryForm.name) {
      toast.error('Please fill all required fields (Subject, Class, and Name)');
      return;
    }
    setLoading(true);
    try {
      const result = await onCategoryCreated(categoryForm);
      if (result.success) {
        setCategoryForm({ subject_id: '', class_fk_id: '', name: '' });
        toast.success('Category created successfully');
      } else {
        toast.error(result.message || 'Failed to create category');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!unitForm.category_id || !unitForm.name) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const result = await onUnitCreated(unitForm);
      if (result.success) {
        setUnitForm({ category_id: '', name: '' });
        toast.success('Unit created successfully');
      } else {
        toast.error(result.message || 'Failed to create unit');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create unit');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubunit = async () => {
    if (!subunitForm.unit_id || !subunitForm.name) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const result = await onSubunitCreated(subunitForm);
      if (result.success) {
        setSubunitForm({ unit_id: '', name: '' });
        toast.success('Sub-unit created successfully');
      } else {
        toast.error(result.message || 'Failed to create sub-unit');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create sub-unit');
    } finally {
      setLoading(false);
    }
  };

  // Group units by category for display
  const groupedUnits = categories.map((cat) => ({
    ...cat,
    units: units.filter((u) => u.category_id === cat.id),
  }));

  return (
    <DrogaFormModal open={open} onClose={onClose} title="Manage Units & Sub-units">
      <Box sx={{ width: 800, maxWidth: '100%' }}>
        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          {['category', 'unit', 'subunit'].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'contained' : 'text'}
              size="small"
            >
              {tab === 'category' && 'Add Category'}
              {tab === 'unit' && 'Add Unit'}
              {tab === 'subunit' && 'Add Sub-unit'}
            </Button>
          ))}
        </Box>

        {/* Category Form */}
        {activeTab === 'category' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create New Category
            </Typography>
            <Grid container spacing={2}>
              {/* Class must be selected first */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Class *</InputLabel>
                  <Select
                    value={categoryForm.class_fk_id}
                    label="Class *"
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, class_fk_id: e.target.value, subject_id: '' })
                    }
                  >
                    {classes?.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.name || `Class ${cls.grade}`}
                      </MenuItem>
                    ))}
                    {(!classes || classes.length === 0) && (
                      <MenuItem disabled>No classes available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Subject *</InputLabel>
                  <Select
                    value={categoryForm.subject_id}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, subject_id: e.target.value })
                    }
                    label="Subject *"
                    disabled={!categoryForm.class_fk_id}
                  >
                    {!categoryForm.class_fk_id && (
                      <MenuItem disabled>Please select a class first</MenuItem>
                    )}
                    {categoryForm.class_fk_id && subjects.length === 0 && (
                      <MenuItem disabled>No subjects available</MenuItem>
                    )}
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category Name *"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  placeholder="e.g., Reading, Writing, Grammar"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleCreateCategory}
                disabled={loading}
                startIcon={<AddIcon />}
              >
                {loading ? 'Creating...' : 'Create Category'}
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Existing Categories
            </Typography>
            <List dense>
              {categories.map((cat) => (
                <ListItem key={cat.id}>
                  <ListItemText
                    primary={cat.name}
                    secondary={`Subject: ${cat.subject_details?.name || 'N/A'} | Class: ${cat.class_details?.name || cat.class_details?.grade || 'N/A'}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Unit Form */}
        {activeTab === 'unit' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create New Unit
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={unitForm.category_id}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, category_id: e.target.value })
                    }
                    label="Category *"
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.subject_details?.name || 'N/A'} - Class {cat.class_details?.grade || cat.class_details?.name || 'N/A'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Unit Name *"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="e.g., Spelling Rules, Fractions Basics"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleCreateUnit}
                disabled={loading}
                startIcon={<AddIcon />}
              >
                {loading ? 'Creating...' : 'Create Unit'}
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Existing Units by Category
            </Typography>
            {groupedUnits.map((cat) => (
              <Accordion key={cat.id} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight="bold">
                    {cat.name} ({cat.units.length} units)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {cat.units.map((unit) => (
                      <ListItem key={unit.id}>
                        <ListItemText primary={unit.name} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Subunit Form */}
        {activeTab === 'subunit' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create New Sub-unit
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Unit *</InputLabel>
                  <Select
                    value={subunitForm.unit_id}
                    onChange={(e) =>
                      setSubunitForm({ ...subunitForm, unit_id: e.target.value })
                    }
                    label="Unit *"
                  >
                    {units.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.category?.name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sub-unit Name *"
                  value={subunitForm.name}
                  onChange={(e) =>
                    setSubunitForm({ ...subunitForm, name: e.target.value })
                  }
                  placeholder="e.g., Silent E, Common Prefixes"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleCreateSubunit}
                disabled={loading}
                startIcon={<AddIcon />}
              >
                {loading ? 'Creating...' : 'Create Sub-unit'}
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Existing Sub-units
            </Typography>
            <List dense>
              {subunits.map((sub) => (
                <ListItem key={sub.id}>
                  <ListItemText
                    primary={sub.name}
                    secondary={`Unit: ${sub.unit?.name}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </DrogaFormModal>
  );
};

ManageUnits.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  subjects: PropTypes.array.isRequired,
  categories: PropTypes.array.isRequired,
  units: PropTypes.array.isRequired,
  subunits: PropTypes.array.isRequired,
  classes: PropTypes.array,
  onCategoryCreated: PropTypes.func.isRequired,
  onUnitCreated: PropTypes.func.isRequired,
  onSubunitCreated: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default ManageUnits;
