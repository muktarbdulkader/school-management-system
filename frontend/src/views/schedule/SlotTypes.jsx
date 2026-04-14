import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Typography,
  Alert,
  Chip
} from '@mui/material';
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const SlotTypes = () => {
  const [slotTypes, setSlotTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSlotType, setEditingSlotType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Get user roles from Redux store (same as Schedule page)
  const userRoles = useSelector((state) => {
    try {
      return state?.user?.user?.roles || state?.auth?.user?.roles || [];
    } catch (error) {
      console.error('Error accessing user roles:', error);
      return [];
    }
  });

  const userData = useSelector((state) => {
    try {
      return state?.user?.user || state?.auth?.user || {};
    } catch (error) {
      return {};
    }
  });

  // Determine user role permissions
  // Check is_superuser flag OR if user has Super_Admin role
  const hasSuperAdminRole = userRoles.some(r => {
    const roleName = (typeof r === 'string' ? r : (r.role?.name || r.name || '')).toLowerCase();
    return roleName.includes('super_admin') || roleName.includes('superadmin');
  });
  const isSuperUser = userData.is_superuser || userData.is_super_user || hasSuperAdminRole;

  const hasAdminRole = userRoles.some(r => {
    const roleName = (typeof r === 'string' ? r : (r.role?.name || r.name || '')).toLowerCase();
    return ['admin', 'administrator'].some(admin => roleName.includes(admin));
  });
  const canManage = isSuperUser || hasAdminRole;

  useEffect(() => {
    fetchSlotTypes();
  }, []);

  const fetchSlotTypes = async () => {
    try {
      setLoading(true);
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.slotTypes}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSlotTypes(data.data || data.results || []);
      }
    } catch (error) {
      console.error('Error fetching slot types:', error);
      toast.error('Failed to load slot types');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (slotType = null) => {
    if (slotType) {
      setEditingSlotType(slotType);
      setFormData({
        name: slotType.name,
        description: slotType.description || ''
      });
    } else {
      setEditingSlotType(null);
      setFormData({ name: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSlotType(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManage) {
      toast.error('Only administrators can manage slot types');
      return;
    }

    try {
      const token = await GetToken();
      const url = editingSlotType
        ? `${Backend.api}${Backend.slotTypes}${editingSlotType.id}/`
        : `${Backend.api}${Backend.slotTypes}`;

      const method = editingSlotType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingSlotType ? 'Slot type updated successfully' : 'Slot type created successfully');
        handleCloseDialog();
        fetchSlotTypes();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save slot type');
      }
    } catch (error) {
      console.error('Error saving slot type:', error);
      toast.error('Failed to save slot type');
    }
  };

  const handleDelete = async (slotType) => {
    if (!canManage) {
      toast.error('Only administrators can delete slot types');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${slotType.name}"?`)) {
      return;
    }

    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.slotTypes}${slotType.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Slot type deleted successfully');
        fetchSlotTypes();
      } else {
        toast.error('Failed to delete slot type');
      }
    } catch (error) {
      console.error('Error deleting slot type:', error);
      toast.error('Failed to delete slot type');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Debug info - shows detected role status
  const getRoleDebugInfo = () => {
    return `SuperUser: ${isSuperUser ? 'Yes' : 'No'} (flag: ${userData.is_superuser || userData.is_super_user ? 'Yes' : 'No'}, role: ${hasSuperAdminRole ? 'Yes' : 'No'}), Admin: ${hasAdminRole ? 'Yes' : 'No'}, Can Manage: ${canManage ? 'Yes' : 'No'}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Slot Types
        </Typography>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={() => handleOpenDialog()}
          >
            Create Slot Type
          </Button>
        )}
      </Box>

      {/* Role indicator */}
      <Box sx={{ mb: 2 }}>
        <Chip
          label={isSuperUser ? "Super Admin" : hasAdminRole ? "Admin" : "Staff/Teacher"}
          color={isSuperUser ? "error" : hasAdminRole ? "warning" : "default"}
          size="small"
        />
        {canManage && (
          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            You have permission to manage slot types
          </Typography>
        )}
        {/* Debug info - shows detected role status */}
        <Typography variant="caption" sx={{ ml: 2, color: 'info.main', fontFamily: 'monospace' }}>
          [{getRoleDebugInfo()}]
        </Typography>
      </Box>

      {!canManage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Only Super Admins and Administrators can create, edit, or delete slot types.
          Staff and Teachers can only view existing slot types.
        </Alert>
      )}

      <Card>
        <CardContent>
          {slotTypes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No slot types found.
              </Typography>
              {canManage && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Click "Create Slot Type" to add your first slot type.
                </Typography>
              )}
            </Box>
          ) : (
            <List>
              {slotTypes.map((slotType, index) => (
                <ListItem
                  key={slotType.id}
                  divider={index < slotTypes.length - 1}
                >
                  <ListItemText
                    primary={slotType.name}
                    secondary={slotType.description || 'No description'}
                  />
                  {canManage && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleOpenDialog(slotType)}
                        sx={{ mr: 1 }}
                      >
                        <IconEdit size={20} />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(slotType)}
                        color="error"
                      >
                        <IconTrash size={20} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingSlotType ? 'Edit Slot Type' : 'Create Slot Type'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
              placeholder="e.g., Regular Class, Lab Session, Break"
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
              placeholder="Brief description of this slot type"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingSlotType ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SlotTypes;
