import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Button, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Tooltip, Avatar, CircularProgress
} from '@mui/material';
import {
  IconHeartbeat, IconPlus, IconSearch, IconFilter, IconCalendarEvent,
  IconUser, IconNote, IconHistory
} from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import { format } from 'date-fns';

const HealthRecordsPage = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    student_id: '',
    condition: '',
    incident: '',
    date: new Date().toISOString().split('T')[0],
    history: ''
  });

  useEffect(() => {
    fetchRecords();
    fetchStudents();
    fetchConditions();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.auth}${Backend.studentHealthRecords}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const res = await response.json();
      if (res.success) setRecords(res.data || []);
    } catch (err) {
      toast.error("Failed to load health records");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.auth}students/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (res.success) setStudents(res.data || []);
    } catch (err) {}
  };

  const fetchConditions = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.auth}health_conditions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (res.success) setConditions(res.data || []);
    } catch (err) {}
  };

  const handleSave = async () => {
    if (!form.student_id || !form.date || !form.incident) {
      toast.warning("Please fill required fields (Student, Date, Incident)");
      return;
    }
    setSaving(true);
    try {
      const token = await GetToken();
      const payload = { 
        ...form, 
        condition: form.condition || null 
      };
      
      const response = await fetch(`${Backend.auth}${Backend.studentHealthRecords}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const res = await response.json();
      if (res.success || response.ok) {
        toast.success("Health record saved");
        setOpen(false);
        fetchRecords();
        setForm({ student_id: '', condition: '', incident: '', date: new Date().toISOString().split('T')[0], history: '' });
      } else {
        toast.error(res.message || "Failed to save record");
      }
    } catch (err) {
      toast.error("Error saving health record");
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter(r => 
    r.student_details?.user_details?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.incident?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer title="Student Health Records">
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 700 }}>🏥 Health Records</Typography>
            <Typography variant="caption" color="text.secondary">Monitor and manage student medical incidents and conditions</Typography>
          </Box>
          <Button variant="contained" startIcon={<IconPlus size={18}/>} onClick={() => setOpen(true)}>
            New Incident
          </Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2}>
            <TextField 
              placeholder="Search by student or incident..." 
              size="small" 
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <IconSearch size={18} style={{ marginRight: 8, opacity: 0.5 }}/> }}
            />
            <Button variant="outlined" startIcon={<IconFilter size={18}/>}>Filter</Button>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell><Typography fontWeight={700}>Student</Typography></TableCell>
              <TableCell><Typography fontWeight={700}>Date</Typography></TableCell>
              <TableCell><Typography fontWeight={700}>Condition</Typography></TableCell>
              <TableCell><Typography fontWeight={700}>Incident / Note</Typography></TableCell>
              <TableCell><Typography fontWeight={700}>History Log</Typography></TableCell>
              <TableCell><Typography fontWeight={700}>Recorded By</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress size={24}/></TableCell></TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>No health records found</TableCell></TableRow>
            ) : (
              filteredRecords.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.8rem' }}>
                        {r.student_details?.user_details?.full_name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{r.student_details?.user_details?.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.student_details?.student_id}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconCalendarEvent size={14} color="#666"/>
                      <Typography variant="body2">{r.date}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {r.condition_details ? (
                      <Chip label={r.condition_details.name} size="small" color="error" variant="outlined" />
                    ) : '—'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" sx={{ 
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                    }}>
                      {r.incident}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Tooltip title={r.history || ''}>
                      <Typography variant="caption" sx={{ 
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block'
                      }}>
                        {r.history || 'No history'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{r.recorded_by_details?.full_name || 'System'}</Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>Record Health Incident</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField 
                select fullWidth label="Select Student" required
                value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              >
                {students.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.user_details?.full_name} ({s.student_id})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                type="date" fullWidth label="Date of Incident" required
                value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                select fullWidth label="Pre-existing Condition"
                value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {conditions.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                multiline rows={3} fullWidth label="Incident Details / Note" required
                value={form.incident} onChange={(e) => setForm({ ...form, incident: e.target.value })}
                placeholder="What happened? E.g. Minor headache, stomach pain..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18}/> : 'Save Record'}
          </Button>
        </DialogActions>
      </Dialog>
      <ToastContainer />
    </PageContainer>
  );
};

export default HealthRecordsPage;
