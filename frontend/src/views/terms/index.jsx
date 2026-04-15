import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Stack, Grid, Alert, Tooltip, FormControlLabel, Switch, Divider
} from '@mui/material';
import {
  IconPlus, IconEdit, IconTrash, IconCalendar, IconSchool, IconCheck
} from '@tabler/icons-react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import MainPage from "ui-component/MainPage";
import Backend from "services/backend";
import GetToken from "utils/auth-token";
import { toast } from 'react-toastify';

const TERM_CHOICES = [
  { value: 'Term 1', label: 'Term 1' },
  { value: 'Term 2', label: 'Term 2' },
  { value: 'Summer', label: 'Summer' },
  { value: 'Winter', label: 'Winter' }
];

const TermManagement = () => {
  const [terms, setTerms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', academic_year: '', branch: '', start_date: null, end_date: null, is_current: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchTerms(); fetchBranches(); }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const token = await GetToken();
      const response = await fetch(`${Backend.api}terms/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setTerms(data.data || []);
    } catch (error) {
      toast.error('Error fetching terms');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}branches/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setBranches(data.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Term name is required';
    if (!formData.academic_year) newErrors.academic_year = 'Academic year is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (term = null) => {
    if (term) {
      setEditMode(true);
      setSelectedTerm(term);
      setFormData({
        name: term.name || '', academic_year: term.academic_year || '',
        branch: term.branch || '', is_current: term.is_current || false,
        start_date: term.start_date ? new Date(term.start_date) : null,
        end_date: term.end_date ? new Date(term.end_date) : null
      });
    } else {
      setEditMode(false);
      setSelectedTerm(null);
      setFormData({ name: '', academic_year: '', branch: '', start_date: null, end_date: null, is_current: false });
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedTerm(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const token = await GetToken();
      const url = editMode ? `${Backend.api}terms/${selectedTerm.id}/` : `${Backend.api}terms/`;
      const payload = {
        ...formData,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null
      };
      const response = await fetch(url, {
        method: editMode ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || `Term ${editMode ? 'updated' : 'created'} successfully`);
        handleCloseDialog();
        fetchTerms();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Error saving term');
    }
  };

  const handleDelete = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}terms/${selectedTerm.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle 204 No Content response (success but no body)
      if (response.status === 204 || response.ok) {
        toast.success('Term deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedTerm(null);
        fetchTerms();
        return;
      }

      // Try to parse error response
      let errorMessage = 'Failed to delete term';
      try {
        const data = await response.json();
        errorMessage = data.message || data.detail || `Error ${response.status}: Failed to delete term`;
      } catch (e) {
        errorMessage = `Error ${response.status}: Failed to delete term`;
      }

      toast.error(errorMessage);
    } catch (error) {
      console.error('Delete term error:', error);
      toast.error('Error deleting term: ' + (error.message || 'Network error'));
    }
  };

  const openDeleteDialog = (term) => {
    setSelectedTerm(term);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (term) => {
    const now = new Date();
    const end = new Date(term.end_date);
    if (term.is_current) return 'success';
    if (now > end) return 'default';
    return 'info';
  };

  const getStatusLabel = (term) => {
    const now = new Date();
    const end = new Date(term.end_date);
    if (term.is_current) return 'Current';
    if (now > end) return 'Completed';
    return 'Upcoming';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MainPage title="Term Management">
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h3" gutterBottom>Term Management</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage academic terms, semesters, and academic years
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<IconPlus size={20} />} onClick={() => handleOpenDialog()}>
              Create Term
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Typography variant="h4">{terms.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Terms</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Typography variant="h4">{terms.filter(t => t.is_current).length}</Typography>
              <Typography variant="body2" color="text.secondary">Current Terms</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Typography variant="h4">{new Set(terms.map(t => t.academic_year)).size}</Typography>
              <Typography variant="body2" color="text.secondary">Academic Years</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Typography variant="h4">{terms.filter(t => new Date(t.end_date) > new Date()).length}</Typography>
              <Typography variant="body2" color="text.secondary">Upcoming/Active</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          {terms.map((term) => {
            const now = new Date();
            const end = new Date(term.end_date);
            const isCompleted = now > end;

            return (
              <Grid item xs={12} md={6} lg={4} key={term.id}>
                <Card sx={{
                  height: '100%',
                  border: term.is_current ? 2 : 0,
                  borderColor: 'success.main',
                  position: 'relative',
                  bgcolor: isCompleted ? 'grey.100' : 'background.paper',
                  opacity: isCompleted ? 0.85 : 1
                }}>
                  {term.is_current && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'success.main', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                      CURRENT
                    </Box>
                  )}
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="h5" gutterBottom>{term.name}</Typography>
                        <Chip label={getStatusLabel(term)} color={getStatusColor(term)} size="small" sx={{ mr: 1 }} />
                        {term.branch_details && <Chip label={term.branch_details.name} variant="outlined" size="small" />}
                      </Box>
                      <Divider />
                      <Stack spacing={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconSchool size={16} color="#666" />
                          <Typography variant="body2" color="text.secondary">Academic Year: <strong>{term.academic_year}</strong></Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconCalendar size={16} color="#666" />
                          <Typography variant="body2" color="text.secondary">Start: {term.start_date ? format(new Date(term.start_date), 'MMM dd, yyyy') : '-'}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconCalendar size={16} color="#666" />
                          <Typography variant="body2" color="text.secondary">End: {term.end_date ? format(new Date(term.end_date), 'MMM dd, yyyy') : '-'}</Typography>
                        </Box>
                      </Stack>
                      <Box display="flex" justifyContent="flex-end" gap={1} sx={{ mt: 2 }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenDialog(term)} color="primary"><IconEdit size={18} /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => openDeleteDialog(term)} color="error"><IconTrash size={18} /></IconButton></Tooltip>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {terms.length === 0 && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>No terms found. Click "Create Term" to add your first academic term.</Alert>
        )}

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Edit Term' : 'Create New Term'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Term Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={!!errors.name} helperText={errors.name} fullWidth>
                {TERM_CHOICES.map((choice) => (<MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>))}
              </TextField>
              <TextField label="Academic Year *" value={formData.academic_year} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })} error={!!errors.academic_year} helperText={errors.academic_year || "e.g., 2025-2026"} fullWidth placeholder="2025-2026" />
              <TextField select label="Branch" value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} fullWidth>
                <MenuItem value=""><em>All Branches</em></MenuItem>
                {branches.map((branch) => (<MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>))}
              </TextField>
              <DatePicker label="Start Date *" value={formData.start_date} onChange={(date) => setFormData({ ...formData, start_date: date })} renderInput={(params) => (<TextField {...params} fullWidth error={!!errors.start_date} helperText={errors.start_date} />)} />
              <DatePicker label="End Date *" value={formData.end_date} onChange={(date) => setFormData({ ...formData, end_date: date })} renderInput={(params) => (<TextField {...params} fullWidth error={!!errors.end_date} helperText={errors.end_date} />)} />
              <FormControlLabel control={<Switch checked={formData.is_current} onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })} />} label={<Box display="flex" alignItems="center" gap={0.5}><IconCheck size={16} /><Typography>Mark as Current Term</Typography></Box>} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>{editMode ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle sx={{ color: 'error.main' }}><IconTrash size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />Delete Term</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete <strong>{selectedTerm?.name} ({selectedTerm?.academic_year})</strong>?</Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>
      </MainPage>
    </LocalizationProvider>
  );
};

export default TermManagement;
