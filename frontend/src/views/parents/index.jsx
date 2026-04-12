import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Button, Stack, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, CircularProgress
} from '@mui/material';
import { IconSearch, IconPlus, IconRefresh, IconEdit, IconTrash } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const EMPTY_FORM = {
  full_name: '', email: '', password: '', citizenship: '',
  employer_name: '', jobtitle: '', mobile_telephone: '', address: ''
};

const ParentsPage = () => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchParents(); }, []);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.parents}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Parents API status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Parents API full response:', data);

        // Handle different response formats
        const parentsData = data.data || data.results || [];
        console.log('Extracted parents count:', parentsData.length);
        console.log('First parent sample:', parentsData[0]);

        setParents(parentsData);

        if (parentsData.length > 0) {
          toast.success(`${parentsData.length} parents loaded successfully`);
        } else {
          toast.warning('No parents found. This may be due to permissions or no parents in the system.');
        }
      } else {
        const errorData = await res.json();
        console.error('Failed to fetch parents - Status:', res.status, 'Error:', errorData);

        if (res.status === 403) {
          toast.error('Permission denied. Please check your user permissions.');
        } else {
          toast.error(errorData.message || 'Failed to load parents');
        }
      }
    } catch (error) {
      console.error('Error loading parents:', error);
      toast.error('Error loading parents: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      full_name: p.user_details?.full_name || '',
      email: p.user_details?.email || '',
      password: '',
      phone: p.phone || '',
      relationship: p.relationship || 'Father'
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email) { toast.error('Name and email are required'); return; }
    if (!editing && !form.password) { toast.error('Password is required'); return; }
    setSaving(true);
    try {
      const token = await GetToken();
      let res;
      if (editing) {
        res = await fetch(`${Backend.api}${Backend.parents}${editing.id}/`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ citizenship: form.citizenship, employer_name: form.employer_name, jobtitle: form.jobtitle, mobile_telephone: form.mobile_telephone, address: form.address })
        });
      } else {
        // Step 1: create the user
        const userRes = await fetch(`${Backend.api}${Backend.users}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: form.full_name, email: form.email, password: form.password, role: 'parent' })
        });
        const userData = await userRes.json();
        if (!userRes.ok && !userData.success) throw new Error(userData.message || 'Failed to create user');
        const userId = userData.data?.id || userData.id;

        // Step 2: create parent profile
        res = await fetch(`${Backend.api}${Backend.parents}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: userId,
            citizenship: form.citizenship,
            employer_name: form.employer_name,
            jobtitle: form.jobtitle,
            mobile_telephone: form.mobile_telephone,
            address: form.address || '-'
          })
        });
      }
      const data = await res.json();
      if (res.ok || data.success) {
        toast.success(editing ? 'Parent updated' : 'Parent created');
        setFormOpen(false);
        fetchParents();
      } else toast.error(data.message || 'Failed to save parent');
    } catch (err) { toast.error(err.message || 'Error saving parent'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this parent?')) return;
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.parents}${id}/`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) { toast.success('Parent deleted'); fetchParents(); }
      else toast.error('Failed to delete parent');
    } catch { toast.error('Error deleting parent'); }
  };

  const filtered = parents.filter(p =>
    p.user_details?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_details?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer title="Parent Management">
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h3">Parents</Typography>
          <Stack direction="row" spacing={2}>
            <Button startIcon={<IconRefresh size={16} />} onClick={fetchParents} disabled={loading}>Refresh</Button>
            <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={openAdd}>Add Parent</Button>
          </Stack>
        </Stack>

        <TextField fullWidth placeholder="Search parents..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} sx={{ mb: 3 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={20} /></InputAdornment> }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><ActivityIndicator size={32} /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Employer</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No parents found</Typography>
                  </TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.user_details?.full_name || '—'}</TableCell>
                    <TableCell>{p.user_details?.email || '—'}</TableCell>
                    <TableCell>{p.mobile_telephone || '—'}</TableCell>
                    <TableCell>{p.employer_name || '—'}</TableCell>
                    <TableCell>{p.jobtitle || '—'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" startIcon={<IconEdit size={14} />} onClick={() => openEdit(p)}>Edit</Button>
                        <Button size="small" color="error" startIcon={<IconTrash size={14} />} onClick={() => handleDelete(p.id)}>Delete</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DrogaCard>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Parent' : 'Add Parent'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!editing && <>
              <TextField label="Full Name *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} fullWidth />
              <TextField label="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} fullWidth />
              <TextField label="Password *" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} fullWidth />
            </>}
            <TextField label="Phone" value={form.mobile_telephone} onChange={e => setForm({ ...form, mobile_telephone: e.target.value })} fullWidth />
            <TextField label="Employer" value={form.employer_name} onChange={e => setForm({ ...form, employer_name: e.target.value })} fullWidth />
            <TextField label="Job Title" value={form.jobtitle} onChange={e => setForm({ ...form, jobtitle: e.target.value })} fullWidth />
            <TextField label="Citizenship" value={form.citizenship} onChange={e => setForm({ ...form, citizenship: e.target.value })} fullWidth />
            <TextField label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} fullWidth multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : (editing ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ParentsPage;
