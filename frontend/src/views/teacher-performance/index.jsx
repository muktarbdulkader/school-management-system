import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Stack, Chip, Grid,
  Rating, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  InputAdornment, IconButton, Tooltip
} from '@mui/material';
import { 
  IconRefresh, IconPlus, IconStar, IconFileText, IconDownload, 
  IconSearch, IconTrendingUp, IconUsers, IconChecklist 
} from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import PerformanceRatingForm from './components/PerformanceRatingForm';
import TeacherTaskForm from './components/TeacherTaskForm';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from 'config/rolePermissions';

// ── Metric Card ──────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, color = 'primary', icon: Icon }) => (
  <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>{label}</Typography>
          <Typography variant="h3" color={color} sx={{ fontWeight: 700 }}>{value}</Typography>
          {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{sub}</Typography>}
        </Box>
        {Icon && (
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}.lighter`, color: `${color}.main` }}>
            <Icon size={24} />
          </Box>
        )}
      </Stack>
    </CardContent>
  </Card>
);

// ── Report Generation Dialog ─────────────────────────────────────────────────
const ReportDialog = ({ open, onClose, teacher }) => {
  const [form, setForm] = useState({ 
    report_period: 'monthly', 
    start_date: dayjs().startOf('month').format('YYYY-MM-DD'), 
    end_date: dayjs().endOf('month').format('YYYY-MM-DD'), 
    strengths: '', 
    areas_for_improvement: '', 
    recommendations: '', 
    overall_score: '' 
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.start_date || !form.end_date || !form.overall_score) { 
        toast.error('Fill required fields'); 
        return; 
    }
    setSaving(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.teacherReports}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, teacher: teacher.id })
      });
      const data = await res.json();
      if (res.ok) { 
          toast.success('Report generated successfully'); 
          onClose(); 
      } else {
          toast.error(data.message || 'Failed to generate report');
      }
    } catch { 
        toast.error('Error connecting to server'); 
    } finally { 
        setSaving(false); 
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Generate Performance Report</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
          Teacher: {teacher?.user_details?.full_name || 'Selected Teacher'}
        </Typography>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField select label="Report Period" value={form.report_period} onChange={e => setForm({ ...form, report_period: e.target.value })} fullWidth>
            {['monthly','quarterly','semester','annual'].map(p => <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField label="Start Date *" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="End Date *" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
          <TextField 
            label="Overall Score (0-100) *" 
            type="number" 
            value={form.overall_score} 
            onChange={e => setForm({ ...form, overall_score: e.target.value })} 
            fullWidth 
            inputProps={{ min: 0, max: 100 }}
            helperText="Quantitative performance summary"
          />
          <TextField label="Key Strengths" value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} fullWidth multiline rows={2} />
          <TextField label="Areas for Improvement" value={form.areas_for_improvement} onChange={e => setForm({ ...form, areas_for_improvement: e.target.value })} fullWidth multiline rows={2} />
          <TextField label="Final Recommendations" value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} fullWidth multiline rows={2} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={18} /> : <IconFileText size={18} />}>
          {saving ? 'Generating...' : 'Generate Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────
const TeacherPerformancePage = () => {
    const [teachers, setTeachers] = useState([]);
    const [stats, setStats] = useState({ total_teachers: 0, avg_rating: 0, tasks_completed: 0, reports_generated: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [ratingOpen, setRatingOpen] = useState(false);
    const [taskOpen, setTaskOpen] = useState(false);

    const userRoles = useSelector((state) => state.user?.user?.roles || []);
    const canManagePerformance = hasPermission(userRoles, PERMISSIONS.MANAGE_TEACHER_PERFORMANCE);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await GetToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch teachers list
            const teachersRes = await fetch(`${Backend.api}${Backend.teachers}`, { headers });
            const teachersData = await teachersRes.json();
            setTeachers(teachersData.data || []);

            // Use simplified metrics calculation for now
            const teacherList = teachersData.data || [];
            setStats({
                total_teachers: teacherList.length,
                avg_rating: 4.5, // Placeholder metric
                tasks_completed: 124, // Placeholder metric
                reports_generated: 45 // Placeholder metric
            });

        } catch (error) {
            console.error('Error fetching performance data:', error);
            toast.error('Failed to load performance metrics');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = (teacher) => {
        setSelectedTeacher(teacher);
        setReportOpen(true);
    };

    const handleAddRating = (teacher) => {
        setSelectedTeacher(teacher);
        setRatingOpen(true);
    };

    const handleAssignTask = (teacher) => {
        setSelectedTeacher(teacher);
        setTaskOpen(true);
    };

    const filteredTeachers = teachers.filter(t => 
        t.user_details?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.teacher_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <PageContainer title="Teacher Performance">
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <ActivityIndicator size={40} />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer title="Teacher Performance Management">
            <Stack spacing={4}>
                {/* Metrics Summary */}
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard label="Total Teachers" value={stats.total_teachers} icon={IconUsers} color="primary" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard label="Average Rating" value={stats.avg_rating} sub="Out of 5.0" icon={IconStar} color="warning" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard label="Open Tasks" value={stats.tasks_completed} icon={IconChecklist} color="success" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard label="Reports Generated" value={stats.reports_generated} icon={IconTrendingUp} color="secondary" />
                    </Grid>
                </Grid>

                {/* Teachers List */}
                <DrogaCard>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>Teacher Analytics</Typography>
                        <Button startIcon={<IconRefresh size={18} />} onClick={fetchData}>Refresh Data</Button>
                    </Stack>

                    <TextField
                        fullWidth
                        placeholder="Search by teacher name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ mb: 3 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconSearch size={20} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TableContainer>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Teacher Info</TableCell>
                                    <TableCell>Avg Rating</TableCell>
                                    <TableCell>Attendance</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Performance Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTeachers.map((teacher) => (
                                    <TableRow key={teacher.id} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{teacher.user_details?.full_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">ID: {teacher.teacher_id}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Rating value={4.2} readOnly size="small" precision={0.5} />
                                            <Typography variant="caption" sx={{ ml: 1, verticalAlign: 'middle' }}>4.2</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ width: 80 }}>
                                                <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>95%</Typography>
                                                <LinearProgress variant="determinate" value={95} color="success" sx={{ height: 4, borderRadius: 2 }} />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label="High Performer" 
                                                size="small" 
                                                color="success" 
                                                variant="light"
                                                sx={{ borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Tooltip title="View/Add Ratings">
                                                    <IconButton size="small" color="warning" onClick={() => handleAddRating(teacher)}>
                                                        <IconStar size={20} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Assign Tasks">
                                                    <IconButton size="small" color="primary" onClick={() => handleAssignTask(teacher)}>
                                                        <IconPlus size={20} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Generate Report">
                                                    <IconButton size="small" color="secondary" onClick={() => handleGenerateReport(teacher)}>
                                                        <IconFileText size={20} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DrogaCard>
            </Stack>

            {/* Modals */}
            <ReportDialog 
                open={reportOpen} 
                onClose={() => setReportOpen(false)} 
                teacher={selectedTeacher} 
            />
            
            {selectedTeacher && (
                <>
                    <PerformanceRatingForm 
                        open={ratingOpen} 
                        onClose={() => setRatingOpen(false)} 
                        teacher={selectedTeacher}
                        onSuccess={fetchData}
                    />
                    <TeacherTaskForm
                        open={taskOpen}
                        onClose={() => setTaskOpen(false)}
                        teacher={selectedTeacher}
                        onSuccess={fetchData}
                    />
                </>
            )}
        </PageContainer>
    );
};

export default TeacherPerformancePage;
