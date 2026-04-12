import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconArrowLeft,
  IconFolder,
  IconFolderOpen,
  IconBook
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';

// Curriculum Units Management Page
// Allows teachers to create and manage Units and Subunits

const CurriculumUnitsManager = () => {
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [subunits, setSubunits] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Selection state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  
  // Dialog states
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [subunitDialogOpen, setSubunitDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '' });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch units when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchUnits(selectedCategory.id);
      setSelectedUnit(null);
      setSubunits([]);
    }
  }, [selectedCategory]);

  // Fetch subunits when unit changes
  useEffect(() => {
    if (selectedUnit) {
      fetchSubunits(selectedUnit.id);
    }
  }, [selectedUnit]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.objectiveCategories}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async (categoryId) => {
    try {
      setLoading(true);
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.objectiveUnits}?category_id=${categoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setUnits(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubunits = async (unitId) => {
    try {
      setLoading(true);
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.objectiveSubunits}?unit_id=${unitId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setSubunits(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subunits:', error);
      toast.error('Failed to load subunits');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!formData.name.trim()) {
      toast.error('Unit name is required');
      return;
    }
    
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.objectiveUnits}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          category_id: selectedCategory.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Unit created successfully');
        fetchUnits(selectedCategory.id);
        setUnitDialogOpen(false);
        setFormData({ name: '' });
      } else {
        toast.error(data.message || 'Failed to create unit');
      }
    } catch (error) {
      console.error('Error creating unit:', error);
      toast.error('Error creating unit');
    }
  };

  const handleCreateSubunit = async () => {
    if (!formData.name.trim()) {
      toast.error('Subunit name is required');
      return;
    }
    
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.objectiveSubunits}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          unit_id: selectedUnit.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Subunit created successfully');
        fetchSubunits(selectedUnit.id);
        setSubunitDialogOpen(false);
        setFormData({ name: '' });
      } else {
        toast.error(data.message || 'Failed to create subunit');
      }
    } catch (error) {
      console.error('Error creating subunit:', error);
      toast.error('Error creating subunit');
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm('Are you sure you want to delete this unit? This will also delete all subunits.')) {
      return;
    }
    
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.objectiveUnits}${unitId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Unit deleted successfully');
        fetchUnits(selectedCategory.id);
        if (selectedUnit?.id === unitId) {
          setSelectedUnit(null);
          setSubunits([]);
        }
      } else {
        toast.error('Failed to delete unit');
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast.error('Error deleting unit');
    }
  };

  const handleDeleteSubunit = async (subunitId) => {
    if (!window.confirm('Are you sure you want to delete this subunit?')) {
      return;
    }
    
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.objectiveSubunits}${subunitId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Subunit deleted successfully');
        fetchSubunits(selectedUnit.id);
      } else {
        toast.error('Failed to delete subunit');
      }
    } catch (error) {
      console.error('Error deleting subunit:', error);
      toast.error('Error deleting subunit');
    }
  };

  const openUnitDialog = () => {
    setEditMode(false);
    setFormData({ name: '' });
    setUnitDialogOpen(true);
  };

  const openSubunitDialog = () => {
    setEditMode(false);
    setFormData({ name: '' });
    setSubunitDialogOpen(true);
  };

  return (
    <PageContainer title="Curriculum Units & Subunits Management">
      <DrogaCard>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Curriculum Structure Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage units and subunits for lesson planning
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Categories Column */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <IconBook size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Categories
                </Typography>
                <Divider sx={{ my: 1 }} />
                
                {categories.length === 0 ? (
                  <Alert severity="info">No categories available</Alert>
                ) : (
                  <List dense>
                    {categories.map((category) => (
                      <ListItem key={category.id} disablePadding>
                        <ListItemButton
                          selected={selectedCategory?.id === category.id}
                          onClick={() => setSelectedCategory(category)}
                        >
                          <ListItemText 
                            primary={category.name}
                            secondary={category.framework_code}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Units Column */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    <IconFolder size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Units
                  </Typography>
                  {selectedCategory && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<IconPlus size={16} />}
                      onClick={openUnitDialog}
                    >
                      Add
                    </Button>
                  )}
                </Box>
                <Divider sx={{ my: 1 }} />
                
                {!selectedCategory ? (
                  <Alert severity="info">Select a category to view units</Alert>
                ) : loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : units.length === 0 ? (
                  <Alert severity="info">No units in this category</Alert>
                ) : (
                  <List dense>
                    {units.map((unit) => (
                      <ListItem key={unit.id} disablePadding>
                        <ListItemButton
                          selected={selectedUnit?.id === unit.id}
                          onClick={() => setSelectedUnit(unit)}
                        >
                          <ListItemText primary={unit.name} />
                        </ListItemButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUnit(unit.id)}
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Subunits Column */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    <IconFolderOpen size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Subunits
                  </Typography>
                  {selectedUnit && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<IconPlus size={16} />}
                      onClick={openSubunitDialog}
                    >
                      Add
                    </Button>
                  )}
                </Box>
                <Divider sx={{ my: 1 }} />
                
                {!selectedUnit ? (
                  <Alert severity="info">Select a unit to view subunits</Alert>
                ) : loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : subunits.length === 0 ? (
                  <Alert severity="info">No subunits in this unit</Alert>
                ) : (
                  <List dense>
                    {subunits.map((subunit) => (
                      <ListItem key={subunit.id} disablePadding>
                        <ListItemText primary={subunit.name} />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteSubunit(subunit.id)}
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Breadcrumb Navigation */}
        {selectedCategory && (
          <Box sx={{ mt: 3 }}>
            <Breadcrumbs>
              <Link color="inherit" href="#" onClick={() => { setSelectedCategory(null); setSelectedUnit(null); }}>
                All Categories
              </Link>
              {selectedCategory && (
                <Typography color="text.primary">{selectedCategory.name}</Typography>
              )}
              {selectedUnit && (
                <Typography color="text.primary">{selectedUnit.name}</Typography>
              )}
            </Breadcrumbs>
          </Box>
        )}
      </DrogaCard>

      {/* Create Unit Dialog */}
      <Dialog open={unitDialogOpen} onClose={() => setUnitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Unit</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Unit Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Fractions, Algebra, Cell Biology"
              helperText={selectedCategory ? `Creating unit in: ${selectedCategory.name}` : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnitDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUnit}>
            Create Unit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Subunit Dialog */}
      <Dialog open={subunitDialogOpen} onClose={() => setSubunitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Subunit</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Subunit Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Adding Fractions, Solving Equations"
              helperText={selectedUnit ? `Creating subunit in: ${selectedUnit.name}` : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubunitDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubunit}>
            Create Subunit
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default CurriculumUnitsManager;
