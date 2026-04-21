import React, { useEffect, useState } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Stack, Chip, Grid,
    Rating, LinearProgress, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
    InputAdornment, IconButton, Tooltip, Alert
} from '@mui/material';
import {
    IconRefresh, IconPlus, IconStar, IconFileText, IconDownload,
    IconSearch, IconTrendingUp, IconUsers, IconChecklist,
    IconSettings, IconClipboardList, IconChartBar
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
import CriteriaManagement from './components/CriteriaManagement';
import DynamicEvaluationForm from './components/DynamicEvaluationForm';
import EvaluationsList from './components/EvaluationsList';
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
const ReportDialog = ({ open, onClose, teacher, evalSettings, onSuccess }) => {
    const [form, setForm] = useState({
        report_period: 'monthly',
        start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
        end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
        overall_score: '',
        strengths: '',
        areas_for_improvement: '',
        recommendations: ''
    });
    const [saving, setSaving] = useState(false);

    // Pre-populate overall_score from teacher's ranking data when dialog opens
    useEffect(() => {
        if (open && teacher) {
            // If evaluation is closed, score is 0
            const isEvalOpen = evalSettings?.is_evaluation_period_open || false;
            let rankingScore = '0';

            if (isEvalOpen) {
                // Extract score from teacher data - either calculated_score or derive from rating_stats
                if (teacher.calculated_score !== undefined && teacher.calculated_score !== null) {
                    rankingScore = Math.round(teacher.calculated_score).toString();
                } else if (teacher.rating_stats?.overall_avg) {
                    // Convert 5-star rating to percentage (e.g., 4.5/5 = 90%)
                    rankingScore = Math.round((teacher.rating_stats.overall_avg / 5) * 100).toString();
                } else if (teacher.overall_score) {
                    rankingScore = Math.round(teacher.overall_score).toString();
                }
            }

            setForm(prev => ({
                ...prev,
                overall_score: rankingScore
            }));
        }
    }, [open, teacher, evalSettings]);

    const handleSave = async () => {
        if (!form.start_date || !form.end_date || !form.overall_score) {
            toast.error('Fill required fields');
            return;
        }

        // Check if teacher already has a report
        if (teacher?.is_reported) {
            toast.error('Report already generated for this teacher in this evaluation period');
            return;
        }

        // Check if evaluation period is open
        if (!evalSettings?.is_evaluation_period_open) {
            toast.error('Cannot generate report: Evaluation period is closed');
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
                onSuccess?.(); // Refresh teacher data to show updated status
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
                {/* Already Reported Alert */}
                {teacher?.is_reported && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={600}>
                            Report Already Generated
                        </Typography>
                        <Typography variant="caption">
                            This teacher already has a report for this evaluation period. Cannot generate duplicate reports.
                        </Typography>
                    </Alert>
                )}
                {/* Evaluation Period Status Alert */}
                {!evalSettings?.is_evaluation_period_open && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={600}>
                            Evaluation Period is CLOSED
                        </Typography>
                        <Typography variant="caption">
                            All scores are reset to 0. You cannot generate reports when evaluation is closed.
                        </Typography>
                    </Alert>
                )}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
                    Teacher: {teacher?.user_details?.full_name || 'Selected Teacher'}
                    {teacher?.is_reported && (
                        <Chip
                            label="Already Reported"
                            color="info"
                            size="small"
                            sx={{ ml: 1 }}
                        />
                    )}
                </Typography>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <TextField select label="Report Period" value={form.report_period} onChange={e => setForm({ ...form, report_period: e.target.value })} fullWidth disabled={teacher?.is_reported}>
                        {['monthly', 'quarterly', 'semester', 'annual'].map(p => <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>)}
                    </TextField>
                    <Stack direction="row" spacing={2}>
                        <TextField label="Start Date *" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} disabled={teacher?.is_reported} />
                        <TextField label="End Date *" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} disabled={teacher?.is_reported} />
                    </Stack>
                    <TextField
                        label="Overall Score (0-100) *"
                        type="number"
                        value={form.overall_score}
                        onChange={e => setForm({ ...form, overall_score: e.target.value })}
                        fullWidth
                        inputProps={{ min: 0, max: 100 }}
                        disabled={!evalSettings?.is_evaluation_period_open || teacher?.is_reported}
                        helperText={
                            teacher?.is_reported
                                ? "Report already generated - cannot modify"
                                : !evalSettings?.is_evaluation_period_open
                                    ? "Evaluation closed - Score is 0"
                                    : teacher?.calculated_score || teacher?.rating_stats?.overall_avg
                                        ? "Auto-populated from teacher ranking data (editable)"
                                        : "Enter performance score (0-100)"
                        }
                    />
                    <TextField label="Key Strengths" value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} fullWidth multiline rows={2} disabled={teacher?.is_reported} />
                    <TextField label="Areas for Improvement" value={form.areas_for_improvement} onChange={e => setForm({ ...form, areas_for_improvement: e.target.value })} fullWidth multiline rows={2} disabled={teacher?.is_reported} />
                    <TextField label="Final Recommendations" value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} fullWidth multiline rows={2} disabled={teacher?.is_reported} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || !evalSettings?.is_evaluation_period_open || teacher?.is_reported}
                    startIcon={saving ? <CircularProgress size={18} /> : <IconFileText size={18} />}
                >
                    {teacher?.is_reported
                        ? 'Already Reported'
                        : !evalSettings?.is_evaluation_period_open
                            ? 'Evaluation Closed'
                            : saving
                                ? 'Generating...'
                                : 'Generate Report'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Main Page Component ──────────────────────────────────────────────────────
const TeacherPerformancePage = () => {
    const [teachers, setTeachers] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [stats, setStats] = useState({ total_teachers: 0, avg_rating: 0, tasks_completed: 0, reports_generated: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [ratingOpen, setRatingOpen] = useState(false);
    const [taskOpen, setTaskOpen] = useState(false);

    // New state for dynamic performance management
    const [criteriaManagementOpen, setCriteriaManagementOpen] = useState(false);
    const [evaluationOpen, setEvaluationOpen] = useState(false);
    const [evaluationsListOpen, setEvaluationsListOpen] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [teacherDetailsOpen, setTeacherDetailsOpen] = useState(false);
    const [teacherPerformanceData, setTeacherPerformanceData] = useState(null);

    // Evaluation period status - controls report generation and score display
    const [evalSettings, setEvalSettings] = useState({ is_evaluation_period_open: false });
    const [reportsList, setReportsList] = useState([]);

    const userRoles = useSelector((state) => state.user?.user?.roles || []);
    const isAdmin = userRoles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo'].includes(r?.toLowerCase()));
    // Use hasPermission OR isAdmin check for super admin/ceo fallback
    const canManagePerformance = isAdmin || hasPermission(userRoles, PERMISSIONS.MANAGE_TEACHER_PERFORMANCE);
    const canManageCriteria = isAdmin || hasPermission(userRoles, PERMISSIONS.MANAGE_TEACHER_PERFORMANCE);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await GetToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch teachers list, criteria, tasks, reports, and evaluation settings in parallel
            const [teachersRes, criteriaRes, tasksRes, reportsRes, evalSettingsRes] = await Promise.all([
                fetch(`${Backend.api}${Backend.teachers}`, { headers }),
                fetch(`${Backend.api}${Backend.performanceCriteriaActive}`, { headers }),
                fetch(`${Backend.api}${Backend.teacherTasks}`, { headers }),
                fetch(`${Backend.api}${Backend.teacherReports}`, { headers }),
                fetch(`${Backend.api}${Backend.performanceEvaluationSettings}`, { headers })
            ]);

            const teachersData = await teachersRes.json();
            const criteriaData = await criteriaRes.json();
            const tasksData = await tasksRes.json();
            const reportsData = await reportsRes.json();
            const evalSettingsData = await evalSettingsRes.json();

            const teacherList = teachersData.data || [];
            const tasksList = tasksData.data || [];
            const allReports = reportsData.data || [];
            const evalPeriodStatus = evalSettingsData.data || { is_evaluation_period_open: false, period_id: null };

            // Get current evaluation period ID
            const currentPeriodId = evalPeriodStatus?.period_id;
            const isEvalOpen = evalPeriodStatus?.is_evaluation_period_open || false;

            // Filter reports to only those created in current evaluation period
            // STRICT: Only show reports with matching period_id when period tracking is active
            const reportsInCurrentPeriod = allReports.filter(r => {
                // If we have a current period ID, only show reports with that ID
                if (currentPeriodId) {
                    return r.evaluation_period_id === currentPeriodId;
                }
                // No period tracking - show nothing (all old reports archived)
                return false;
            });

            setReportsList(reportsInCurrentPeriod);
            setEvalSettings(evalPeriodStatus);

            setTeachers(teacherList);
            setCriteria(criteriaData.data || []);

            // Calculate real metrics based on teacher data
            let totalRating = 0;
            let ratedTeachersCount = 0;
            let totalAttendance = 0;

            teacherList.forEach(t => {
                const rating = t.rating_stats?.overall_avg || t.rating || 0;
                if (rating > 0) {
                    totalRating += rating;
                    ratedTeachersCount++;
                }
                totalAttendance += t.attendance_percentage || 100;
            });

            const avgRating = ratedTeachersCount > 0 ? (totalRating / ratedTeachersCount).toFixed(1) : '0.0';
            const avgAttendance = teacherList.length > 0 ? Math.round(totalAttendance / teacherList.length) : 0;

            // Calculate tasks metrics
            const totalTasks = tasksList.length;
            const completedTasks = tasksList.filter(t => t.status === 'completed').length;
            const openTasks = totalTasks - completedTasks;

            // Calculate reports metrics
            const totalReports = reportsInCurrentPeriod.length;

            // Update teacher data with calculated attendance
            const updatedTeachers = teacherList.map(t => {
                // Calculate score - if evaluation is closed, score is 0
                let calculatedScore = 0;
                if (isEvalOpen && t.rating_stats?.overall_avg) {
                    calculatedScore = Math.round((t.rating_stats.overall_avg / 5) * 100);
                }

                return {
                    ...t,
                    attendance_percentage: t.attendance_percentage || avgAttendance,
                    calculated_score: calculatedScore,
                    // Use backend's is_reported which checks by evaluation period
                    // Reset rating display when evaluation closed
                    rating_stats: isEvalOpen ? t.rating_stats : { overall_avg: 0, total_count: 0 }
                };
            });

            setTeachers(updatedTeachers);

            setStats({
                total_teachers: teacherList.length,
                avg_rating: avgRating,
                avg_attendance: avgAttendance,
                total_tasks: totalTasks,
                tasks_completed: completedTasks,
                open_tasks: openTasks,
                reports_generated: totalReports
            });

        } catch (error) {
            console.error('Error fetching performance data:', error);
            toast.error('Failed to load performance metrics');
        } finally {
            setLoading(false);
        }
    };

    const handleViewTeacherDetails = async (teacher) => {
        setSelectedTeacher(teacher);
        try {
            const token = await GetToken();
            // Fetch detailed performance data including criteria breakdown
            const response = await fetch(
                `${Backend.api}${Backend.performanceEvaluationByTeacher(teacher.id)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.success) {
                setTeacherPerformanceData(data.data || []);
                setTeacherDetailsOpen(true);
            } else {
                toast.error('Failed to load teacher performance details');
            }
        } catch (error) {
            console.error('Error fetching teacher details:', error);
            toast.error('Failed to load teacher performance details');
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

    // New handlers for dynamic performance management
    const handleManageCriteria = () => {
        setCriteriaManagementOpen(true);
    };

    const handleCreateEvaluation = (teacher = null) => {
        setSelectedTeacher(teacher);
        setSelectedEvaluation(null);
        setEvaluationOpen(true);
    };

    const handleEditEvaluation = (evaluation) => {
        setSelectedEvaluation(evaluation);
        setSelectedTeacher(teachers.find(t => t.id === evaluation.teacher));
        setEvaluationOpen(true);
    };

    const handleViewEvaluations = (teacher = null) => {
        setSelectedTeacher(teacher);
        setEvaluationsListOpen(true);
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
                        <MetricCard
                            label="Average Rating"
                            value={stats.avg_rating}
                            sub={`Out of 5.0 • ${stats.total_tasks > 0 ? Math.round((stats.tasks_completed / stats.total_tasks) * 100) : 0}% tasks completed`}
                            icon={IconStar}
                            color="warning"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            label="Open Tasks"
                            value={stats.open_tasks || 0}
                            sub={`${stats.tasks_completed || 0} completed of ${stats.total_tasks || 0} total`}
                            icon={IconChecklist}
                            color="success"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard label="Reports Generated" value={stats.reports_generated} icon={IconTrendingUp} color="secondary" />
                    </Grid>
                </Grid>

                {/* Teachers List */}
                <DrogaCard>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>Teacher Analytics</Typography>
                        <Stack direction="row" spacing={1}>
                            {canManageCriteria && (
                                <Button
                                    variant="outlined"
                                    startIcon={<IconSettings size={18} />}
                                    onClick={handleManageCriteria}
                                >
                                    Manage Criteria
                                </Button>
                            )}
                            <Button
                                variant="outlined"
                                startIcon={<IconClipboardList size={18} />}
                                onClick={() => handleViewEvaluations()}
                            >
                                All Evaluations
                            </Button>
                            <Button startIcon={<IconRefresh size={18} />} onClick={fetchData}>Refresh Data</Button>
                        </Stack>
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
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                    {teacher.user_details?.full_name || teacher.full_name || 'Unknown'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: {teacher.teacher_id}
                                                </Typography>
                                                <Typography variant="caption" color="primary" sx={{ display: 'block', fontWeight: 600 }}>
                                                    Score: {teacher.calculated_score || Math.round(((teacher.rating_stats?.overall_avg || 0) / 5) * 100)}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Rating
                                                        value={teacher.rating_stats?.overall_avg || teacher.rating || 0}
                                                        readOnly
                                                        size="small"
                                                        precision={0.1}
                                                    />
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {teacher.rating_stats?.overall_avg?.toFixed(1) || teacher.rating || '0.0'}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">
                                                    {teacher.rating_stats?.total_count || 0} ratings
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ width: 100 }}>
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                                    <Typography variant="caption">{teacher.attendance_percentage || 95}%</Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={teacher.attendance_percentage || 95}
                                                    color={teacher.attendance_percentage >= 90 ? 'success' : teacher.attendance_percentage >= 75 ? 'warning' : 'error'}
                                                    sx={{ height: 4, borderRadius: 2 }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5} alignItems="flex-start">
                                                {(() => {
                                                    const score = teacher.calculated_score || 0;
                                                    let label = 'Needs Improvement';
                                                    let color = 'error';
                                                    if (score >= 85) {
                                                        label = 'High Performer';
                                                        color = 'success';
                                                    } else if (score >= 70) {
                                                        label = 'Good';
                                                        color = 'primary';
                                                    } else if (score >= 50) {
                                                        label = 'Average';
                                                        color = 'warning';
                                                    }
                                                    return (
                                                        <Chip
                                                            label={label}
                                                            size="small"
                                                            color={color}
                                                            variant="light"
                                                            sx={{ borderRadius: 1 }}
                                                        />
                                                    );
                                                })()}
                                                {/* Show Reported status */}
                                                {teacher.is_reported && (
                                                    <Chip
                                                        icon={<IconFileText size={14} />}
                                                        label="Reported"
                                                        size="small"
                                                        color="info"
                                                        variant="filled"
                                                        sx={{ borderRadius: 1, fontWeight: 600 }}
                                                    />
                                                )}
                                                {/* Show Evaluation Period Status */}
                                                {!evalSettings?.is_evaluation_period_open && (
                                                    <Chip
                                                        label="Eval Closed"
                                                        size="small"
                                                        color="default"
                                                        variant="outlined"
                                                        sx={{ borderRadius: 1, fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                {/* Only show View Ratings for teachers viewing their own profile, not for admin */}
                                                {!canManagePerformance && (
                                                    <Tooltip title="View My Ratings">
                                                        <IconButton size="small" color="warning" onClick={() => handleAddRating(teacher)}>
                                                            <IconStar size={20} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Assign Tasks">
                                                    <IconButton size="small" color="primary" onClick={() => handleAssignTask(teacher)}>
                                                        <IconPlus size={20} />
                                                    </IconButton>
                                                </Tooltip>
                                                {/* Create Evaluation removed - Admin only reviews student/parent ratings */}
                                                <Tooltip title="View All Evaluations">
                                                    <IconButton size="small" color="success" onClick={() => handleViewEvaluations(teacher)}>
                                                        <IconClipboardList size={20} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip
                                                    title={
                                                        teacher.is_reported
                                                            ? "Report already generated for this teacher"
                                                            : !evalSettings?.is_evaluation_period_open
                                                                ? "Evaluation period is closed - cannot generate reports"
                                                                : "Generate Report"
                                                    }
                                                >
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            color="secondary"
                                                            onClick={() => handleGenerateReport(teacher)}
                                                            disabled={teacher.is_reported || !evalSettings?.is_evaluation_period_open}
                                                        >
                                                            <IconFileText size={20} />
                                                        </IconButton>
                                                    </span>
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
                evalSettings={evalSettings}
                onSuccess={fetchData}
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

            {/* Dynamic Performance Management Modals */}
            <CriteriaManagement
                open={criteriaManagementOpen}
                onClose={() => setCriteriaManagementOpen(false)}
            />

            <DynamicEvaluationForm
                open={evaluationOpen}
                onClose={() => setEvaluationOpen(false)}
                preselectedTeacher={selectedTeacher}
                onSuccess={fetchData}
            />

            <EvaluationsList
                open={evaluationsListOpen}
                onClose={() => setEvaluationsListOpen(false)}
                teacherId={selectedTeacher?.id}
                onEdit={handleEditEvaluation}
                onCreate={handleCreateEvaluation}
                canCreate={false} // Admin only reviews, does not create evaluations
            />
        </PageContainer>
    );
};

export default TeacherPerformancePage;
