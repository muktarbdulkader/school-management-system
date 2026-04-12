import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
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
  CircularProgress,
  Stack,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { IconTrash, IconPlus, IconSchool, IconArrowLeft } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';

const BranchAccess = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchUserDetails = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}users/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setUser(result.data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user information');
    }
  };

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
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.userBranchAccess}?user_id=${userId}`, {
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
    if (userId) {
      fetchUserDetails();
      fetchBranches();
      fetchAssignments();
    }
  }, [userId]);

  const handleAddAssignment = async () => {
    if (!selectedBranch) return;
    
    if (assignments.find(a => a.branch?.id === selectedBranch)) {
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
          user_id: userId,
          branch_id: selectedBranch,
          access_level: 'full'
        }),
      });
      const result = await response.json();
      if (result.success || response.status === 201) {
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

  if (loading && !user) {
    return (
      <PageContainer title="Branch Management">
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Branch Management">
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<IconArrowLeft size={18} />} 
          onClick={() => navigate('/users')}
          sx={{ mb: 2 }}
        >
          Back to Users
        </Button>
        <Typography variant="h2" gutterBottom>
          Manage Branch Access
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Control which school branches <b>{user?.full_name}</b> can access.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 3 }}>Assign New Branch</Typography>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Select Branch</InputLabel>
                  <Select
                    value={selectedBranch}
                    label="Select Branch"
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    {branches
                      .filter(b => !assignments.find(a => a.branch?.id === b.id))
                      .map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={adding ? <CircularProgress size={20} color="inherit" /> : <IconPlus size={20} />}
                  onClick={handleAddAssignment}
                  disabled={!selectedBranch || adding}
                >
                  Grant Access
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <IconSchool size={22} style={{ marginRight: 8 }} />
                <Typography variant="h4">Current Assignments</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {assignments.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    No branches assigned to this user yet.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {assignments.map((assignment) => (
                    <ListItem 
                      key={assignment.id} 
                      sx={{ 
                        borderRadius: 2, 
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'grey.100',
                        '&:hover': { bgcolor: 'grey.50' } 
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="h5">
                            {assignment.branch?.name || 'School Branch'}
                          </Typography>
                        }
                        secondary={`Access Level: ${assignment.access_level}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          color="error" 
                          onClick={() => handleRemoveAssignment(assignment.id)}
                        >
                          <IconTrash size={20} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default BranchAccess;
