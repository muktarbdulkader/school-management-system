import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import {
  Box, Typography, useTheme, Card, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, Stack, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress, Divider,
  Switch, FormControlLabel, Alert, Tooltip
} from '@mui/material';
import {
  IconUsers, IconSchool, IconBook, IconCalendar, IconBell,
  IconClipboardList, IconUserCheck, IconChartBar, IconFileText,
  IconMessage, IconBuildingStore, IconTrendingUp, IconCoin,
  IconHeartbeat, IconBrain, IconMicroscope, IconBriefcase,
  IconStar, IconBuildingBank, IconShield, IconDownload,
  IconPlus, IconRefresh, IconMessages, IconLayoutKanban, IconTrophy
} from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { gridSpacing } from 'store/constant';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { hasPermission, PERMISSIONS } from 'config/rolePermissions';

// ── Course Type Stats Component ─────────────────────────────────────────────
const CourseTypeStats = () => {
  const [stats, setStats] = useState({ core: 0, elective: 0, extra: 0, loading: true });
  const theme = useTheme();

  useEffect(() => {
    const fetchCourseTypeStats = async () => {
      try {
        const token = await GetToken();
        const response = await fetch(`${Backend.api}${Backend.subjects}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          const subjects = data.data || [];
          // Helper to get course type name from various possible field structures
          const getCourseTypeName = (subject) => {
            // Check course_type_details.name (preferred)
            if (subject.course_type_details?.name) {
              return subject.course_type_details.name.toLowerCase();
            }
            // Check if course_type is an object with name
            if (subject.course_type?.name) {
              return subject.course_type.name.toLowerCase();
            }
            // Check if course_type is a string directly
            if (typeof subject.course_type === 'string') {
              return subject.course_type.toLowerCase();
            }
            return null;
          };

          const core = subjects.filter(s => getCourseTypeName(s) === 'core').length;
          const elective = subjects.filter(s => getCourseTypeName(s) === 'elective').length;
          const extra = subjects.filter(s => getCourseTypeName(s) === 'extra').length;
          setStats({ core, elective, extra, loading: false });
        }
      } catch (error) {
        console.error('Error fetching course type stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchCourseTypeStats();
  }, []);

  if (stats.loading) return (
    <DrogaCard>
      <Typography variant="h4" sx={{ mb: 2 }}>Course Types</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <ActivityIndicator size={24} />
      </Box>
    </DrogaCard>
  );

  return (
    <DrogaCard>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Course Types</Typography>
        <IconBook size={20} color={theme.palette.primary.main} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Subject classification breakdown
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <Typography variant="h4" color="primary">{stats.core}</Typography>
            <Typography variant="body2" color="text.secondary">Core</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
            <Typography variant="h4" color="warning.main">{stats.elective}</Typography>
            <Typography variant="body2" color="text.secondary">Elective</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
            <Typography variant="h4" color="success.main">{stats.extra}</Typography>
            <Typography variant="body2" color="text.secondary">Extra</Typography>
          </Paper>
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, subtitle, loading }) => {
  const theme = useTheme();
  return (
    <DrogaCard sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 1 }}>
          <ActivityIndicator size={20} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton sx={{ backgroundColor: color, padding: 1, ':hover': { backgroundColor: color } }}>
              <Icon size="1.4rem" stroke="1.8" color="white" />
            </IconButton>
            <Box sx={{ ml: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" color={color}>{value}</Typography>
                <Typography variant="subtitle1" color={color} sx={{ ml: 0.6 }}>{title}</Typography>
              </Box>
              <Typography variant="subtitle1" color={theme.palette.text.primary}>{subtitle}</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </DrogaCard>
  );
};

// ── Quick Action Card ───────────────────────────────────────────────────────
const QuickCard = ({ label, icon: Icon, color, onClick }) => (
  <Card sx={{ textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={onClick}>
    <Icon size={32} color={color} />
    <Typography variant="body2" sx={{ mt: 1 }}>{label}</Typography>
  </Card>
);

// ── Group Chat Dialog ───────────────────────────────────────────────────────
const GroupChatDialog = ({ open, onClose }) => {
  const [form, setForm] = useState({ name: '', description: '', target: 'teachers' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Group name is required'); return; }
    setSaving(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.groupChats}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, description: form.description, target: form.target })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Group chat created with ${form.target} members`);
        onClose();
      }
      else toast.error(data.message || 'Failed to create group chat');
    } catch { toast.error('Error creating group chat'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Group Chat</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Group Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <TextField select label="Target Audience" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} fullWidth>
            <MenuItem value="teachers">Teachers</MenuItem>
            <MenuItem value="students">Students</MenuItem>
            <MenuItem value="admins">Admins</MenuItem>
            <MenuItem value="parents">Parents</MenuItem>
            <MenuItem value="all">All Staff</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Overview Tab ────────────────────────────────────────────────────────────
const OverviewTab = ({ stats, loading, navigate, refreshStats }) => {
  const theme = useTheme();
  const [groupChatOpen, setGroupChatOpen] = useState(false);

  const userRoles = useSelector((state) => state.user?.user?.roles || []);
  const canViewSubjects = hasPermission(userRoles, PERMISSIONS.VIEW_SUBJECTS);

  const statCards = [
    { title: 'Students', value: stats.total_students, icon: IconSchool, color: theme.palette.primary.main, subtitle: 'Total Enrolled' },
    { title: 'Teachers', value: stats.total_teachers, icon: IconUsers, color: '#2e7d32', subtitle: 'Total Staff' },
    { title: 'Parents', value: stats.total_parents, icon: IconUserCheck, color: '#ff9800', subtitle: 'Registered' },
    { title: 'Classes', value: stats.total_classes, icon: IconCalendar, color: '#8000ff', subtitle: 'Total Classes' },
    { title: 'Subjects', value: stats.total_subjects, icon: IconBook, color: '#cc5d02', subtitle: 'Total Subjects' },
    { title: 'Pending Tasks', value: stats.pending_tasks, icon: IconClipboardList, color: '#e91e63', subtitle: 'Active Tasks' },
    { title: 'Leave Requests', value: stats.pending_leaves, icon: IconFileText, color: '#00bcd4', subtitle: 'Pending Approval' },
    { title: 'Announcements', value: stats.recent_announcements, icon: IconBell, color: '#9c27b0', subtitle: 'Recent Posts' },
  ];

  const quickActions = [
    { label: 'Students', icon: IconSchool, color: theme.palette.primary.main, path: '/students' },
    { label: 'Teachers', icon: IconUsers, color: '#2e7d32', path: '/teachers' },
    { label: 'Parents', icon: IconUserCheck, color: '#ff9800', path: '/parents' },
    { label: 'Classes', icon: IconCalendar, color: '#8000ff', path: '/classes' },
    { label: 'Schedule', icon: IconCalendar, color: '#ff9800', path: '/schedule' },
    { label: 'Announcements', icon: IconBell, color: '#9c27b0', path: '/announcements' },
    { label: 'Library', icon: IconBook, color: '#cc5d02', path: '/library' },
    { label: 'Data Export', icon: IconDownload, color: '#607d8b', path: '/data-export' },
    { label: 'Resources', icon: IconBuildingStore, color: '#795548', path: '/resource-requests' },
    { label: 'Users', icon: IconShield, color: '#e91e63', path: '/users' },
    { label: 'Roles', icon: IconBriefcase, color: '#00bcd4', path: '/role-permission' },
    { label: 'Messages', icon: IconMessage, color: '#2e7d32', path: '/messages' },
  ];

  const [enrollLoading, setEnrollLoading] = useState({});

  const handleEnrollAll = async (classId) => {
    setEnrollLoading(prev => ({ ...prev, [classId]: true }));
    try {
      const token = await GetToken();
      // Using new URL pattern: /classes/{class_id}/enroll_all_class_subjects/
      const apiBase = Backend.api.endsWith('/') ? Backend.api.slice(0, -1) : Backend.api;
      const res = await fetch(`${apiBase}/classes/${classId}/enroll_all_class_subjects/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Bulk enrollment successful');
        if (refreshStats) refreshStats();
      } else {
        toast.error(data.message || 'Enrollment failed');
      }
    } catch (e) {
      toast.error('Error during bulk enrollment');
    } finally {
      setEnrollLoading(prev => ({ ...prev, [classId]: false }));
    }
  };

  return (
    <Box>
      <Grid container spacing={gridSpacing}>
        {statCards.map((s, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <StatCard {...s} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* ── Branch Specific Management ──────────────────────────────────── */}
      <Grid container spacing={gridSpacing} sx={{ mt: 1 }}>
        {/* Attendance Monitor */}
        <Grid item xs={12} md={4}>
          <DrogaCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h4">Attendance Monitor</Typography>
              <IconUserCheck size={20} color={theme.palette.success.main} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Today's Branch Status</Typography>

            {loading ? <ActivityIndicator size={24} /> : (
              <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 1, maxHeight: 300 }}>
                {/* Overall Summary Progress Bars */}
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" fontWeight="bold">Present</Typography>
                      <Typography variant="caption" color="success.main">{stats.attendance_summary?.summary?.Present || 0}</Typography>
                    </Stack>
                    <Box sx={{ width: '100%', height: 6, bgcolor: 'grey.100', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ width: `${(stats.attendance_summary?.summary?.Present / (stats.total_students || 1)) * 100}%`, height: '100%', bgcolor: 'success.main' }} />
                    </Box>
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" fontWeight="bold">Absent</Typography>
                      <Typography variant="caption" color="error.main">{stats.attendance_summary?.summary?.Absent || 0}</Typography>
                    </Stack>
                    <Box sx={{ width: '100%', height: 6, bgcolor: 'grey.100', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ width: `${(stats.attendance_summary?.summary?.Absent / (stats.total_students || 1)) * 100}%`, height: '100%', bgcolor: 'error.main' }} />
                    </Box>
                  </Box>
                </Stack>

                {/* Granular Breakdown per Grade/Section */}
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block', borderBottom: '1px solid #eee', pb: 0.5 }}>
                  Section-wise Status
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(stats.attendance_summary?.breakdown || {}).map(([grade, sections]) => (
                    Object.entries(sections).map(([section, counts]) => (
                      <Paper key={`${grade}-${section}`} variant="outlined" sx={{ p: 1, bgcolor: '#fafafa', borderRadius: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" fontWeight="bold" sx={{ display: 'block' }}>Grade {grade}</Typography>
                            <Typography variant="caption" color="text.secondary">{section}</Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Chip label={`P: ${counts.Present || 0}`} size="small" sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                            <Chip label={`A: ${counts.Absent || 0}`} size="small" sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#ffebee', color: '#c62828' }} />
                            <Chip label={`L: ${counts.Late || 0}`} size="small" sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#fff3e0', color: '#ef6c00' }} />
                          </Stack>
                        </Stack>
                      </Paper>
                    ))
                  ))}
                  {Object.keys(stats.attendance_summary?.breakdown || {}).length === 0 && (
                    <Typography variant="caption" align="center" color="text.secondary" sx={{ py: 2 }}>No attendance records for today</Typography>
                  )}
                </Stack>
              </Box>
            )}
          </DrogaCard>
        </Grid>

        {/* Manage Branch Classes */}
        <Grid item xs={12} md={4}>
          <DrogaCard sx={{ height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h4">Manage Classes</Typography>
              <IconLayoutKanban size={20} color={theme.palette.primary.main} />
            </Stack>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 10 } }}>
              {loading ? <ActivityIndicator size={24} /> : (stats.branch_classes || []).length === 0 ? (
                <Typography color="text.secondary" align="center" py={4}>No classes in your branch</Typography>
              ) : stats.branch_classes.map((cls, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => navigate(`/classes/manage/${cls.id}`, { state: { classData: cls } })}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{cls.grade}</Typography>
                      <Typography variant="caption" color="text.secondary">Grade {cls.grade} • Click to manage students</Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={enrollLoading[cls.id]}
                      onClick={(e) => { e.stopPropagation(); handleEnrollAll(cls.id); }}
                      sx={{ borderRadius: 6 }}
                    >
                      {enrollLoading[cls.id] ? <CircularProgress size={16} /> : "Enroll All"}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </DrogaCard>
        </Grid>

        {/* Available Students Roster */}
        <Grid item xs={12} md={4}>
          <DrogaCard sx={{ height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h4">Branch Students</Typography>
              <IconSchool size={20} color={theme.palette.primary.main} />
            </Stack>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 10 } }}>
              {loading ? <ActivityIndicator size={24} /> : (stats.branch_students || []).length === 0 ? (
                <Typography color="text.secondary" align="center" py={4}>No students found</Typography>
              ) : stats.branch_students.map((student, i) => (
                <Box key={i} sx={{ p: 1, mb: 1, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2">{student.user?.full_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{student.student_id || 'No ID'}</Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Chip
                      label={student.is_enrolled_in_subjects ? "Enrolled" : "Not Enrolled"}
                      size="small"
                      variant="outlined"
                      color={student.is_enrolled_in_subjects ? "success" : "warning"}
                      sx={{ fontSize: '10px', height: 20 }}
                    />
                  </Stack>
                </Box>
              ))}
            </Box>
          </DrogaCard>
        </Grid>

      </Grid>

      <DrogaCard sx={{ mt: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          {quickActions.map((a, i) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <QuickCard {...a} onClick={() => navigate(a.path)} />
            </Grid>
          ))}
        </Grid>
      </DrogaCard>

      <Grid container spacing={gridSpacing} sx={{ mt: 0 }}>
        <Grid item xs={12} md={6}>
          <DrogaCard>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h4">System Overview</Typography>
            </Stack>
            {[
              { label: 'Total Users', value: stats.total_students + stats.total_teachers + stats.total_parents, color: 'primary' },
              { label: 'Active Classes', value: stats.total_classes, color: '#2e7d32' },
              { label: 'Pending Actions', value: stats.pending_tasks + stats.pending_leaves, color: 'error' },
            ].map((row, i) => (
              <Paper key={i} sx={{ p: 2, mb: 1, bgcolor: '#f5f5f5' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">{row.label}</Typography>
                  <Typography variant="h4" color={row.color}>{row.value}</Typography>
                </Stack>
              </Paper>
            ))}
          </DrogaCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <DrogaCard>
            <Typography variant="h4" sx={{ mb: 2 }}>Management Links</Typography>
            <Grid container spacing={1}>
              {[
                { label: 'Student Management', sub: 'Manage Student Records', icon: IconSchool, color: theme.palette.primary.main, path: '/students' },
                { label: 'Teacher Management', sub: 'Manage Teaching Staff', icon: IconUsers, color: '#2e7d32', path: '/teachers' },
                { label: 'Parent Management', sub: 'Manage Parent Records', icon: IconUserCheck, color: '#ff9800', path: '/parents' },
                { label: 'Schedule Management', sub: 'Manage Timetables', icon: IconCalendar, color: '#ff9800', path: '/schedule' },
                { label: 'Communication Hub', sub: 'Messages & Meetings', icon: IconMessage, color: '#2e7d32', path: '/messages' },
                { label: 'User Management', sub: 'Roles & Permissions', icon: IconShield, color: '#e91e63', path: '/users' },
              ].map((item, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Paper sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => navigate(item.path)}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <item.icon size={20} color={item.color} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">{item.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DrogaCard>
        </Grid>
      </Grid>

      <GroupChatDialog open={groupChatOpen} onClose={() => setGroupChatOpen(false)} />
    </Box>
  );
};

// ── HR Tab ──────────────────────────────────────────────────────────────────
const HRTab = ({ navigate }) => (
  <DrogaCard>
    <Typography variant="h4" sx={{ mb: 2 }}>HR Management</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Personnel data, onboarding, and user management functions.
    </Typography>
    <Grid container spacing={2}>
      {[
        { label: 'User Management', sub: 'Create & manage user accounts', icon: IconUsers, color: '#1976d2', path: '/users' },
        { label: 'Role & Permissions', sub: 'Assign roles and access levels', icon: IconShield, color: '#7b1fa2', path: '/role-permission' },
        { label: 'Teacher Records', sub: 'View and manage teacher data', icon: IconUserCheck, color: '#2e7d32', path: '/teachers' },
        { label: 'Leave Requests', sub: 'Approve or reject leave requests', icon: IconFileText, color: '#f57c00', path: '/leave-requests' },
        { label: 'Teacher Performance', sub: 'View performance metrics', icon: IconTrendingUp, color: '#c62828', path: '/teacher-performance' },
        { label: 'Data Export', sub: 'Export staff data reports', icon: IconDownload, color: '#607d8b', path: '/data-export' },
      ].map((item, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Paper sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => navigate(item.path)}>
            <Stack direction="row" spacing={2} alignItems="center">
              <item.icon size={28} color={item.color} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </DrogaCard>
);

// ── Finance Tab ─────────────────────────────────────────────────────────────
const FinanceTab = ({ navigate }) => {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = await GetToken();
        const [statsRes, reqRes] = await Promise.allSettled([
          fetch(`${Backend.api}${Backend.resourceRequestsStatistics}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.resourceRequests}?status=pending`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const d = await statsRes.value.json(); setStats(d.data);
        }
        if (reqRes.status === 'fulfilled' && reqRes.value.ok) {
          const d = await reqRes.value.json(); setRequests(d.data || d.results || []);
        }
      } catch { toast.error('Failed to load finance data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Requests', value: stats?.total ?? '—', color: '#1976d2' },
          { label: 'Approved', value: stats?.approved ?? '—', color: '#2e7d32' },
          { label: 'Pending', value: stats?.pending ?? '—', color: '#f57c00' },
          { label: 'Completed', value: stats?.completed ?? '—', color: '#7b1fa2' },
        ].map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <DrogaCard>
              <Typography variant="h3" color={s.color}>{loading ? '…' : s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </DrogaCard>
          </Grid>
        ))}
      </Grid>
      <DrogaCard>
        <Typography variant="h4" sx={{ mb: 2 }}>Pending Resource Requests</Typography>
        {loading ? <ActivityIndicator size={24} /> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Request</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">No pending requests found</TableCell></TableRow>
                ) : requests.slice(0, 20).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>{r.title || "No Title"}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">{r.description?.substring(0, 50)}...</Typography>
                    </TableCell>
                    <TableCell>{r.requested_by_details?.full_name || '—'}</TableCell>
                    <TableCell><Chip label={r.request_type} size="small" /></TableCell>
                    <TableCell>{r.quantity || 1}</TableCell>
                    <TableCell><Chip label={r.priority} size="small" color={r.priority === 'urgent' ? 'error' : r.priority === 'high' ? 'warning' : 'default'} /></TableCell>
                    <TableCell>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small" variant="contained" color="success" sx={{ mr: 1, px: 1, minWidth: 0 }}
                        onClick={() => navigate('/resource-requests')}
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DrogaCard>
    </Box>
  );
};

// ── Counselor Tab ───────────────────────────────────────────────────────────
const CounselorTab = ({ navigate }) => (
  <DrogaCard>
    <Typography variant="h4" sx={{ mb: 1 }}>Counselor Portal</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Access student behavioral and health data, and counseling communication tools.
    </Typography>
    <Grid container spacing={2}>
      {[
        { label: 'Student Behavior', sub: 'View behavior incidents & ratings', icon: IconBrain, color: '#7b1fa2', path: '/behavior' },
        { label: 'Student Health Records', sub: 'Access health conditions & records', icon: IconHeartbeat, color: '#c62828', path: '/health-records' },
        { label: 'Student Profiles', sub: 'Comprehensive student data', icon: IconSchool, color: '#1976d2', path: '/students' },
        { label: 'Messages', sub: 'Counseling communication tools', icon: IconMessage, color: '#2e7d32', path: '/messages' },
        { label: 'Announcements', sub: 'Post counseling notices', icon: IconBell, color: '#f57c00', path: '/announcements' },
        { label: 'Leave Requests', sub: 'Student leave management', icon: IconFileText, color: '#607d8b', path: '/leave-requests' },
      ].map((item, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Paper sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => navigate(item.path)}>
            <Stack direction="row" spacing={2} alignItems="center">
              <item.icon size={28} color={item.color} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </DrogaCard>
);

// ── Clinic Tab ──────────────────────────────────────────────────────────────
const ClinicTab = ({ navigate }) => (
  <DrogaCard>
    <Typography variant="h4" sx={{ mb: 1 }}>Clinic Management</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Student health records, incident reporting, and medical history management.
    </Typography>
    <Grid container spacing={2}>
      {[
        { label: 'Health Records', sub: 'Student health conditions & records', icon: IconHeartbeat, color: '#c62828', path: '/health-records' },
        { label: 'Behavior Incidents', sub: 'Incident reporting & tracking', icon: IconMicroscope, color: '#7b1fa2', path: '/behavior' },
        { label: 'Student Profiles', sub: 'Full student medical history', icon: IconSchool, color: '#1976d2', path: '/students' },
        { label: 'Leave Requests', sub: 'Medical leave management', icon: IconFileText, color: '#f57c00', path: '/leave-requests' },
        { label: 'Announcements', sub: 'Health notices & alerts', icon: IconBell, color: '#2e7d32', path: '/announcements' },
        { label: 'Data Export', sub: 'Export health reports', icon: IconDownload, color: '#607d8b', path: '/data-export' },
      ].map((item, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Paper sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => navigate(item.path)}>
            <Stack direction="row" spacing={2} alignItems="center">
              <item.icon size={28} color={item.color} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </DrogaCard>
);

// ── Library Tab ─────────────────────────────────────────────────────────────
const LibraryTab = ({ navigate }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = await GetToken();
        const res = await fetch(`${Backend.api}${Backend.digitalResources}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await res.json();
        if (res.ok) setResources(d.data || d.results || []);
      } catch { toast.error('Failed to load library resources'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <DrogaCard>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">Centralized Resource Library</Typography>
          <Typography variant="caption" color="text.secondary">Share audio, video, images, and documents across the school.</Typography>
        </Box>
        <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => navigate('/library/upload')}>
          Upload Resource
        </Button>
      </Stack>

      {loading ? <ActivityIndicator size={24} /> : (
        <Grid container spacing={2}>
          {resources.length === 0 ? (
            <Grid item xs={12}><Typography color="text.secondary" align="center" sx={{ py: 4 }}>No digital resources found in the library.</Typography></Grid>
          ) : resources.map((r, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>{r.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Type: {r.resource_type_display}</Typography>
                  <Typography variant="caption" color="text.secondary">By: {r.uploaded_by_name}</Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<IconDownload size={14} />} href={r.file} target="_blank">
                  Download
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </DrogaCard>
  );
};

// ── TLH Tab ─────────────────────────────────────────────────────────────────
const TLHTab = ({ navigate }) => (
  <DrogaCard>
    <Typography variant="h4" sx={{ mb: 1 }}>Teaching & Learning Head</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Oversee teaching methodologies, curriculum, teacher performance, and assigned grade students.
    </Typography>
    <Grid container spacing={2}>
      {[
        { label: 'Teacher Performance', sub: 'Monitor & manage teacher metrics', icon: IconTrendingUp, color: '#1976d2', path: '/teacher-performance' },
        { label: 'Teacher Ratings', sub: 'Rate and evaluate teachers', icon: IconStar, color: '#f57c00', path: '/teacher-ratings' },
        { label: 'Classes & Subjects', sub: 'Curriculum management', icon: IconBook, color: '#7b1fa2', path: '/classes' },
        { label: 'Schedule', sub: 'Timetable management', icon: IconCalendar, color: '#2e7d32', path: '/schedule' },
        { label: 'Assignments', sub: 'Monitor student assignments', icon: IconClipboardList, color: '#c62828', path: '/assignments' },
        { label: 'Students', sub: 'Monitor assigned grade students', icon: IconSchool, color: '#607d8b', path: '/students' },
        { label: 'Learning Objectives', sub: 'Curriculum objectives', icon: IconBrain, color: '#00838f', path: '/learning-objectives' },
        { label: 'Data Export', sub: 'Export academic reports', icon: IconDownload, color: '#455a64', path: '/data-export' },
      ].map((item, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Paper sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => navigate(item.path)}>
            <Stack direction="row" spacing={2} alignItems="center">
              <item.icon size={28} color={item.color} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </DrogaCard>
);

// ── Ranking Tab ─────────────────────────────────────────────────────────────
const RankingTab = ({ stats, loading, evalSettings, currentTerm }) => {
  const theme = useTheme();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><ActivityIndicator size={40} /></Box>;

  // Rankings based on TERM status - if term is closed/completed, rankings are 0
  const isTermClosed = currentTerm?.status === 'closed' || !currentTerm;
  const isEvalOpen = evalSettings?.is_evaluation_period_open === true && !isTermClosed;
  const teachers = stats.teacher_rankings || [];

  // DEBUG: Log state to console
  console.log('[RankingTab DEBUG]', {
    currentTerm,
    evalSettings,
    isTermClosed,
    isEvalOpen,
    teacherCount: teachers.length,
    firstTeacher: teachers[0]
  });

  return (
    <DrogaCard>
      {/* Term Status Alert */}
      {isTermClosed && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Term is COMPLETED - All rankings are reset to 0
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Teacher Performance Rankings</Typography>
          <Typography variant="caption" color="text.secondary">
            Performance Score is calculated from system data (ratings, attendance, tasks, student progress)
          </Typography>
        </Box>
        <IconTrophy size={32} color={isEvalOpen ? '#ffd700' : '#ccc'} />
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: '#fafafa' }}>
            <TableRow>
              <TableCell align="center" sx={{ width: 60 }}>Rank</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell align="center">Performance Score</TableCell>
              <TableCell align="center">Last Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => {
              // Performance Score = rating_score from backend (already calculated as percentage)
              const performanceScore = teacher.rating_score || 0;

              // Get rank color and icon
              const getRankStyles = (rank) => {
                if (rank === 1) return { bg: '#ffd700', color: '#000', icon: '🥇' }; // Gold
                if (rank === 2) return { bg: '#c0c0c0', color: '#000', icon: '🥈' }; // Silver
                if (rank === 3) return { bg: '#cd7f32', color: '#fff', icon: '🥉' }; // Bronze
                if (rank <= 5) return { bg: '#4caf50', color: '#fff', icon: null }; // Green
                if (rank <= 10) return { bg: '#2196f3', color: '#fff', icon: null }; // Blue
                return { bg: 'transparent', color: 'inherit', icon: null };
              };
              const rankStyles = getRankStyles(teacher.rank);

              return (
                <TableRow key={teacher.teacher_id} sx={{ '&:hover': { bgcolor: '#fdfdfd' } }}>
                  <TableCell align="center">
                    <Tooltip title={teacher.rank <= 3 ? `Top ${teacher.rank} Performer!` : `Rank ${teacher.rank}`}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '50%', bgcolor: rankStyles.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                        color: rankStyles.color, fontSize: rankStyles.icon ? '14px' : '12px',
                        border: teacher.rank <= 10 ? '2px solid' : 'none',
                        borderColor: teacher.rank <= 3 ? '#333' : 'transparent',
                        boxShadow: teacher.rank <= 3 ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                      }}>
                        {rankStyles.icon || teacher.rank}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{teacher.teacher_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{teacher.teacher_code}</Typography>
                  </TableCell>
                  <TableCell>{teacher.branch}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${performanceScore}%`}
                      color={performanceScore >= 85 ? 'success' : (performanceScore >= 70 ? 'primary' : 'warning')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption">{new Date(teacher.last_updated).toLocaleDateString()}</Typography>
                  </TableCell>
                </TableRow>
              );
            })}
            {teachers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No performance data available for this branch/period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </DrogaCard>
  );
};

// ── Analyst Tab ─────────────────────────────────────────────────────────────
const AnalystTab = ({ navigate }) => (
  <DrogaCard>
    <Typography variant="h4" sx={{ mb: 1 }}>Analyst Portal</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Access data points for reporting, insights, and raw data export.
    </Typography>
    <Grid container spacing={2}>
      {[
        { label: 'Data Export', sub: 'Export raw data (CSV, Excel, PDF)', icon: IconDownload, color: '#1976d2', path: '/data-export' },
        { label: 'Student Reports', sub: 'Academic performance analytics', icon: IconChartBar, color: '#7b1fa2', path: '/students' },
        { label: 'Teacher Reports', sub: 'Staff performance data', icon: IconTrendingUp, color: '#2e7d32', path: '/teacher-performance' },
        { label: 'Attendance Data', sub: 'Attendance analytics', icon: IconUserCheck, color: '#f57c00', path: '/attendance' },
        { label: 'Behavior Data', sub: 'Student behavior analytics', icon: IconBrain, color: '#c62828', path: '/behavior' },
        { label: 'Teacher Rankings', sub: 'Top performing staff', icon: IconStar, color: '#ffd700', path: '/teacher-performance' },
        { label: 'Library Stats', sub: 'Book usage & borrowing data', icon: IconBook, color: '#607d8b', path: '/library' },
        { label: 'Resource Usage', sub: 'Material expense analytics', icon: IconBuildingStore, color: '#795548', path: '/resource-requests' },
        { label: 'Grades & Exams', sub: 'Academic results data', icon: IconClipboardList, color: '#00838f', path: '/grades' },
      ].map((item, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Paper sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => navigate(item.path)}>
            <Stack direction="row" spacing={2} alignItems="center">
              <item.icon size={28} color={item.color} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </DrogaCard>
);

// ── Communication Tab ────────────────────────────────────────────────────────
const CommunicationTab = ({ navigate }) => {
  const [groupChatOpen, setGroupChatOpen] = useState(false);
  return (
    <DrogaCard>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h4">Communication Department</Typography>
        <Button variant="outlined" startIcon={<IconPlus size={16} />} onClick={() => setGroupChatOpen(true)}>
          New Group Chat
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage announcements, public relations, and internal communication strategies.
      </Typography>
      <Grid container spacing={2}>
        {[
          { label: 'Announcements', sub: 'School-wide alerts & notices', icon: IconBell, color: '#9c27b0', path: '/announcements' },
          { label: 'Messages', sub: 'Internal messaging hub', icon: IconMessage, color: '#1976d2', path: '/messages' },
          { label: 'Group Chats', sub: 'Manage group conversations', icon: IconMessages, color: '#2e7d32', path: '/messages?tab=groups' },
          { label: 'Blog / PR', sub: 'Public relations content', icon: IconFileText, color: '#f57c00', path: '/blog' },
          { label: 'Parent Feedback', sub: 'View parent communications', icon: IconUserCheck, color: '#c62828', path: '/meeting-requests' },
          { label: 'Meeting Requests', sub: 'Schedule & manage meetings', icon: IconCalendar, color: '#607d8b', path: '/meeting-requests' },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Paper sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => navigate(item.path)}>
              <Stack direction="row" spacing={2} alignItems="center">
                <item.icon size={28} color={item.color} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <GroupChatDialog open={groupChatOpen} onClose={() => setGroupChatOpen(false)} />
    </DrogaCard>
  );
};

// ── Head Admin / CEO Tab ─────────────────────────────────────────────────────
const HeadAdminTab = ({ stats, loading, navigate }) => {
  const theme = useTheme();
  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Students', value: stats.total_students, color: theme.palette.primary.main },
          { label: 'Total Teachers', value: stats.total_teachers, color: '#2e7d32' },
          { label: 'Total Parents', value: stats.total_parents, color: '#f57c00' },
          { label: 'Total Users', value: stats.total_students + stats.total_teachers + stats.total_parents, color: '#7b1fa2' },
        ].map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <DrogaCard>
              <Typography variant="h3" color={s.color}>{loading ? '…' : s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </DrogaCard>
          </Grid>
        ))}
      </Grid>
      <DrogaCard>
        <Typography variant="h4" sx={{ mb: 2 }}>High-Level Reports & Oversight</Typography>
        <Grid container spacing={2}>
          {[
            { label: 'All Students', sub: 'Full student roster & data', icon: IconSchool, color: '#1976d2', path: '/students' },
            { label: 'All Teachers', sub: 'Full staff roster & performance', icon: IconUsers, color: '#2e7d32', path: '/teachers' },
            { label: 'All Parents', sub: 'Parent registry', icon: IconUserCheck, color: '#f57c00', path: '/parents' },
            { label: 'User Management', sub: 'System users & roles', icon: IconShield, color: '#7b1fa2', path: '/users' },
            { label: 'Finance Overview', sub: 'Resource expense summary', icon: IconCoin, color: '#c62828', path: null },
            { label: 'Data Export', sub: 'Export all system data', icon: IconDownload, color: '#607d8b', path: '/data-export' },
            { label: 'Announcements', sub: 'School-wide communications', icon: IconBell, color: '#9c27b0', path: '/announcements' },
            { label: 'Library', sub: 'Library management', icon: IconBook, color: '#795548', path: '/library' },
            { label: 'Schedule', sub: 'School timetables', icon: IconCalendar, color: '#00838f', path: '/schedule' },
            { label: 'Resource Requests', sub: 'Inventory & materials', icon: IconBuildingStore, color: '#455a64', path: '/resource-requests' },
            { label: 'Role & Permissions', sub: 'Access control', icon: IconBriefcase, color: '#e91e63', path: '/role-permission' },
            { label: 'Teacher Performance', sub: 'Staff performance analytics', icon: IconTrendingUp, color: '#f57c00', path: '/teacher-performance' },
          ].map((item, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => item.path && navigate(item.path)}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <item.icon size={28} color={item.color} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DrogaCard>
    </Box>
  );
};

// ── Super Admin Tab ──────────────────────────────────────────────────────────
const SuperAdminTab = ({ stats, loading, navigate }) => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [approving, setApproving] = useState({});

  useEffect(() => {
    const load = async () => {
      setUsersLoading(true);
      setRolesLoading(true);
      try {
        const token = await GetToken();
        const [uRes, rRes, pRes] = await Promise.allSettled([
          fetch(`${Backend.api}${Backend.users}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.roles}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}users/pending/`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (uRes.status === 'fulfilled' && uRes.value.ok) {
          const d = await uRes.value.json();
          setUsers(d.data || d.results || []);
        }
        if (rRes.status === 'fulfilled' && rRes.value.ok) {
          const d = await rRes.value.json();
          setRoles(d.data || d.results || []);
        }
        if (pRes.status === 'fulfilled' && pRes.value.ok) {
          const d = await pRes.value.json();
          setPendingUsers(d.data || []);
        }
      } catch { toast.error('Failed to load system data'); }
      finally { setUsersLoading(false); setRolesLoading(false); }
    };
    load();
  }, []);

  const handleApprove = async (userId) => {
    setApproving(prev => ({ ...prev, [userId]: true }));
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}users/${userId}/update_status/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true })
      });
      if (res.ok) {
        toast.success('User approved successfully');
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        toast.error('Approval failed');
      }
    } catch {
      toast.error('Error approving user');
    } finally {
      setApproving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const systemModules = [
    { label: 'User Management', sub: 'Full CRUD on all users', icon: IconUsers, color: '#1976d2', path: '/users' },
    { label: 'Role & Permissions', sub: 'Create, modify, delete roles', icon: IconShield, color: '#7b1fa2', path: '/role-permission' },
    { label: 'Students', sub: 'Full student data CRUD', icon: IconSchool, color: theme.palette.primary.main, path: '/students' },
    { label: 'Teachers', sub: 'Full teacher data CRUD', icon: IconUsers, color: '#2e7d32', path: '/teachers' },
    { label: 'Parents', sub: 'Full parent data CRUD', icon: IconUserCheck, color: '#f57c00', path: '/parents' },
    { label: 'Classes (Grades)', sub: 'Manage grade levels', icon: IconBook, color: '#cc5d02', path: '/classes' },
    { label: 'Sections', sub: 'Manage class sections', icon: IconLayoutKanban, color: '#8e24aa', path: '/sections' },
    { label: 'Subjects', sub: 'Manage curriculum subjects', icon: IconBook, color: '#d84315', path: '/subjects' },
    { label: 'Schedule', sub: 'Import & manage timetables', icon: IconCalendar, color: '#8000ff', path: '/schedule' },
    { label: 'Announcements', sub: 'School-wide communications', icon: IconBell, color: '#9c27b0', path: '/announcements' },
    { label: 'Library', sub: 'Book rotation & management', icon: IconBook, color: '#795548', path: '/library' },
    { label: 'Resource Requests', sub: 'Inventory management', icon: IconBuildingStore, color: '#455a64', path: '/resource-requests' },
    { label: 'Data Export', sub: 'Export all raw system data', icon: IconDownload, color: '#607d8b', path: '/data-export' },
    { label: 'Messages', sub: 'All communications', icon: IconMessage, color: '#00838f', path: '/messages' },
    { label: 'Assignments', sub: 'Monitor all assignments', icon: IconClipboardList, color: '#e91e63', path: '/assignments' },
    { label: 'Behavior', sub: 'Student behavior monitoring', icon: IconBrain, color: '#c62828', path: '/behavior' },
    { label: 'Leave Requests', sub: 'Approve/reject all leaves', icon: IconFileText, color: '#f57c00', path: '/leave-requests' },
    { label: 'Teacher Performance', sub: 'Full performance monitoring', icon: IconTrendingUp, color: '#1976d2', path: '/teacher-performance' },
    { label: 'Blog / PR', sub: 'Public relations content', icon: IconFileText, color: '#6d4c41', path: '/blog' },
    { label: 'Finance Overview', sub: 'All expense data', icon: IconCoin, color: '#2e7d32', path: '/finance' },
  ];

  return (
    <Box>
      {/* Pending Approvals Section */}
      {pendingUsers.length > 0 && (
        <DrogaCard sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4" color="error">Pending User Approvals</Typography>
            <IconShield size={24} color={theme.palette.error.main} />
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Requested Roles</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingUsers.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell fontWeight="bold">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {(u.roles || []).map(r => <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />)}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={approving[u.id]}
                        onClick={() => handleApprove(u.id)}
                      >
                        {approving[u.id] ? <CircularProgress size={16} /> : 'Approve'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DrogaCard>
      )}

      {/* System Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Students', value: stats.total_students, color: theme.palette.primary.main },
          { label: 'Total Teachers', value: stats.total_teachers, color: '#2e7d32' },
          { label: 'Total Parents', value: stats.total_parents, color: '#f57c00' },
          { label: 'Total Users', value: usersLoading ? '…' : users.length, color: '#7b1fa2' },
          { label: 'Total Roles', value: rolesLoading ? '…' : roles.length, color: '#c62828' },
          { label: 'Total Classes', value: stats.total_classes, color: '#8000ff' },
          { label: 'Total Subjects', value: stats.total_subjects, color: '#cc5d02' },
          { label: 'Pending Leaves', value: stats.pending_leaves, color: '#00838f' },
        ].map((s, i) => (
          <Grid item xs={6} sm={4} md={3} key={i}>
            <DrogaCard>
              <Typography variant="h3" color={s.color}>{loading ? '…' : s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </DrogaCard>
          </Grid>
        ))}
      </Grid>

      {/* Full System Access */}
      <DrogaCard sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4">Full System Control</Typography>
            <Typography variant="body2" color="text.secondary">Complete CRUD access across all modules</Typography>
          </Box>
          <Chip label="Super Admin" color="error" size="small" />
        </Stack>
        <Grid container spacing={2}>
          {systemModules.map((item, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Paper
                sx={{ p: 2, cursor: item.path ? 'pointer' : 'default', '&:hover': item.path ? { bgcolor: '#f5f5f5' } : {} }}
                onClick={() => item.path && navigate(item.path)}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <item.icon size={24} color={item.color} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DrogaCard>

      {/* Users Table */}
      <DrogaCard sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">All System Users</Typography>
          <Button variant="outlined" size="small" onClick={() => navigate('/users')}>Manage Users</Button>
        </Stack>
        {usersLoading ? <ActivityIndicator size={24} /> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow><TableCell colSpan={3} align="center">No users found</TableCell></TableRow>
                ) : users.slice(0, 10).map((u, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{u.full_name || '—'}</TableCell>
                    <TableCell>{u.email || '—'}</TableCell>
                    <TableCell>
                      <Chip label={u.is_active ? 'Active' : 'Inactive'} size="small" color={u.is_active ? 'success' : 'default'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DrogaCard>

      {/* Roles Table */}
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">System Roles</Typography>
          <Button variant="outlined" size="small" onClick={() => navigate('/role-permission')}>Manage Roles</Button>
        </Stack>
        {rolesLoading ? <ActivityIndicator size={24} /> : (
          <Grid container spacing={1}>
            {roles.length === 0 ? (
              <Grid item xs={12}><Typography color="text.secondary" align="center">No roles found</Typography></Grid>
            ) : roles.map((r, i) => (
              <Grid item key={i}>
                <Chip label={r.name} color="primary" variant="outlined" />
              </Grid>
            ))}
          </Grid>
        )}
      </DrogaCard>
    </Box>
  );
};

// ── ROLE → TAB VISIBILITY MAP ────────────────────────────────────────────────
const ROLE_TABS = {
  admin: ['overview', 'hr', 'finance', 'counselor', 'clinic', 'tlh', 'analyst', 'communication', 'head_admin', 'ranking', 'library'],
  super_admin: ['overview', 'hr', 'finance', 'counselor', 'clinic', 'tlh', 'analyst', 'communication', 'head_admin', 'super_admin', 'ranking', 'library'],
  head_admin: ['overview', 'hr', 'finance', 'tlh', 'analyst', 'communication', 'head_admin', 'ranking', 'library'],
  ceo: ['overview', 'hr', 'finance', 'tlh', 'analyst', 'communication', 'head_admin', 'ranking', 'library'],
  hr: ['hr'],
  finance: ['finance'],
  counselor: ['counselor'],
  clinic: ['clinic'],
  tlh: ['overview', 'tlh'],
  analyst: ['analyst', 'ranking'],
  communication: ['communication'],
  staff: ['overview', 'hr', 'finance', 'counselor', 'clinic', 'tlh', 'analyst', 'communication', 'ranking', 'library'],
};

const ALL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'super_admin', label: 'Super Admin' },
  { key: 'hr', label: 'HR' },
  { key: 'finance', label: 'Finance' },
  { key: 'counselor', label: 'Counselor' },
  { key: 'clinic', label: 'Clinic' },
  { key: 'tlh', label: 'TLH' },
  { key: 'analyst', label: 'Analyst' },
  { key: 'communication', label: 'Communication' },
  { key: 'head_admin', label: 'Head Admin / CEO' },
  { key: 'ranking', label: 'Rankings' },
  { key: 'library', label: 'Library' },
];

// ── Main Component ───────────────────────────────────────────────────────────
const SMSAdminDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user?.user);
  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : r?.name || '').toLowerCase());

  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(user?.branch_id || '');
  const [addBranchDialogOpen, setAddBranchDialogOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    is_main: false
  });
  const [addingBranch, setAddingBranch] = useState(false);
  const [stats, setStats] = useState({
    total_students: 0, total_teachers: 0, total_classes: 0,
    total_subjects: 0, total_parents: 0, pending_tasks: 0,
    pending_leaves: 0, recent_announcements: 0,
    branch_classes: [], branch_students: [], branch_teachers: [],
    attendance_summary: { summary: { Present: 0, Absent: 0 }, breakdown: {} },
    teacher_rankings: [],
    recent_activity: []
  });
  const [activeTab, setActiveTab] = useState(0);
  const [evalSettings, setEvalSettings] = useState({ is_evaluation_period_open: false, start_date: null, end_date: null });
  const [currentTerm, setCurrentTerm] = useState(null);

  // Determine which tabs this user can see
  const visibleTabs = ALL_TABS.filter(t => {
    if (userRoles.includes('super_admin')) return true; // super_admin sees everything
    if (userRoles.includes('admin') || userRoles.includes('staff')) return t.key !== 'super_admin'; // both see all except super admin tab
    return userRoles.some(r => ROLE_TABS[r]?.includes(t.key));
  });

  const fetchDashboardStats = async () => {
    setLoading(true);
    const token = await GetToken();
    const branchId = selectedBranch;

    try {
      const newStats = { ...stats };

      const queryParams = branchId ? `?branch_id=${branchId}` : '';

      // Fetch branches if super_admin
      if (userRoles.includes('super_admin') && branches.length === 0) {
        const bRes = await fetch(`${Backend.api}${Backend.branches}`, { headers: { Authorization: `Bearer ${token}` } });
        if (bRes.ok) {
          const bData = await bRes.json();
          setBranches(Array.isArray(bData.data) ? bData.data : (bData.results || []));
        }
      }

      // Fetch evaluation period settings
      const evalSettingsRes = await fetch(`${Backend.api}performance-criteria/evaluation-settings/`, { headers: { Authorization: `Bearer ${token}` } });
      if (evalSettingsRes.ok) {
        const evalData = await evalSettingsRes.json();
        setEvalSettings(evalData.data || { is_evaluation_period_open: false, start_date: null, end_date: null });
      }

      // Fetch current term
      const termsRes = await fetch(`${Backend.api}${Backend.terms}?is_current=true`, { headers: { Authorization: `Bearer ${token}` } });
      if (termsRes.ok) {
        const termsData = await termsRes.json();
        const terms = termsData.data || termsData.results || [];
        setCurrentTerm(terms.length > 0 ? terms[0] : null);
      }

      const [studentsRes, teachersRes, classesRes, subjectsRes, parentsRes, leavesRes, announcementsRes, attendanceRes, branchClassesRes, branchStudentsRes, teacherRankingsRes] =
        await Promise.allSettled([
          fetch(`${Backend.api}${Backend.students}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.teachers}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.classes}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.subjects}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.parents}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.PendingLeavesRequests}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.announcements}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.attendanceDailySummary}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.classes}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.students}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${Backend.api}${Backend.teacherRankings}${queryParams}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

      const extract = (res) => res.status === 'fulfilled' && res.value.ok ? res.value.json() : Promise.resolve(null);
      const [s, t, c, sub, p, l, a, att, bc, bs, rank] = await Promise.all([
        extract(studentsRes), extract(teachersRes), extract(classesRes),
        extract(subjectsRes), extract(parentsRes), extract(leavesRes), extract(announcementsRes),
        extract(attendanceRes), extract(branchClassesRes), extract(branchStudentsRes), extract(teacherRankingsRes)
      ]);

      if (s) newStats.total_students = (Array.isArray(s.data) ? s.data : (s.results || [])).length;
      if (t) {
        const teachersData = Array.isArray(t.data) ? t.data : (t.results || []);
        newStats.total_teachers = teachersData.length;
        newStats.branch_teachers = teachersData;
      }
      if (c) newStats.total_classes = (Array.isArray(c.data) ? c.data : (c.results || [])).length;
      if (sub) newStats.total_subjects = (Array.isArray(sub.data) ? sub.data : (sub.results || [])).length;
      if (p) newStats.total_parents = (Array.isArray(p.data) ? p.data : (p.results || [])).length;
      if (l) newStats.pending_leaves = (Array.isArray(l.data) ? l.data : (l.results || [])).length;
      if (a) newStats.recent_announcements = (Array.isArray(a.data) ? a.data : (a.results || [])).length;

      if (att) newStats.attendance_summary = att.data || newStats.attendance_summary;
      if (bc) newStats.branch_classes = Array.isArray(bc.data) ? bc.data : (bc.results || []);
      if (bs) newStats.branch_students = Array.isArray(bs.data) ? bs.data : (bs.results || []);
      if (rank) newStats.teacher_rankings = rank.data || rank.results || [];

      setStats(newStats);
    } catch (e) { console.error('Dashboard error:', e); }
    finally { setLoading(false); }
  };

  const handleAddBranch = async () => {
    // Validate required fields
    if (!newBranch.name.trim()) {
      toast.error('Please enter a branch name');
      return;
    }
    if (!newBranch.code.trim()) {
      toast.error('Please enter a branch code');
      return;
    }
    if (!newBranch.address.trim()) {
      toast.error('Please enter an address');
      return;
    }
    if (!newBranch.phone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    if (!newBranch.email.trim()) {
      toast.error('Please enter an email');
      return;
    }

    setAddingBranch(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}branches/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newBranch.name.trim(),
          code: newBranch.code.trim(),
          address: newBranch.address.trim(),
          phone: newBranch.phone.trim(),
          email: newBranch.email.trim(),
          is_main: newBranch.is_main
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Branch created successfully!');
        setBranches(prev => [...prev, data.data]);
        setSelectedBranch(data.data.id);
        setNewBranch({ name: '', code: '', address: '', phone: '', email: '', is_main: false });
        setAddBranchDialogOpen(false);
      } else {
        toast.error(data.message || JSON.stringify(data.errors) || 'Failed to create branch');
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error('Error creating branch. Please try again.');
    } finally {
      setAddingBranch(false);
    }
  };

  useEffect(() => { fetchDashboardStats(); }, [selectedBranch]);

  const renderTab = (key) => {
    switch (key) {
      case 'overview': return <OverviewTab stats={stats} loading={loading} navigate={navigate} refreshStats={fetchDashboardStats} />;
      case 'super_admin': return <SuperAdminTab stats={stats} loading={loading} navigate={navigate} refreshStats={fetchDashboardStats} />;
      case 'hr': return <HRTab navigate={navigate} />;
      case 'finance': return <FinanceTab navigate={navigate} />;
      case 'counselor': return <CounselorTab navigate={navigate} />;
      case 'clinic': return <ClinicTab navigate={navigate} />;
      case 'tlh': return <TLHTab navigate={navigate} />;
      case 'analyst': return <AnalystTab navigate={navigate} />;
      case 'communication': return <CommunicationTab navigate={navigate} />;
      case 'head_admin': return <HeadAdminTab stats={stats} loading={loading} navigate={navigate} refreshStats={fetchDashboardStats} />;
      case 'ranking': return <RankingTab stats={stats} loading={loading} evalSettings={evalSettings} currentTerm={currentTerm} />
      case 'library': return <LibraryTab navigate={navigate} />;
      default: return null;
    }
  };

  const currentTabKey = visibleTabs[activeTab]?.key;

  return (
    <PageContainer title={userRoles.includes('super_admin') ? 'Super Admin Portal' : 'Administrator Portal'}>
      <DrogaCard sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h3" color="primary">MALD School Management System</Typography>
            <Typography variant="body2" color="text.secondary">
              {userRoles.includes('super_admin')
                ? 'Super Admin — Full System Access & Control'
                : 'Administrator Portal — Centralized Control & Oversight'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            {userRoles.includes('super_admin') && (
              <>
                <TextField
                  select
                  size="small"
                  label="Monitoring Branch"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">All Branches</MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconPlus size={16} />}
                  onClick={() => setAddBranchDialogOpen(true)}
                >
                  Add Branch
                </Button>
              </>
            )}
            <Button startIcon={<IconRefresh size={16} />} onClick={fetchDashboardStats} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        </Stack>
      </DrogaCard>

      {visibleTabs.length > 1 && (
        <DrogaCard sx={{ mb: 2, p: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {visibleTabs.map((t, i) => <Tab key={i} label={t.label} />)}
          </Tabs>
        </DrogaCard>
      )}

      {renderTab(currentTabKey)}

      {/* Add Branch Dialog */}
      <Dialog open={addBranchDialogOpen} onClose={() => setAddBranchDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Branch</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Branch Name *"
              fullWidth
              value={newBranch.name}
              onChange={(e) => setNewBranch(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Main Campus"
              disabled={addingBranch}
            />
            <TextField
              label="Branch Code *"
              fullWidth
              value={newBranch.code}
              onChange={(e) => setNewBranch(prev => ({ ...prev, code: e.target.value }))}
              placeholder="e.g., MAIN, NORTH"
              helperText="Unique code for the branch (max 20 chars)"
              disabled={addingBranch}
              inputProps={{ maxLength: 20 }}
            />
            <TextField
              label="Address *"
              fullWidth
              multiline
              rows={2}
              value={newBranch.address}
              onChange={(e) => setNewBranch(prev => ({ ...prev, address: e.target.value }))}
              placeholder="e.g., 123 School Street, City, Country"
              disabled={addingBranch}
            />
            <TextField
              label="Phone *"
              fullWidth
              value={newBranch.phone}
              onChange={(e) => setNewBranch(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g., +1234567890"
              disabled={addingBranch}
            />
            <TextField
              label="Email *"
              fullWidth
              type="email"
              value={newBranch.email}
              onChange={(e) => setNewBranch(prev => ({ ...prev, email: e.target.value }))}
              placeholder="e.g., branch@school.edu"
              disabled={addingBranch}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newBranch.is_main}
                  onChange={(e) => setNewBranch(prev => ({ ...prev, is_main: e.target.checked }))}
                  disabled={addingBranch}
                />
              }
              label="Is Main Branch"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddBranchDialogOpen(false)} disabled={addingBranch}>
            Cancel
          </Button>
          <Button
            onClick={handleAddBranch}
            variant="contained"
            disabled={!newBranch.name.trim() || !newBranch.code.trim() || !newBranch.address.trim() || !newBranch.phone.trim() || !newBranch.email.trim() || addingBranch}
            startIcon={addingBranch ? <CircularProgress size={16} /> : <IconPlus size={16} />}
          >
            {addingBranch ? 'Creating...' : 'Create Branch'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default SMSAdminDashboard;
