// subject-detail-modal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Collapse,
  Button,
  Stack,
  Tabs,
  Tab,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Today as TodayIcon,
  DateRange as WeekIcon,
  CalendarToday as SemesterIcon,
  PlayCircle as CurrentIcon,
  DoneAll as CompletedIcon,
  HourglassEmpty as UpcomingIcon,
} from '@mui/icons-material';

export function SubjectDetailModal({
  open,
  onClose,
  subject,
  loading,
  error,
  detailData,
  // optional callbacks
}) {
  // Controls collapse for summary cards (current open by default)
  const [openSections, setOpenSections] = useState({
    total: false,
    completed: false,
    current: true,
    upcoming: false,
  });

  // Time period filter: 'all' | 'daily' | 'weekly' | 'semester'
  const [timeFilter, setTimeFilter] = useState('all');

  // Controls per-unit subunit expansion (by unit id)
  const [openUnitSubunits, setOpenUnitSubunits] = useState({});

  useEffect(() => {
    // Auto-open subunits for units that are in detailData.current_units
    if (detailData) {
      const map = {};
      const currentUnits = detailData.current_units || [];
      currentUnits.forEach((u) => {
        if (u.id) map[u.id] = true;
      });
      setOpenUnitSubunits(map);
    }
  }, [detailData]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleUnitSubunits = (unitId) => {
    setOpenUnitSubunits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleTimeFilterChange = (event, newValue) => {
    setTimeFilter(newValue);
  };

  // Filter units based on time period
  const filterUnitsByTime = (units) => {
    if (!units || timeFilter === 'all') return units;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const semesterStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);

    return units.filter(unit => {
      const unitDate = unit.updated_at || unit.completed_at || unit.created_at;
      if (!unitDate) return true; // Include units without dates

      const date = new Date(unitDate);

      switch (timeFilter) {
        case 'daily':
          return date >= today;
        case 'weekly':
          return date >= weekAgo;
        case 'semester':
          return date >= semesterStart;
        default:
          return true;
      }
    });
  };

  // Calculate progress statistics
  const calculateProgressStats = () => {
    if (!detailData) return null;

    const currentUnits = filterUnitsByTime(detailData.current_units) || [];
    const upcomingUnits = filterUnitsByTime(detailData.upcoming_units) || [];
    const pastUnits = filterUnitsByTime(detailData.past_units) || [];

    const total = currentUnits.length + upcomingUnits.length + pastUnits.length;
    const completed = pastUnits.length;
    const inProgress = currentUnits.length;

    return {
      total,
      completed,
      inProgress,
      upcoming: upcomingUnits.length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const progressStats = calculateProgressStats();

  // Flexible function to extract a numeric count from different summary shapes
  const getSummaryCount = (data) => {
    if (data == null) return 0;
    if (typeof data === 'number') return data;
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object') {
      if (typeof data.count === 'number') return data.count;
      if (Array.isArray(data.subunits)) return data.subunits.length;
      if (typeof data.total === 'number') return data.total;
    }
    return 0;
  };

  // Get status icon for unit
  const getStatusIcon = (isCompleted, isCurrent) => {
    if (isCompleted) return <CompletedIcon color="success" fontSize="small" />;
    if (isCurrent) return <CurrentIcon color="primary" fontSize="small" />;
    return <UpcomingIcon color="disabled" fontSize="small" />;
  };

  // Get status label
  const getStatusLabel = (isCompleted, isCurrent) => {
    if (isCompleted) return { text: 'Completed', color: 'success' };
    if (isCurrent) return { text: 'In Progress', color: 'primary' };
    return { text: 'Upcoming', color: 'default' };
  };

  // Render card with optional subunit list
  const renderCard = (label, data, color, section) => {
    const value = getSummaryCount(data);
    const subunits = data && data.subunits ? data.subunits : [];

    return (
      <Grid item xs={12} sm={3}>
        <Card
          variant="outlined"
          sx={{ cursor: subunits.length ? 'pointer' : 'default' }}
          onClick={() => subunits.length && toggleSection(section)}
        >
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color={color}>
              {value}
            </Typography>
            <Typography variant="body2">{label}</Typography>
          </CardContent>

          {subunits.length > 0 && (
            <Collapse in={openSections[section]}>
              <List dense>
                {subunits.map((sub) => (
                  <ListItem key={sub.id || sub.name} sx={{ pl: 3 }}>
                    <ListItemIcon>
                      {sub.is_completed ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <UncheckedIcon color="disabled" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={sub.name || 'Unnamed subunit'}
                      secondary={
                        sub.completion_percentage !== undefined
                          ? `Progress: ${sub.completion_percentage}%`
                          : sub.is_completed
                            ? 'Completed'
                            : ''
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          )}
        </Card>
      </Grid>
    );
  };

  // Render each unit in lists (current/upcoming/past)
  const renderUnitList = (units, title, emptyMessage, isCurrentList = false) => (
    <Box mb={3}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      {units && units.length > 0 ? (
        <List dense>
          {units.map((unit, index) => {
            const unitId = unit.id || `unit-${index}`;
            const subunits = unit.subunits || [];
            const isCompleted = !!unit.is_completed;
            const isCurrent = isCurrentList || !!unit.is_current; // fallback to prop or flag

            return (
              <Box key={unitId} mb={1}>
                <ListItem alignItems="flex-start" sx={{ pr: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <AssignmentIcon color={isCompleted ? 'success' : 'primary'} />
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography component="span" variant="subtitle1">
                            {unit.name || `Unit ${index + 1}`}
                          </Typography>
                          <Chip
                            size="small"
                            label={getStatusLabel(isCompleted, isCurrent).text}
                            color={getStatusLabel(isCompleted, isCurrent).color}
                            icon={getStatusIcon(isCompleted, isCurrent)}
                            sx={{ ml: 1 }}
                          />
                          <Typography
                            component="span"
                            sx={{ ml: 1 }}
                            variant="body2"
                            color="text.secondary"
                          >
                            {unit.total_objectives !== undefined
                              ? ` • ${unit.completed_objectives || 0}/${unit.total_objectives} objectives`
                              : subunits.length > 0
                                ? ` • ${subunits.filter(s => s.is_completed).length}/${subunits.length} subunits`
                                : ''}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={unit.description || ''}
                  />

                  {/* Expand/Collapse button for subunits (right side) */}
                  {subunits.length > 0 && (
                    <IconButton
                      edge="end"
                      onClick={() => toggleUnitSubunits(unitId)}
                      aria-label={openUnitSubunits[unitId] ? 'collapse' : 'expand'}
                      sx={{ ml: 1 }}
                    >
                      {openUnitSubunits[unitId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )}
                </ListItem>

                {/* Subunits for this unit */}
                {subunits.length > 0 && (
                  <Collapse in={!!openUnitSubunits[unitId]}>
                    <List dense sx={{ pl: 6 }}>
                      {subunits.map((s) => (
                        <ListItem key={s.id || s.name}>
                          <ListItemIcon>
                            {s.is_completed ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <UncheckedIcon color="disabled" fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={s.name || 'Subunit'}
                            secondary={
                              s.completion_percentage !== undefined
                                ? `Progress: ${s.completion_percentage}%`
                                : s.is_completed
                                  ? 'Completed'
                                  : ''
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ mt: 1 }} />
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      )}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">
            {detailData?.subject?.name || subject?.name} Details
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Teacher: {detailData?.subject?.teacher_name || 'Not assigned'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : detailData ? (
          <Box>
            {/* Class Information */}
            <Box mb={3}>
              <Box display="flex" alignItems="center" mb={1}>
                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Class: Grade {detailData.class?.grade ?? '—'}
                </Typography>
              </Box>
              <Chip
                label={`Grade ${detailData.class?.grade ?? '—'}`}
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Subject Progress */}
            <Box mb={4}>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Subject Progress: {detailData.subject?.completion_percentage ?? 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={detailData.subject?.completion_percentage ?? 0}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Completed: {detailData.subject?.completed_objectives ?? 0} /{' '}
                  {detailData.subject?.total_objectives ?? 0} objectives
                </Typography>
                <Chip
                  label={`${detailData.subject?.completion_percentage ?? 0}%`}
                  size="small"
                  color={detailData.subject?.completion_percentage > 50 ? 'success' : 'primary'}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Time Period Filter */}
            <Box mb={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6">
                  View Progress By Time Period
                </Typography>
                <Tooltip title="Filter units based on when they were last updated or completed">
                  <InfoIcon color="info" fontSize="small" />
                </Tooltip>
              </Box>
              <Tabs
                value={timeFilter}
                onChange={handleTimeFilterChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab
                  icon={<ScheduleIcon fontSize="small" />}
                  label="All Time"
                  value="all"
                />
                <Tab
                  icon={<TodayIcon fontSize="small" />}
                  label="Today"
                  value="daily"
                />
                <Tab
                  icon={<WeekIcon fontSize="small" />}
                  label="This Week"
                  value="weekly"
                />
                <Tab
                  icon={<SemesterIcon fontSize="small" />}
                  label="This Semester"
                  value="semester"
                />
              </Tabs>

              {/* Progress Stats Summary */}
              {progressStats && (
                <Paper elevation={2} sx={{ p: 2, mt: 2, bgcolor: 'background.paper' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {progressStats.completionRate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completion Rate
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={9}>
                      <Box display="flex" gap={2} justifyContent="space-around">
                        <Box textAlign="center">
                          <Typography variant="h6">{progressStats.total}</Typography>
                          <Typography variant="caption" color="text.secondary">Total Units</Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="h6" color="success.main">{progressStats.completed}</Typography>
                          <Typography variant="caption" color="text.secondary">Completed</Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="h6" color="warning.main">{progressStats.inProgress}</Typography>
                          <Typography variant="caption" color="text.secondary">In Progress</Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="h6" color="text.secondary">{progressStats.upcoming}</Typography>
                          <Typography variant="caption" color="text.secondary">Upcoming</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Unit Progress Summary */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Unit Progress Summary
              </Typography>
              <Grid container spacing={2}>
                {renderCard('Total Units', progressStats?.total ?? detailData.summary?.total_units, 'primary', 'total')}
                {renderCard('Completed', progressStats?.completed ?? detailData.summary?.completed_units, 'success.main', 'completed')}
                {renderCard('In Progress', progressStats?.inProgress ?? detailData.summary?.current_units, 'warning.main', 'current')}
                {renderCard('Upcoming', progressStats?.upcoming ?? detailData.summary?.upcoming_units, 'text.secondary', 'upcoming')}
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Current Units */}
            {renderUnitList(
              filterUnitsByTime(detailData.current_units) || [],
              `Current Units (${filterUnitsByTime(detailData.current_units)?.length || 0})`,
              'No units currently in progress',
              true // mark this as the current list
            )}

            {/* Upcoming Units */}
            {renderUnitList(
              filterUnitsByTime(detailData.upcoming_units) || [],
              `Upcoming Units (${filterUnitsByTime(detailData.upcoming_units)?.length || 0})`,
              'No upcoming units scheduled'
            )}

            {/* Past Units */}
            {renderUnitList(
              filterUnitsByTime(detailData.past_units) || [],
              `Completed Units (${filterUnitsByTime(detailData.past_units)?.length || 0})`,
              'No units completed yet'
            )}

            {/* Progress Calculation Explanation */}
            <Paper elevation={1} sx={{ mt: 3, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <InfoIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle2" fontWeight="bold">
                  How Progress is Calculated
                </Typography>
              </Box>
              <Typography variant="body2">
                • <strong>Completed Units:</strong> Units where all subunits are marked complete by the teacher
                <br />
                • <strong>In Progress:</strong> Units currently being taught (marked as "current" by teacher)
                <br />
                • <strong>Upcoming:</strong> Units not yet started
                <br />
                • <strong>Completion %:</strong> Based on completed subunits / total subunits
                <br />
                • Checked boxes (✓) indicate completed subunits
              </Typography>
            </Paper>

            {/* Overall Completion */}
            <Box mt={3} p={2} bgcolor="action.hover" borderRadius={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">Overall Course Completion</Typography>
                <Chip
                  label={`${progressStats?.completionRate ?? detailData.summary?.overall_completion ?? 0}%`}
                  color={(progressStats?.completionRate ?? detailData.summary?.overall_completion ?? 0) === 100 ? 'success' : 'primary'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressStats?.completionRate ?? detailData.summary?.overall_completion ?? 0}
                sx={{ height: 8, borderRadius: 4, mt: 1 }}
              />
              {timeFilter !== 'all' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Filtered view: {timeFilter === 'daily' ? 'Today' : timeFilter === 'weekly' ? 'This Week' : 'This Semester'}
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Box textAlign="center" py={4}>
            <ScheduleIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No subject data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a subject to view details
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
