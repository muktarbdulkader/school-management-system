import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Grid,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Container,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  PlayCircle,
  Schedule,
  TrendingUp,
  Numbers,
  ExpandMore,
  ExpandLess,
  SwapHoriz,
  DoneAll,
  Undo,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast, ToastContainer } from 'react-toastify';

const TeachersClassUnits = () => {
  const location = useLocation();
  const [classData, setClassData] = useState(location.state?.classData || {});
  const [expandedUnits, setExpandedUnits] = useState({});
  const [loadingUnits, setLoadingUnits] = useState({});
  const [loadingSubUnits, setLoadingSubUnits] = useState({});

  const toggleUnitExpansion = (unitId) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const fetchUpdatedClassData = async () => {
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.teachersClassUnits}${classData.class?.id}/${classData.section?.id}/${classData.subject?.id}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setClassData(responseData.data);
      } else {
        toast.error(responseData.message || 'Failed to refresh data');
      }
    } catch (error) {
      toast.error(error.message || 'Error fetching updated data');
    }
  };

  const StatusChip = ({ status, count }) => {
    const getChipProps = () => {
      switch (status) {
        case 'completed':
          return { color: 'success', icon: <CheckCircle /> };
        case 'current':
          return { color: 'primary', icon: <PlayCircle /> };
        case 'upcoming':
          return { color: 'warning', icon: <Schedule /> };
        default:
          return { color: 'default', icon: <Schedule /> };
      }
    };

    const chipProps = getChipProps();

    return (
      <Chip
        icon={chipProps.icon}
        label={`${count} ${status}`}
        color={chipProps.color}
        variant="outlined"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const ProgressCard = ({ summary }) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <TrendingUp sx={{ mr: 1 }} />
          Progress Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {summary.total_units}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Units
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {summary.completed_units}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {summary.current_units}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {summary.upcoming_units}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Overall Completion</Typography>
            <Typography variant="body2" fontWeight="bold">
              {summary.overall_completion}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={summary.overall_completion}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  const SubunitTable = ({ subunits }) => (
    <TableContainer component={Paper} sx={{ mt: 2, mb: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align="center">Order</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="center">Objectives</TableCell>
            <TableCell align="center">Completion</TableCell>
            <TableCell align="center">Action</TableCell> {/* 👈 New Column */}
          </TableRow>
        </TableHead>
        <TableBody>
          {subunits.map((subunit) => (
            <TableRow key={subunit.id}>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {subunit.name}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip label={subunit.order} size="small" variant="outlined" />
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={subunit.is_completed ? 'Completed' : 'In Progress'}
                  color={subunit.is_completed ? 'success' : 'warning'}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2">
                  {subunit.completed_objectives}/{subunit.total_objectives}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={subunit.completion_percentage}
                    sx={{ width: '60px', height: 6, borderRadius: 3 }}
                    color={
                      subunit.completion_percentage === 100
                        ? 'success'
                        : subunit.completion_percentage > 50
                          ? 'primary'
                          : 'warning'
                    }
                  />
                  <Typography variant="body2" sx={{ minWidth: 35 }}>
                    {subunit.completion_percentage}%
                  </Typography>
                </Box>
              </TableCell>

              {/* 👇 Action button for toggle */}
              <TableCell align="center">
                <Button
                  variant={subunit.is_completed ? 'outlined' : 'contained'}
                  size="small"
                  startIcon={
                    loadingSubUnits[subunit.id] ? (
                      <CircularProgress size={16} />
                    ) : subunit.is_completed ? (
                      <Undo />
                    ) : (
                      <DoneAll />
                    )
                  }
                  onClick={() =>
                    handleToggleCompleteSubUnit(
                      subunit.id,
                      subunit.is_completed,
                    )
                  }
                  disabled={loadingSubUnits[subunit.id]}
                  color={subunit.is_completed ? 'primary' : 'success'}
                  sx={{ textTransform: 'none' }}
                >
                  {loadingSubUnits[subunit.id]
                    ? 'Updating...'
                    : subunit.is_completed
                      ? 'Mark Incomplete'
                      : 'Mark Completed'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Function to toggle is_current status
  const handleToggleCurrentUnit = async (unitId, currentStatus) => {
    setLoadingUnits((prev) => ({ ...prev, [unitId]: true }));

    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.teachersSetCurrentUnit}${classData.class?.id}/${classData.section?.id}/${unitId}/`;

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const responseData = await response.json();

      if (!response.ok)
        throw new Error(responseData.message || 'Failed to update unit status');

      if (responseData.success) {
        toast.success(
          `Unit ${currentStatus ? 'removed from' : 'set as'} current successfully`,
        );
        await fetchUpdatedClassData(); // 👈 refresh data here
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message || 'Error updating unit status');
    } finally {
      setLoadingUnits((prev) => ({ ...prev, [unitId]: false }));
    }
  };

  // Function to toggle is_completed status
  const handleToggleCompleteUnit = async (unitId, currentStatus) => {
    setLoadingUnits((prev) => ({ ...prev, [unitId]: true }));

    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.teachersMarkUnitCompleted}${classData.class?.id}/${classData.section?.id}/${unitId}/`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to update unit completion status',
        );
      }

      if (responseData.success) {
        toast.success(
          `Unit ${currentStatus ? 'marked as incomplete' : 'marked as completed'} successfully`,
        );
        await fetchUpdatedClassData();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message || 'Error updating unit completion status');
    } finally {
      setLoadingUnits((prev) => ({ ...prev, [unitId]: false }));
    }
  };

  const handleToggleCompleteSubUnit = async (subunitId, currentStatus) => {
    setLoadingSubUnits((prev) => ({ ...prev, [subunitId]: true }));

    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.teachersMarkSubunitCompleted}${classData.class?.id}/${classData.section?.id}/${subunitId}/`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to update unit completion status',
        );
      }

      if (responseData.success) {
        toast.success(
          `Unit ${currentStatus ? 'marked as incomplete' : 'marked as completed'} successfully`,
        );
        await fetchUpdatedClassData();
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message || 'Error updating unit completion status');
    } finally {
      setLoadingSubUnits((prev) => ({ ...prev, [subunitId]: false }));
    }
  };

  const UnitCard = ({ unit, status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed':
          return 'success.main';
        case 'current':
          return 'primary.main';
        case 'upcoming':
          return 'warning.main';
        default:
          return 'text.secondary';
      }
    };

    const hasSubunits = unit.subunits && unit.subunits.length > 0;
    const isExpanded = expandedUnits[unit.id];
    const isLoading = loadingUnits[unit.id];
    const isSubLoading = loadingSubUnits[unit.subunits.id];

    return (
      <Card
        sx={{
          mb: 2,
          borderLeft: `4px solid`,
          borderColor: getStatusColor(),
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {unit.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Order: {unit.order} • Category: {unit.category}
              </Typography>
              {unit.start_date && (
                <Typography variant="body2" color="text.secondary">
                  Start Date: {new Date(unit.start_date).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={status.replace('_', ' ')}
                size="small"
                color={
                  status === 'completed'
                    ? 'success'
                    : status === 'current'
                      ? 'primary'
                      : 'warning'
                }
              />
              {hasSubunits && (
                <IconButton
                  size="small"
                  onClick={() => toggleUnitExpansion(unit.id)}
                  sx={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <ExpandMore />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {/* Toggle Current Button - Only show for upcoming units */}
            {status === 'upcoming' && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                    isLoading ? <CircularProgress size={16} /> : <SwapHoriz />
                  }
                  onClick={() =>
                    handleToggleCurrentUnit(unit.id, unit.is_current)
                  }
                  disabled={isLoading}
                  color={unit.is_current ? 'secondary' : 'primary'}
                  sx={{ textTransform: 'none' }}
                >
                  {isLoading
                    ? 'Updating...'
                    : unit.is_current
                      ? 'Remove Current'
                      : 'Set as Current'}
                </Button>

                {/* Mark Complete Button - Also show for upcoming units */}
                <Button
                  variant="contained"
                  size="small"
                  startIcon={
                    isLoading ? <CircularProgress size={16} /> : <DoneAll />
                  }
                  onClick={() =>
                    handleToggleCompleteUnit(unit.id, false)
                  }
                  disabled={isLoading}
                  color="success"
                  sx={{ textTransform: 'none' }}
                >
                  {isLoading ? 'Updating...' : 'Mark as Completed'}
                </Button>
              </>
            )}

            {/* Toggle Complete Button - Only show for current units */}
            {status === 'current' && (
              <Button
                variant={unit.is_completed ? 'outlined' : 'contained'}
                size="small"
                startIcon={
                  isLoading ? (
                    <CircularProgress size={16} />
                  ) : unit.is_completed ? (
                    <Undo />
                  ) : (
                    <DoneAll />
                  )
                }
                onClick={() =>
                  handleToggleCompleteUnit(unit.id, unit.is_completed)
                }
                disabled={isLoading}
                color={unit.is_completed ? 'secondary' : 'success'}
                sx={{ textTransform: 'none' }}
              >
                {isLoading
                  ? 'Updating...'
                  : unit.is_completed
                    ? 'Mark as Incomplete'
                    : 'Mark as Completed'}
              </Button>
            )}

            {/* Reopen Button - Only show for completed units */}
            {status === 'completed' && (
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  isLoading ? <CircularProgress size={16} /> : <Undo />
                }
                onClick={() =>
                  handleToggleCompleteUnit(unit.id, unit.is_completed)
                }
                disabled={isLoading}
                color="secondary"
                sx={{ textTransform: 'none' }}
              >
                {isLoading ? 'Updating...' : 'Reopen Unit'}
              </Button>
            )}
          </Box>

          {/* Unit Progress */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2">Unit Progress</Typography>
              <Typography variant="body2" fontWeight="bold">
                {unit.completion_percentage || 0}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={unit.completion_percentage || 0}
              sx={{ height: 8, borderRadius: 4 }}
              color={
                unit.completion_percentage === 100
                  ? 'success'
                  : unit.completion_percentage > 50
                    ? 'primary'
                    : 'warning'
              }
            />
            <Typography variant="caption" color="text.secondary">
              {unit.completed_objectives || 0}/{unit.total_objectives || 0}{' '}
              objectives completed
            </Typography>
          </Box>

          {/* Subunits Section */}
          {hasSubunits && (
            <Collapse in={isExpanded}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Subunits ({unit.subunits.length})
              </Typography>
              <SubunitTable subunits={unit.subunits} />
            </Collapse>
          )}

          {unit.description && (
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              {unit.description}
            </Typography>
          )}

          {unit.objectives && unit.objectives.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Learning Objectives:
              </Typography>
              <List dense>
                {unit.objectives.map((objective, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <Numbers fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={objective} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Class Units - {classData.subject?.name}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Grade {classData.class?.grade} - Section {classData.section?.name}
          {classData.section?.room_number &&
            ` • Room ${classData.section.room_number}`}
        </Typography>
      </Box>

      {/* Progress Summary */}
      {classData.summary && <ProgressCard summary={classData.summary} />}

      {/* Status Overview */}
      {classData.summary && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <StatusChip
            status="completed"
            count={classData.summary.completed_units}
          />
          <StatusChip
            status="current"
            count={classData.summary.current_units}
          />
          <StatusChip
            status="upcoming"
            count={classData.summary.upcoming_units}
          />
        </Box>
      )}

      {/* Current Units Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}
        >
          <PlayCircle sx={{ mr: 1 }} />
          Current Units ({classData.current_units?.length || 0})
        </Typography>
        <Divider sx={{ mb: 3 }} />
        {classData.current_units?.length > 0 ? (
          classData.current_units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} status="current" />
          ))
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No current units</Typography>
          </Paper>
        )}
      </Box>

      {/* Upcoming Units Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}
        >
          <Schedule sx={{ mr: 1 }} />
          Upcoming Units ({classData.upcoming_units?.length || 0})
        </Typography>
        <Divider sx={{ mb: 3 }} />
        {classData.upcoming_units?.length > 0 ? (
          classData.upcoming_units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} status="upcoming" />
          ))
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No upcoming units</Typography>
          </Paper>
        )}
      </Box>

      {/* Completed Units Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}
        >
          <CheckCircle sx={{ mr: 1 }} />
          Completed Units ({classData.past_units?.length || 0})
        </Typography>
        <Divider sx={{ mb: 3 }} />
        {classData.past_units?.length > 0 ? (
          classData.past_units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} status="completed" />
          ))
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No completed units</Typography>
          </Paper>
        )}
      </Box>
      <ToastContainer />
    </Container>
  );
};

export default TeachersClassUnits;
