import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Button, Stack, Chip, TextField, InputAdornment, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Grid,
  Divider, CircularProgress, Tooltip, Avatar, Tab, Tabs, Paper, List, ListItem, ListItemText
} from '@mui/material';
import {
  IconSearch, IconPlus, IconRefresh, IconEdit, IconTrash, IconEye,
  IconUser, IconSchool, IconPhone, IconCalendar, IconGenderMale, IconGenderFemale
} from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-hot-toast';
import EnrollSubjectDialog from './components/EnrollSubjectDialog';

const EMPTY_FORM = {
  full_name: '', email: '', password: 'student123',
  grade: '', section: '', gender: '', birth_date: '',
  citizenship: '', family_status: '', family_residence: '',
  branch: '', emergency_contact: '',
  parent_full_name: '',
  parent_email: '',
  parent_password: '',
  parent_phone: '',
  parent_address: '',
  relationship: 'Father'
};

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parents, setParents] = useState([]);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [showNewParentForm, setShowNewParentForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeDetailTab, setActiveDetailTab] = useState(0);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [assignmentsData, setAssignmentsData] = useState({ assignments: [], submissions: [] });
  const [attendanceData, setAttendanceData] = useState({ history: [], summary: [] });
  const [performanceData, setPerformanceData] = useState({ incidents: [], ratings: [], exam_results: [] });
  const [extraLoading, setExtraLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { fetchStudents(); fetchFormData(); }, []);
  useEffect(() => { fetchStudents(); }, [selectedBranch]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewStudentId = searchParams.get('view_student_id');
    if (viewStudentId) {
      const studentToView = students.find(s => String(s.id) === String(viewStudentId));
      if (studentToView) {
        if (!viewing || String(viewing.id) !== String(viewStudentId)) {
          openView(studentToView);
          navigate(location.pathname, { replace: true });
        }
      } else {
        // Fetch specific student if not in current list
        const fetchSpecificStudent = async () => {
          try {
            const token = await GetToken();
            const res = await fetch(`${Backend.api}${Backend.students}${viewStudentId}/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.data) {
                openView(data.data);
                navigate(location.pathname, { replace: true });
              }
            }
          } catch (e) { console.error('Error fetching student detail from URL:', e); }
        };
        fetchSpecificStudent();
      }
    }
  }, [location.search, students, viewing, navigate]);

  /* ── Fetch helpers ─────────────────────────────────────── */
  const get = useCallback(async (url) => {
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${url}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.error(`API Error [${url}]:`, res.status);
        return [];
      }
      const json = await res.json();
      return json.data || json.results || (Array.isArray(json) ? json : []);
    } catch (e) {
      console.error(`Fetch Error [${url}]:`, e);
      return [];
    }
  }, []);

  const fetchFormData = async () => {
    const [cls, br, par] = await Promise.all([
      get(Backend.classes), get(Backend.branches), get(Backend.parents)
    ]);
    setClasses(cls); setBranches(br); setParents(par);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const branchParam = selectedBranch ? `?branch_id=${selectedBranch}` : '';
      const res = await fetch(`${Backend.api}${Backend.students}${branchParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || data.results || []);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to load students');
      }
    } catch (e) { toast.error('Failed to load students: ' + e.message); }
    finally { setLoading(false); }
  };

  /* ── Filter sections by selected grade ─────────────────── */
  useEffect(() => {
    if (form.grade) {
      get(`${Backend.sections}?class_id=${form.grade}`).then(s => setSections(s));
    } else {
      get(Backend.sections).then(s => setSections(s));
    }
  }, [form.grade]);

  /* ── Open add/edit form ─────────────────────────────────── */
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedParent(null);
    setParentSearch('');
    setShowNewParentForm(false);
    setFormOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      full_name: s.user_details?.full_name || '',
      email: s.user_details?.email || '',
      password: '',
      grade: s.grade_details?.id || '',
      section: s.section_details?.id || '',
      gender: s.gender || '',
      birth_date: s.birth_date || '',
      citizenship: s.citizenship || '',
      family_status: s.family_status || '',
      family_residence: s.family_residence || '',
      branch: s.branch_details?.id || '',
      emergency_contact: s.emergency_contact || ''
    });
    setFormOpen(true);
  };

  const openView = (s) => {
    setViewing(s);
    setActiveDetailTab(0);
    setDetailOpen(true);
    fetchEnrolledSubjects(s.id);
  };

  const fetchEnrolledSubjects = async (studentId) => {
    setSubjectsLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.studentSubjects}?student_id=${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEnrolledSubjects(data.data || data.results || []);
      }
    } catch (e) {
      console.error('Error fetching enrolled subjects:', e);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchExtraData = async (studentId, tabIndex) => {
    if (!studentId) return;
    setExtraLoading(true);
    try {
      const token = await GetToken();
      let url = '';
      if (tabIndex === 5) url = `${Backend.students}${studentId}/assignments/`;
      else if (tabIndex === 6) url = `${Backend.students}${studentId}/attendance/`;
      else if (tabIndex === 7) url = `${Backend.students}${studentId}/performance/`;

      if (url) {
        const res = await fetch(`${Backend.api}${url}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          if (tabIndex === 5) setAssignmentsData(json.data);
          else if (tabIndex === 6) setAttendanceData(json.data);
          else if (tabIndex === 7) setPerformanceData(json.data);
        }
      }
    } catch (e) { console.error('Fetch Extra Data error:', e); }
    finally { setExtraLoading(false); }
  };

  useEffect(() => {
    if (viewing && [5, 6, 7].includes(activeDetailTab)) {
      fetchExtraData(viewing.id, activeDetailTab);
    }
  }, [viewing, activeDetailTab]);

  const handleRemoveSubject = async (enrollmentId) => {
    if (!window.confirm('Remove this subject assignment?')) return;
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.studentSubjects}${enrollmentId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) {
        toast.success('Subject removed');
        fetchEnrolledSubjects(viewing.id);
      } else {
        toast.error('Failed to remove subject');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleEnrollCore = async (studentId) => {
    if (!viewing?.grade_details?.id) {
      toast.error('Student has no grade assigned');
      return;
    }
    setSubjectsLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.studentSubjects}enroll_core_subjects/${viewing.grade_details.id}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_id: studentId })
      });
      if (res.ok) {
        toast.success('Core subjects enrolled successfully');
        fetchEnrolledSubjects(studentId);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to enroll core subjects');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    } finally {
      setSubjectsLoading(false);
    }
  };

  /* ── Save (create / update) ─────────────────────────────── */
  const handleSave = async () => {
    if (!form.full_name || !form.email) { toast.error('Name and email are required'); return; }
    if (!editing && !form.password) { toast.error('Password is required for new students'); return; }

    // Validate parent selection for new students
    if (!editing && !selectedParent && !showNewParentForm) {
      toast.error('Please select an existing parent or register a new parent');
      return;
    }

    // Validate new parent form if shown
    if (!editing && showNewParentForm && (!form.parent_full_name || !form.parent_email || !form.parent_password || !form.parent_address)) {
      toast.error('Parent name, email, password, and address are required');
      return;
    }

    setSaving(true);
    try {
      const token = await GetToken();

      if (editing) {
        // Update student profile (PATCH)
        const patchData = {
          grade: form.grade || null,
          section: form.section || null,
          gender: form.gender || null,
          birth_date: form.birth_date || null,
          citizenship: form.citizenship || null,
          family_status: form.family_status || null,
          family_residence: form.family_residence || null,
          branch: form.branch || null,
          emergency_contact: form.emergency_contact || null
        };
        const res = await fetch(`${Backend.api}${Backend.students}${editing.id}/`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(patchData)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('Student updated successfully');
          setFormOpen(false);
          fetchStudents();
        } else toast.error(data.message || JSON.stringify(data.errors || 'Failed to update'));
      } else {
        // Create student with parent linking
        let parentId = null;

        // If new parent form is shown, create parent first
        if (showNewParentForm) {
          // Step 1: Create parent user
          const parentUserRes = await fetch(`${Backend.api}${Backend.users}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: form.parent_full_name,
              email: form.parent_email,
              password: form.parent_password,
              role: 'parent'
            })
          });
          const parentUserData = await parentUserRes.json();
          if (!parentUserRes.ok && !parentUserData.success) {
            throw new Error(parentUserData.message || 'Failed to create parent user');
          }
          const parentUserId = parentUserData.data?.id || parentUserData.id;

          // Step 2: Create parent profile
          const parentRes = await fetch(`${Backend.api}${Backend.parents}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user: parentUserId,
              mobile_telephone: form.parent_phone || '',
              address: form.parent_address || '',
              relationship: form.relationship || 'Father'
            })
          });
          const parentData = await parentRes.json();
          if (!parentRes.ok || !parentData.success) {
            throw new Error(parentData.message || 'Failed to create parent profile');
          }
          parentId = parentData.data?.id || parentData.id;
        } else if (selectedParent) {
          parentId = selectedParent.id;
        }

        // Step 3: Create student with parent link
        const createData = {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          grade_id: form.grade || null,
          section_id: form.section || null,
          gender: form.gender || null,
          date_of_birth: form.birth_date || null,
          citizenship: form.citizenship || null,
          family_status: form.family_status || null,
          family_residence: form.family_residence || null,
          branch_id: form.branch || null,
          emergency_contact: parentId || form.emergency_contact || null,
          parent_id: parentId // Link parent to student
        };

        const res = await fetch(`${Backend.api}${Backend.students}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(createData)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('Student created successfully' + (parentId ? ' and parent linked' : ''));
          setFormOpen(false);
          fetchStudents();
          // Refresh parents list if new parent was created
          if (showNewParentForm) {
            fetchFormData();
          }
        } else toast.error(data.message || JSON.stringify(data.errors || 'Failed to create'));
      }
    } catch (e) { toast.error(e.message || 'Error saving student'); }
    finally { setSaving(false); }
  };

  /* ── Delete ─────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.students}${id}/`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) { toast.success('Student deleted'); fetchStudents(); }
      else toast.error('Failed to delete student');
    } catch { toast.error('Error deleting student'); }
    finally { setDeleting(null); }
  };

  /* ── Filter ─────────────────────────────────────────────── */
  const filtered = students.filter(s => {
    const search = searchTerm.toLowerCase();
    return (
      s.user_details?.full_name?.toLowerCase().includes(search) ||
      s.user_details?.email?.toLowerCase().includes(search) ||
      s.student_id?.toLowerCase().includes(search) ||
      s.grade_details?.grade?.toString().includes(search) ||
      s.section_details?.name?.toLowerCase().includes(search)
    );
  }).filter(s => {
    // Branch filter
    if (selectedBranch && s.branch_details?.id !== selectedBranch) return false;
    // Class filter
    if (selectedClass && s.grade_details?.id !== selectedClass) return false;
    return true;
  });

  /* ── Helpers ─────────────────────────────────────────────── */
  const genderColor = (g) => g === 'male' ? 'primary' : g === 'female' ? 'secondary' : 'default';
  const genderIcon = (g) => g === 'male' ? <IconGenderMale size={14} /> : g === 'female' ? <IconGenderFemale size={14} /> : null;
  const initials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <PageContainer title="Students Management">
      <DrogaCard>
        {/* ── Header ── */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3">Students</Typography>
            <Typography variant="caption" color="text.secondary">
              {students.length} total student{students.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button startIcon={<IconRefresh size={16} />} onClick={fetchStudents} disabled={loading} variant="outlined">
              Refresh
            </Button>
            <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={openAdd}>
              Add Student
            </Button>
          </Stack>
        </Stack>

        {/* ── Branch Filter + Class Filter + Search ── */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {branches.length > 0 && (
            <TextField
              select label="Filter by Branch" value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              sx={{ minWidth: 180 }} size="small"
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </TextField>
          )}
          {classes.length > 0 && (
            <TextField
              select label="Filter by Class" value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              sx={{ minWidth: 150 }} size="small"
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>Grade {c.grade}</MenuItem>)}
            </TextField>
          )}
          <TextField
            fullWidth placeholder="Search by name, ID, email, grade or section..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> }}
          />
        </Stack>

        {/* ── Table ── */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><ActivityIndicator size={36} /></Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Student Profile</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Gender</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date of Birth</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 5 }}>
                        No students found. Click "Add Student" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((s, idx) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: `${genderColor(s.gender)}.light`,
                            color: `${genderColor(s.gender)}.main`,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '1px solid',
                            borderColor: `${genderColor(s.gender)}.main`,
                          }}
                        >
                          {initials(s.user_details?.full_name)}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {s.user_details?.full_name || '—'}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', bgcolor: 'primary.light', px: 0.5, borderRadius: '4px' }}>
                              {s.student_id || 'NO-ID'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              • {s.user_details?.email}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{s.grade_details?.grade || '—'}</TableCell>
                    <TableCell>{s.section_details?.name || '—'}</TableCell>
                    <TableCell>
                      {s.gender ? (
                        <Chip icon={genderIcon(s.gender)} label={s.gender} size="small" color={genderColor(s.gender)} variant="outlined" />
                      ) : '—'}
                    </TableCell>
                    <TableCell><Typography variant="caption">{s.birth_date || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{s.branch_details?.name || '—'}</Typography></TableCell>
                    <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info" onClick={() => openView(s)}>
                            <IconEye size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => openEdit(s)}>
                            <IconEdit size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}
                            disabled={deleting === s.id}>
                            {deleting === s.id ? <CircularProgress size={14} /> : <IconTrash size={16} />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DrogaCard>

      {/* ════════════════ ADD / EDIT FORM ════════════════ */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconUser size={20} />
            <Typography variant="h4">{editing ? 'Edit Student' : 'Add New Student'}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            {/* Personal Info */}
            <Grid item xs={12}><Typography variant="subtitle2" color="primary" fontWeight={700}>👤 Personal Information</Typography><Divider sx={{ mb: 1 }} /></Grid>
            {!editing && <>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Full Name" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required type="email" label="Email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required type="password" label="Password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  helperText="Default: student123" />
              </Grid>
            </>}

            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Gender" value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date of Birth" value={form.birth_date}
                onChange={e => setForm({ ...form, birth_date: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Citizenship" value={form.citizenship}
                onChange={e => setForm({ ...form, citizenship: e.target.value })} />
            </Grid>

            {/* Academic Info */}
            <Grid item xs={12}><Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 1 }}>📚 Academic Information</Typography><Divider sx={{ mb: 1 }} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Grade / Class" value={form.grade}
                onChange={e => setForm({ ...form, grade: e.target.value, section: '' })}>
                <MenuItem value="">Select Grade</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.grade}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Section" value={form.section}
                onChange={e => setForm({ ...form, section: e.target.value })}
                disabled={!form.grade}>
                <MenuItem value="">Select Section</MenuItem>
                {sections.filter(s => {
                  const classId = s.class_id || s.class_details?.id;
                  return !form.grade || String(classId) === String(form.grade);
                }).map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {branches.length > 0 && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Branch" value={form.branch}
                  onChange={e => setForm({ ...form, branch: e.target.value })}>
                  <MenuItem value="">Select Branch</MenuItem>
                  {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </TextField>
              </Grid>
            )}

            {/* Family Info */}
            <Grid item xs={12}><Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 1 }}>🏠 Family Information</Typography><Divider sx={{ mb: 1 }} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Family Status" value={form.family_status}
                onChange={e => setForm({ ...form, family_status: e.target.value })}
                placeholder="e.g. Married, Single Parent" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Family Residence" value={form.family_residence}
                onChange={e => setForm({ ...form, family_residence: e.target.value })}
                placeholder="City / Area" />
            </Grid>

            {/* Parent Search and Selection */}
            {!editing && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" fontWeight={700}>👨‍👩‍👧 Parent/Guardian (Emergency Contact)</Typography>
                  <Divider sx={{ mb: 1 }} />
                </Grid>

                {!showNewParentForm ? (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        placeholder="Search for existing parent by name or email..."
                        value={parentSearch}
                        onChange={e => setParentSearch(e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment>
                        }}
                      />
                    </Grid>

                    {parentSearch && (
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                          {parents.filter(p =>
                            p.user_details?.full_name?.toLowerCase().includes(parentSearch.toLowerCase()) ||
                            p.user_details?.email?.toLowerCase().includes(parentSearch.toLowerCase())
                          ).length > 0 ? (
                            <List dense>
                              {parents.filter(p =>
                                p.user_details?.full_name?.toLowerCase().includes(parentSearch.toLowerCase()) ||
                                p.user_details?.email?.toLowerCase().includes(parentSearch.toLowerCase())
                              ).map(p => (
                                <ListItem
                                  key={p.id}
                                  button
                                  onClick={() => {
                                    setSelectedParent(p);
                                    setForm({ ...form, emergency_contact: p.id });
                                    setParentSearch('');
                                  }}
                                  selected={selectedParent?.id === p.id}
                                >
                                  <ListItemText
                                    primary={p.user_details?.full_name}
                                    secondary={`${p.user_details?.email} • ${p.mobile_telephone || 'No phone'}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                No parents found.
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setShowNewParentForm(true)}
                                sx={{ mt: 1 }}
                              >
                                Register New Parent
                              </Button>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    )}

                    {selectedParent && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: 'success.light', border: 1, borderColor: 'success.main' }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700}>
                                Emergency Contact: {selectedParent.user_details?.full_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {selectedParent.user_details?.email} • {selectedParent.mobile_telephone || 'No phone'}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedParent(null);
                                setForm({ ...form, emergency_contact: '' });
                              }}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </Paper>
                      </Grid>
                    )}

                    {!parentSearch && !selectedParent && (
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          onClick={() => setShowNewParentForm(true)}
                          fullWidth
                        >
                          Register New Parent (Will be set as Emergency Contact)
                        </Button>
                      </Grid>
                    )}
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, border: 1, borderColor: 'primary.main' }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700}>Register New Parent (Emergency Contact)</Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            setShowNewParentForm(false);
                            setForm({
                              ...form,
                              parent_full_name: '',
                              parent_email: '',
                              parent_password: '',
                              parent_phone: '',
                              parent_address: '',
                              relationship: 'Father'
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          required
                          label="Parent/Guardian Full Name"
                          value={form.parent_full_name}
                          onChange={e => setForm({ ...form, parent_full_name: e.target.value })}
                        />
                        <TextField
                          fullWidth
                          required
                          type="email"
                          label="Parent Email"
                          value={form.parent_email}
                          onChange={e => setForm({ ...form, parent_email: e.target.value })}
                        />
                        <TextField
                          fullWidth
                          required
                          type="password"
                          label="Parent Password"
                          value={form.parent_password}
                          onChange={e => setForm({ ...form, parent_password: e.target.value })}
                          helperText="Parent will use this to login"
                        />
                        <TextField
                          fullWidth
                          label="Parent Phone"
                          value={form.parent_phone}
                          onChange={e => setForm({ ...form, parent_phone: e.target.value })}
                        />
                        <TextField
                          fullWidth
                          required
                          label="Parent Address"
                          value={form.parent_address || ''}
                          onChange={e => setForm({ ...form, parent_address: e.target.value })}
                          placeholder="Enter full address"
                        />
                        <TextField
                          fullWidth
                          select
                          label="Relationship to Student"
                          value={form.relationship}
                          onChange={e => setForm({ ...form, relationship: e.target.value })}
                          required
                        >
                          <MenuItem value="Father">Father</MenuItem>
                          <MenuItem value="Mother">Mother</MenuItem>
                          <MenuItem value="Guardian">Guardian</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </TextField>
                      </Stack>
                    </Paper>
                  </Grid>
                )}
              </>
            )}

            {/* Emergency Contact field only for editing existing students */}
            {editing && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Emergency Contact (Parent)" value={form.emergency_contact}
                  onChange={e => setForm({ ...form, emergency_contact: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {parents.map(p => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.user_details?.full_name || p.id}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : editing ? 'Save Changes' : 'Create Student'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════ DETAIL VIEW ════════════════ */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        {viewing && <>
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                {initials(viewing.user_details?.full_name)}
              </Avatar>
              <Box>
                <Typography variant="h4">{viewing.user_details?.full_name}</Typography>
                <Typography variant="caption" color="text.secondary">{viewing.user_details?.email}</Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Tabs value={activeDetailTab} onChange={(_, v) => setActiveDetailTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
              <Tab label="Profile" />
              <Tab label="Academic" />
              <Tab label="Family" />
              <Tab label="Health" />
              <Tab label="Subjects" />
              <Tab label="Assignments" />
              <Tab label="Attendance" />
              <Tab label="Performance" />
            </Tabs>

            {activeDetailTab === 0 && (
              <Grid container spacing={1.5}>
                {[
                  ['Full Name', viewing.user_details?.full_name],
                  ['Email', viewing.user_details?.email],
                  ['Gender', viewing.gender],
                  ['Date of Birth', viewing.birth_date],
                  ['Citizenship', viewing.citizenship],
                  ['Phone', viewing.user_details?.phone || '—'],
                ].map(([label, val]) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{val || '—'}</Typography>
                  </Grid>
                ))}
              </Grid>
            )}
            {activeDetailTab === 1 && (
              <Grid container spacing={1.5}>
                {[
                  ['Grade', viewing.grade_details?.grade],
                  ['Section', viewing.section_details?.name],
                  ['Branch', viewing.branch_details?.name],
                  ['Student ID', viewing.student_id],
                ].map(([label, val]) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{val || '—'}</Typography>
                  </Grid>
                ))}
              </Grid>
            )}
            {activeDetailTab === 2 && (
              <Grid container spacing={1.5}>
                {[
                  ['Family Status', viewing.family_status],
                  ['Family Residence', viewing.family_residence],
                  ['Emergency Contact', viewing.emergency_contact_detail?.user_details?.full_name || '—'],
                  ['Parent/Guardian Name', viewing.parent_details?.user_details?.full_name || '—'],
                  ['Parent Email', viewing.parent_details?.user_details?.email || '—'],
                  ['Parent Phone', viewing.parent_details?.mobile_telephone || '—'],
                  ['Relationship', viewing.parent_details?.relationship || '—'],
                ].map(([label, val]) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{val || '—'}</Typography>
                  </Grid>
                ))}
              </Grid>
            )}
            {activeDetailTab === 3 && (
              <Box>
                {viewing.health_details?.length > 0 ? (
                  <Stack spacing={2}>
                    {viewing.health_details.map((record, i) => (
                      <Paper key={i} sx={{ p: 1.5, bgcolor: '#fdf2f2', borderLeft: 4, borderColor: 'error.main' }}>
                        <Typography variant="caption" color="text.secondary">{record.date}</Typography>
                        <Typography variant="body2" fontWeight={700}>{record.incident}</Typography>
                        {record.history && <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>History: {record.history}</Typography>}
                        {record.condition_details && <Chip label={record.condition_details.name} size="small" sx={{ mt: 1 }} />}
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    No health records found.
                  </Typography>
                )}
              </Box>
            )}
            {activeDetailTab === 4 && (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h5">Enrolled Subjects</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => handleEnrollCore(viewing.id)} disabled={subjectsLoading}>
                      Enroll Core
                    </Button>
                    <Button size="small" variant="contained" startIcon={<IconPlus size={14} />} onClick={() => setEnrollDialogOpen(true)}>
                      Add Subject
                    </Button>
                  </Stack>
                </Stack>

                {subjectsLoading ? (
                  <Stack alignItems="center" py={4}><CircularProgress size={24} /></Stack>
                ) : enrolledSubjects.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell>Subject</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {enrolledSubjects.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{sub.subject_details?.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{sub.subject_details?.code}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={sub.subject_details?.subject_type || 'Core'} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" color="error" onClick={() => handleRemoveSubject(sub.id)}>
                                <IconTrash size={14} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No subjects enrolled yet.
                  </Typography>
                )}
              </Box>
            )}
            {activeDetailTab === 5 && (
              <Box>
                {extraLoading ? <Stack alignItems="center" py={4}><CircularProgress size={24} /></Stack> : (
                  <>
                    <Typography variant="h5" sx={{ mb: 2 }}>Assignments</Typography>
                    {assignmentsData.assignments.length > 0 ? (
                      <Stack spacing={2}>
                        {assignmentsData.assignments.map(a => {
                          const sub = assignmentsData.submissions.find(s => s.assignment_id === a.id);
                          return (
                            <Paper key={a.id} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={700}>{a.title}</Typography>
                                <Typography variant="caption" color="text.secondary">Due: {a.due_date} | Section: {a.section?.name}</Typography>
                                {a.file_url && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    <a href={a.file_url} target="_blank" rel="noreferrer" style={{ color: '#9c27b0', textDecoration: 'none', fontWeight: 600 }}>📄 View Assignment Brief</a>
                                  </Typography>
                                )}
                                {sub?.submission_url && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    <a href={sub.submission_url} target="_blank" rel="noreferrer" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>⬇️ Download Submitted Work</a>
                                  </Typography>
                                )}
                              </Box>
                              <Box textAlign="right">
                                {sub ? (
                                  <Chip label={sub.grade ? `Graded: ${sub.grade}` : "Submitted (Ungraded)"} size="small" color={sub.grade ? "success" : "warning"} variant="outlined" />
                                ) : (
                                  <Chip label="Not Submitted" size="small" color="error" variant="outlined" />
                                )}
                              </Box>
                            </Paper>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>No assignments found.</Typography>
                    )}
                  </>
                )}
              </Box>
            )}
            {activeDetailTab === 6 && (
              <Box>
                {extraLoading ? <Stack alignItems="center" py={4}><CircularProgress size={24} /></Stack> : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="h5" sx={{ mb: 2 }}>Summary</Typography>
                      {attendanceData.summary.length > 0 ? attendanceData.summary.map((stat, i) => (
                        <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">{stat.count}</Typography>
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{stat.status}</Typography>
                        </Paper>
                      )) : <Typography variant="body2" color="text.secondary">No attendance recorded</Typography>}
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="h5" sx={{ mb: 2 }}>Recent History</Typography>
                      <Stack spacing={1}>
                        {attendanceData.history.length > 0 ? attendanceData.history.map((h, i) => (
                          <Stack key={i} direction="row" justifyContent="space-between" sx={{ p: 1, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                            <Typography variant="body2">{h.date}</Typography>
                            <Chip label={h.status} size="small" color={h.status === 'present' ? 'success' : h.status === 'absent' ? 'error' : 'warning'} />
                          </Stack>
                        )) : null}
                      </Stack>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}
            {activeDetailTab === 7 && (
              <Box>
                {extraLoading ? <Stack alignItems="center" py={4}><CircularProgress size={24} /></Stack> : (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>Exam Results</Typography>
                      {performanceData.exam_results?.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                              <TableRow>
                                <TableCell>Exam</TableCell>
                                <TableCell>Subject</TableCell>
                                <TableCell align="right">Score</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {performanceData.exam_results.map(er => (
                                <TableRow key={er.id}>
                                  <TableCell>{er.exam_details?.title}</TableCell>
                                  <TableCell>{er.subject_details?.name}</TableCell>
                                  <TableCell align="right">{er.score}/{er.max_score}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : <Typography variant="body2" color="text.secondary">No exams taken.</Typography>}
                    </Box>

                    <Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>Behavior Ratings</Typography>
                      {performanceData.ratings?.length > 0 ? (
                        <Stack spacing={1}>
                          {performanceData.ratings.map(r => (
                            <Paper key={r.id} variant="outlined" sx={{ p: 1.5 }}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" fontWeight={600}>{r.rating_type}</Typography>
                                <Chip label={`${r.score}/5`} size="small" color="primary" />
                              </Stack>
                              {r.comments && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{r.comments}</Typography>}
                            </Paper>
                          ))}
                        </Stack>
                      ) : <Typography variant="body2" color="text.secondary">No behavior ratings.</Typography>}
                    </Box>
                  </Stack>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => { setDetailOpen(false); openEdit(viewing); }} startIcon={<IconEdit size={14} />}>
              Edit
            </Button>
            <Button variant="contained" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogActions>
        </>}
      </Dialog>
      {/* ════════════════ ENROLL SUBJECT DIALOG ════════════════ */}
      <EnrollSubjectDialog
        open={enrollDialogOpen}
        onClose={() => setEnrollDialogOpen(false)}
        studentId={viewing?.id}
        classId={viewing?.grade_details?.id}
        className={viewing?.grade_details?.grade}
        onEnrollmentSuccess={() => fetchEnrolledSubjects(viewing.id)}
      />
    </PageContainer>
  );
};

export default StudentsPage;
