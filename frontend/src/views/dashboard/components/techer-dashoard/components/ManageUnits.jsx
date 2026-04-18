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
  teacherAssignments,
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

  // Refresh data when switching to Unit tab (to get newly created categories)
  useEffect(() => {
    if (activeTab === 'unit' && onRefresh) {
      console.log('Switched to Unit tab, refreshing data...');
      onRefresh();
    }
  }, [activeTab]);

  // Refresh data when switching to Sub-unit tab (to get newly created units)
  useEffect(() => {
    if (activeTab === 'subunit' && onRefresh) {
      console.log('Switched to Sub-unit tab, refreshing data...');
      onRefresh();
    }
  }, [activeTab]);

  // Debug: log units whenever they change
  useEffect(() => {
    console.log('=== UNITS UPDATED ===');
    console.log('Units count:', units?.length || 0);
    console.log('Units data:', units);
  }, [units]);

  // Debug: log subunits whenever they change
  useEffect(() => {
    console.log('=== SUBUNITS UPDATED ===');
    console.log('Subunits count:', subunits?.length || 0);
    console.log('Subunits data:', subunits);
  }, [subunits]);

  // Debug: log categories whenever they change
  useEffect(() => {
    console.log('=== CATEGORIES UPDATED ===');
    console.log('Categories count:', categories?.length || 0);
    console.log('Categories data:', categories);
  }, [categories]);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    subject_id: '',
    class_fk_id: '',
    name: '',
  });

  // Get subjects assigned to teacher for the selected class
  const getAssignedSubjectsForClass = (classId) => {
    if (!classId || !teacherAssignments || teacherAssignments.length === 0) {
      return [];
    }
    // Filter teacher assignments by class and extract unique subjects
    const assignedSubjects = teacherAssignments
      .filter(assignment => assignment.class_fk?.id === classId || assignment.class_details?.id === classId)
      .map(assignment => assignment.subject_details)
      .filter(subject => subject); // Remove null/undefined

    // Remove duplicates by subject id
    return [...new Map(assignedSubjects.map(s => [s.id, s])).values()];
  };

  // Get available subjects based on selected class
  const availableSubjects = categoryForm.class_fk_id
    ? getAssignedSubjectsForClass(categoryForm.class_fk_id)
    : [];

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
      console.log('Creating category with form data:', categoryForm);
      const result = await onCategoryCreated(categoryForm);
      console.log('Category creation result:', result);

      if (result.success) {
        setCategoryForm({ subject_id: '', class_fk_id: '', name: '' });
        // Force refresh to update categories list BEFORE showing success
        if (onRefresh) {
          console.log('Refreshing categories list after creation...');
          await onRefresh();
          console.log('Categories refreshed, count:', categories?.length);
        }
        toast.success(`✅ Category created! You now have ${categories?.length || 0} categories. Switch to "Add Unit" tab to use it.`);
      } else {
        // Handle backend validation errors
        let errorMsg = result.message || 'Failed to create category';
        if (result.data && typeof result.data === 'object') {
          // Extract field-specific errors
          const fieldErrors = Object.entries(result.data)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
          if (fieldErrors) {
            errorMsg = fieldErrors;
          }
        }
        console.error('Category creation failed:', errorMsg);
        toast.error(`❌ ${errorMsg}`);
      }
    } catch (error) {
      console.error('Category creation error:', error);
      toast.error(`❌ ${error.message || 'Failed to create category'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async () => {
    console.log('handleCreateUnit called with unitForm:', unitForm);
    if (!unitForm.category_id || !unitForm.name) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      console.log('Sending unitForm to backend:', unitForm);
      const result = await onUnitCreated(unitForm);
      if (result.success) {
        setUnitForm({ category_id: '', name: '' });
        toast.success('Unit created successfully! It will now appear in the Sub-unit dropdown.');
      } else {
        // Handle backend validation errors
        let errorMsg = result.message || 'Failed to create unit';
        if (result.data && typeof result.data === 'object') {
          const fieldErrors = Object.entries(result.data)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
          if (fieldErrors) {
            errorMsg = fieldErrors;
          }
        }
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create unit');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubunit = async () => {
    console.log('handleCreateSubunit called with subunitForm:', subunitForm);
    if (!subunitForm.unit_id || !subunitForm.name) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      console.log('Sending subunitForm to backend:', subunitForm);
      const result = await onSubunitCreated(subunitForm);
      if (result.success) {
        setSubunitForm({ unit_id: '', name: '' });
        toast.success('Sub-unit created successfully!');
      } else {
        // Handle backend validation errors
        let errorMsg = result.message || 'Failed to create sub-unit';
        if (result.data && typeof result.data === 'object') {
          const fieldErrors = Object.entries(result.data)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
          if (fieldErrors) {
            errorMsg = fieldErrors;
          }
        }
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create sub-unit');
    } finally {
      setLoading(false);
    }
  };

  // Handle Submit button click based on active tab
  const handleSubmit = async () => {
    if (activeTab === 'category') {
      await handleCreateCategory();
    } else if (activeTab === 'unit') {
      await handleCreateUnit();
    } else if (activeTab === 'subunit') {
      await handleCreateSubunit();
    }
  };

  // Check if current form is valid for submission
  const isSubmitDisabled = () => {
    if (loading) return true;
    if (activeTab === 'category') {
      return !categoryForm.subject_id || !categoryForm.class_fk_id || !categoryForm.name;
    } else if (activeTab === 'unit') {
      return !unitForm.category_id || !unitForm.name;
    } else if (activeTab === 'subunit') {
      return !subunitForm.unit_id || !subunitForm.name;
    }
    return true;
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
              onClick={() => {
                console.log(`Switching to ${tab} tab`);
                setActiveTab(tab);
              }}
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
                    {categoryForm.class_fk_id && availableSubjects.length === 0 && (
                      <MenuItem disabled>No subjects assigned for this class</MenuItem>
                    )}
                    {availableSubjects.map((subject) => (
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
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Existing Categories ({categories.length} found)
            </Typography>
            {categories.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No categories created yet. Create your first category above.
              </Typography>
            ) : (
              <List dense>
                {categories.map((cat) => (
                  <ListItem key={cat.id}>
                    <ListItemText
                      primary={cat.name || 'Unnamed Category'}
                      secondary={`Subject: ${cat.subject_details?.name || cat.subject?.name || 'N/A'} | Class: ${cat.class_details?.name || cat.class_details?.grade || cat.class_fk?.name || 'N/A'}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Unit Form */}
        {activeTab === 'unit' && (
          <Box>
            {console.log('Unit tab - Available categories:', categories?.length || 0, categories)}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create New Unit
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Available categories: {categories?.length || 0}
            </Typography>
            {(!categories || categories.length === 0) && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                ⚠️ No categories available. Please go to "Add Category" tab and create a category first.
                <br />
                <small>Debug: categories prop is {categories === undefined ? 'undefined' : `array with ${categories.length} items`}</small>
              </Typography>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={unitForm.category_id}
                    onChange={(e) => {
                      console.log('Category selected:', e.target.value, 'Type:', typeof e.target.value);
                      console.log('Selected category object:', categories.find(c => c.id === e.target.value));
                      setUnitForm({ ...unitForm, category_id: e.target.value });
                    }}
                    label="Category *"
                  >
                    {categories.length === 0 && (
                      <MenuItem disabled>
                        No categories available. Please create a category first.
                      </MenuItem>
                    )}
                    {categories.map((cat) => {
                      // Handle different possible data structures from backend
                      const catName = cat.name || 'Unnamed';
                      const subjectName = cat.subject_details?.name || cat.subject?.name || 'N/A';
                      const className = cat.class_details?.grade || cat.class_details?.name || cat.class_fk?.grade || cat.class_fk?.name || 'N/A';

                      return (
                        <MenuItem key={cat.id} value={cat.id}>
                          {catName} ({subjectName} - Class {className})
                        </MenuItem>
                      );
                    })}
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
            {console.log('Sub-unit tab - Available units:', units?.length || 0, units)}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create New Sub-unit
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Available units: {units?.length || 0}
            </Typography>
            {(!units || units.length === 0) && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                ⚠️ No units available. Please go to "Add Unit" tab and create a unit first.
                <br />
                <small>Debug: units prop is {units === undefined ? 'undefined' : `array with ${units.length} items`}</small>
              </Typography>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Unit *</InputLabel>
                  <Select
                    value={subunitForm.unit_id}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      console.log('Unit selected:', selectedValue, 'Type:', typeof selectedValue);
                      console.log('Selected unit object:', units.find(u => u.id === selectedValue));
                      setSubunitForm({ ...subunitForm, unit_id: selectedValue });
                    }}
                    label="Unit *"
                    disabled={!units || units.length === 0}
                  >
                    {units.length === 0 && (
                      <MenuItem disabled>
                        No units available. Please create a unit first.
                      </MenuItem>
                    )}
                    {units.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.category_details?.name || unit.category?.name || 'N/A'})
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
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Existing Sub-units ({subunits?.length || 0})
            </Typography>
            {(!subunits || subunits.length === 0) && (
              <Typography variant="body2" color="text.secondary">
                No sub-units created yet.
              </Typography>
            )}
            <List dense>
              {subunits.map((sub) => {
                // Handle different possible data structures from backend
                const unitName = sub.unit_details?.name || sub.unit?.name || 'Unknown Unit';
                return (
                  <ListItem key={sub.id}>
                    <ListItemText
                      primary={sub.name}
                      secondary={`Unit: ${unitName}`}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}

        {/* Bottom Action Buttons */}
        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitDisabled()}
          >
            {loading ? 'Saving...' : 'Submit'}
          </Button>
        </Box>
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
  teacherAssignments: PropTypes.array,
  onCategoryCreated: PropTypes.func.isRequired,
  onUnitCreated: PropTypes.func.isRequired,
  onSubunitCreated: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default ManageUnits;
