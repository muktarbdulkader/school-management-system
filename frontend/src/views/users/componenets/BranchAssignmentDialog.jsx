import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import { IconTrash, IconPlus, IconSchool } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

const BranchAssignmentDialog = ({ open, onClose, user }) => {
  const [branches, setBranches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchBranches = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.branches}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setBranches(result.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchAssignments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await GetToken();
      // Our upgraded Backend API allows filtering by user_id for Superadmins
      const response = await fetch(`${Backend.api}${Backend.userBranchAccess}?user_id=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setAssignments(result.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load branch assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchBranches();
      fetchAssignments();
    }
  }, [open, user]);

  const handleAddAssignment = async () => {
    if (!selectedBranch) return;
    
    // Check if already assigned
    if (assignments.find(a => a.branch_id === selectedBranch)) {
      toast.warning('User already has access to this branch');
      return;
    }

    setAdding(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.userBranchAccess}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user.id,
          branch: selectedBranch,
          access_level: 'full' // Default for Admin/Staff
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Branch access granted');
        fetchAssignments();
        setSelectedBranch('');
      } else {
        toast.error(result.message || 'Failed to grant access');
      }
    } catch (error) {
      toast.error('Error granting branch access');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.userBranchAccess}${assignmentId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 204 || response.ok) {
        toast.success('Branch access removed');
        fetchAssignments();
      } else {
        toast.error('Failed to remove access');
      }
    } catch (error) {
      toast.error('Error removing branch access');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconSchool size={24} />
          <Typography variant="h4">Manage Branch Access</Typography>
        </Stack>
        <Typography variant="subtitle2" color="textSecondary">
          Assign branches to {user?.full_name}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Assign New Branch</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl fullWidth size="small">
              <InputLabel>Select Branch</InputLabel>
              <Select
                value={selectedBranch}
                label="Select Branch"
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {branches
                  .filter(b => !assignments.find(a => a.branch_id === b.id))
                  .map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={adding ? <CircularProgress size={20} color="inherit" /> : <IconPlus size={18} />}
              onClick={handleAddAssignment}
              disabled={!selectedBranch || adding}
            >
              Add
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" sx={{ mb: 1 }}>Current Assignments</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        ) : assignments.length === 0 ? (
          <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            No branches assigned to this user yet.
          </Typography>
        ) : (
          <List>
            {assignments.map((assignment) => (
              <ListItem key={assignment.id} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'grey.50' } }}>
                <ListItemText
                  primary={assignment.branch_name || 'Branch'}
                  secondary={`Access Level: ${assignment.access_level}`}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    color="error" 
                    onClick={() => handleRemoveAssignment(assignment.id)}
                    size="small"
                  >
                    <IconTrash size={18} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BranchAssignmentDialog;
