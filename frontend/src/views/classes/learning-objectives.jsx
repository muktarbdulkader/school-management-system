import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
  Paper,
  Grid,
  Avatar,
  Container,
  useTheme,
  alpha,
  Collapse,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useLocation } from 'react-router-dom';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { object } from 'prop-types';
import { toast, ToastContainer } from 'react-toastify';
import UnitsList from './UnitsList';

function groupObjectives(objectives = []) {
  const unitsMap = new Map();

  objectives.forEach((item) => {
    const obj = item.objective || {};
    const unit = obj.unit_details || {
      id: '__no_unit__',
      name: 'No Unit',
      order: 0,
    };
    const unitKey = unit.id;

    if (!unitsMap.has(unitKey)) {
      unitsMap.set(unitKey, {
        id: unit.id,
        name: unit.name || 'No Unit',
        order: unit.order ?? 0,
        start_date: unit.start_date,
        end_date: unit.end_date,
        subunits: new Map(),
      });
    }

    const unitEntry = unitsMap.get(unitKey);

    // If no subunits provided, treat it as a single "No subunit" bucket
    const subRels =
      obj.subunit_relationships && obj.subunit_relationships.length
        ? obj.subunit_relationships
        : [
            {
              subunit_details: {
                id: `__no_sub_${obj.id}`,
                name: '— No subunit —',
                order: 0,
              },
              order: 0,
            },
          ];

    subRels.forEach((subRel) => {
      const sub = subRel.subunit_details || {
        id: `__no_sub_${obj.id}`,
        name: '— No subunit —',
        order: 0,
      };
      const subKey = sub.id ?? `__no_sub_${unitKey}`;

      if (!unitEntry.subunits.has(subKey)) {
        unitEntry.subunits.set(subKey, {
          id: sub.id,
          name: sub.name || '— No subunit —',
          order: sub.order ?? 0,
          objectives: [],
        });
      }

      const subEntry = unitEntry.subunits.get(subKey);

      subEntry.objectives.push({
        id: obj.id,
        description: obj.description,
        framework_code: obj.framework_code,
        success_criteria: obj.success_criteria,
        // Use the top-level is_completed (or fall back to class_progress.is_completed)
        is_completed:
          item.is_completed ?? item.class_progress?.is_completed ?? false,
        class_progress: item.class_progress ?? null,
        raw: item, // keep original if you need it
      });
    });
  });

  // Convert maps to arrays and sort by order
  const units = Array.from(unitsMap.values())
    .map((u) => ({
      ...u,
      subunits: Array.from(u.subunits.values()).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return units;
}

const LearningObjectives = () => {
  const location = useLocation();
  const { classData, objectives, class_id, section_id } = location.state || {};
  const theme = useTheme();
  const [expandedObjectives, setExpandedObjectives] = React.useState({});
  const [objectivesState, setObjectives] = React.useState(objectives || []);
  const [data, setData] = React.useState({});
  console.log('Location state:', location.state);
  if (!classData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info" sx={{ borderRadius: 2, boxShadow: 1 }}>
          No class data available. Please go back and select a class.
        </Alert>
      </Container>
    );
  }

  const grouped = useMemo(
    () => groupObjectives(objectivesState),
    [objectivesState],
  );
  console.log('Grouped Objectives:', grouped);
  // Expand state
  const [expandedUnits, setExpandedUnits] = useState({});
  const [expandedSubunits, setExpandedSubunits] = useState({});

  const toggleUnit = (unitId) =>
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));

  const toggleSubunit = (subId) =>
    setExpandedSubunits((prev) => ({ ...prev, [subId]: !prev[subId] }));

  // Toggle objective completion: update original objectivesState so formatter will reflect it
  const handleToggleObjectiveCompletion = (objectiveId) => {
    // setObjectivesState((prev) =>
    //   prev.map((item) =>
    //     item.objective?.id === objectiveId
    //       ? { ...item, is_completed: !item.is_completed }
    //       : item,
    //   ),
    // );
    console.log('Toggling objective:', objectiveId);
  };

  useEffect(() => {
    const fetchClassData = async () => {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.teachersClassUnits}${class_id}/${section_id}/${objectives[0]?.objective?.unit_details?.category_details?.subject_details?.id}/`;

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      try {
        const response = await fetch(Api, {
          method: 'GET',
          headers: header,
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to fetch class data');
        }

        setData(responseData.data || {});
        console.log('Fetched class data:', responseData);
      } catch (error) {
        console.error('Error fetching class data:', error);
      }
    };

    fetchClassData();
  }, [class_id, section_id]);

  const formattedObjectives =
    objectivesState?.map((item) => ({
      id: item.objective?.id,
      description: item.objective?.description,
      framework_code: item.objective?.framework_code,
      success_criteria: item.objective?.success_criteria,
      unit_details: item.objective?.unit_details,
      subunit_relationships: item.objective?.subunit_relationships || [],
      is_completed: item.is_completed,
      class_progress: item.class_progress,
    })) || [];

  console.log('Formatted Objectives:', formattedObjectives);

  const handleToggleExpand = (objectiveId) => {
    setExpandedObjectives((prev) => ({
      ...prev,
      [objectiveId]: !prev[objectiveId],
    }));
  };

  const handleToggleCompletion = async (objectiveId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.learningObjectives}/${objectiveId}/toggle_completion/${class_id}/${section_id}/`;

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
        throw new Error(responseData.message || 'Failed to update objective');
      }

      if (responseData.success) {
        toast.success('Objective updated successfully');

        // Optimistically update UI
        setObjectives((prev) =>
          prev.map((item) =>
            item.objective.id === objectiveId
              ? { ...item, is_completed: !item.is_completed }
              : item,
          ),
        );
      } else {
        toast.error(responseData.message);
        console.error('Error response:', responseData);
      }
    } catch (error) {
      toast.error(error.message);
      console.error('Error details:', error);
    }
  };

  // Toggle a single subunit; if all subunits become completed, mark the unit complete too
  const handleToggleSubunitCompletion = (objectiveId, subunitId) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id !== objectiveId) return obj;
        const subs = (obj.subunit_relationships || []).map((s) =>
          s.id === subunitId ? { ...s, is_completed: !s.is_completed } : s,
        );
        const allSubCompleted =
          subs.length > 0 && subs.every((s) => s.is_completed);
        return {
          ...obj,
          subunit_relationships: subs,
          is_completed: allSubCompleted,
        };
      }),
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: 3,
          p: 4,
          mb: 4,
          textAlign: 'center',
        }}
      >
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.light,
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 2,
          }}
        >
          <SchoolIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Learning Objectives
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, color: 'white' }}>
          Grade {classData?.grade} • {classData?.branch_details?.name}
        </Typography>
      </Paper>

      {/* Learning Objectives Section - Bottom */}
      <Card elevation={3} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.light} 100%)`,
              color: 'white',
              p: 3,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: alpha('#fff', 0.2), mr: 2 }}>
                <AssignmentIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="white">
                  Learning Objectives
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }} color="white">
                  {formattedObjectives.length} objectives defined for this class
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            {grouped.length > 0 ? (
              <List sx={{ py: 0 }}>
                {grouped.map((unit) => {
                  const unitExpanded = !!expandedUnits[unit.id];
                  // compute unit completion for UI
                  const unitObjectives = unit.subunits.flatMap(
                    (s) => s.objectives,
                  );
                  const unitAllCompleted =
                    unitObjectives.length &&
                    unitObjectives.every((o) => o.is_completed);
                  return (
                    <React.Fragment key={unit.id || unit.name}>
                      {/* Unit Row */}
                      <ListItem
                        sx={{
                          px: { xs: 1.5, sm: 2 },
                          py: { xs: 1, sm: 1.5 },
                          mb: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          boxShadow: unitExpanded ? 2 : 0,
                          transition: 'all 0.25s ease-in-out',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          '&:hover': {
                            borderColor: 'primary.light',
                            boxShadow: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
                        }}
                        onClick={() => toggleUnit(unit.id)}
                        button
                      >
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                mb: { xs: 1, sm: 0 },
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                fontWeight={600}
                                sx={{
                                  mr: 1,
                                  fontSize: { xs: '0.92rem', sm: '1rem' },
                                  wordBreak: 'break-word',
                                }}
                              >
                                {unit.name}
                              </Typography>

                              {/* Unit meta chip (order or date range) */}
                              <Chip
                                label={`Order ${unit.order ?? '-'}`}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                              {unit.start_date && unit.end_date && (
                                <Chip
                                  label={`${unit.start_date} → ${unit.end_date}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          }
                        />

                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'row', sm: 'row' },
                            gap: 1,
                            mt: { xs: 1, sm: 0 },
                            width: { xs: '100%', sm: 'auto' },
                            justifyContent: {
                              xs: 'space-between',
                              sm: 'flex-end',
                            },
                          }}
                          onClick={(e) => e.stopPropagation()} // stop propagation for inner controls
                        >
                          <IconButton
                            size="small"
                            edge="end"
                            sx={{
                              ml: { sm: 1 },
                              alignSelf: { xs: 'center', sm: 'auto' },
                            }}
                            onClick={() => toggleUnit(unit.id)}
                          >
                            {unitExpanded ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </Box>
                      </ListItem>

                      {/* Unit expanded -> Subunits */}
                      <Collapse in={unitExpanded} timeout="auto" unmountOnExit>
                        <Box
                          sx={{
                            mt: -1.5,
                            mb: 1.5,
                            mx: 1,
                            px: 3,
                            py: 2,
                            borderLeft: `3px solid ${theme.palette.primary.light}`,
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                            borderRadius: '0 0 8px 8px',
                          }}
                        >
                          {unit.subunits.map((sub) => {
                            const subExpanded = !!expandedSubunits[sub.id];
                            const subAllCompleted =
                              sub.objectives.length &&
                              sub.objectives.every((o) => o.is_completed);

                            return (
                              <Box key={`${unit.id}-${sub.id}`} sx={{ mb: 2 }}>
                                <ListItem
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1.5,
                                    alignItems: 'center',
                                    '&:hover': {
                                      borderColor: 'primary.light',
                                      bgcolor: alpha(
                                        theme.palette.primary.main,
                                        0.01,
                                      ),
                                    },
                                  }}
                                  onClick={() => toggleSubunit(sub.id)}
                                  button
                                >
                                  <ListItemText
                                    primary={
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <Typography
                                          variant="body1"
                                          fontWeight={600}
                                        >
                                          {sub.name}
                                        </Typography>
                                        <Chip
                                          label={`Order ${sub.order ?? '-'}`}
                                          size="small"
                                          variant="outlined"
                                        />
                                        {/* show how many objectives */}
                                        <Chip
                                          label={`${sub.objectives.length} objective${sub.objectives.length === 1 ? '' : 's'}`}
                                          size="small"
                                        />
                                      </Box>
                                    }
                                    secondary={
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Subunit
                                      </Typography>
                                    }
                                  />

                                  <Box
                                    sx={{ display: 'flex', gap: 1 }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <IconButton
                                      size="small"
                                      onClick={() => toggleSubunit(sub.id)}
                                    >
                                      {subExpanded ? (
                                        <ExpandLessIcon />
                                      ) : (
                                        <ExpandMoreIcon />
                                      )}
                                    </IconButton>
                                  </Box>
                                </ListItem>

                                {/* Subunit expanded -> Objectives */}
                                <Collapse
                                  in={subExpanded}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <List dense sx={{ mt: 1 }}>
                                    {sub.objectives.map((obj) => (
                                      <ListItem
                                        key={`${sub.id}-${obj.id}`}
                                        sx={{
                                          px: 2,
                                          py: 1,
                                          borderBottom: '1px dashed',
                                          borderColor: 'divider',
                                          alignItems: 'flex-start',
                                          display: 'flex',
                                          gap: 1,
                                        }}
                                      >
                                        <Box sx={{ flex: 1 }}>
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 1,
                                              flexWrap: 'wrap',
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              fontWeight={600}
                                              sx={{ wordBreak: 'break-word' }}
                                            >
                                              {obj.description || 'Objective'}
                                            </Typography>

                                            {/* objective framework chip */}
                                            {obj.framework_code && (
                                              <Chip
                                                label={obj.framework_code}
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 0.5 }}
                                              />
                                            )}

                                            {/* completion chip */}
                                            <Chip
                                              label={
                                                obj.is_completed
                                                  ? 'Completed'
                                                  : 'Pending'
                                              }
                                              size="small"
                                              variant={
                                                obj.is_completed
                                                  ? 'filled'
                                                  : 'outlined'
                                              }
                                              color={
                                                obj.is_completed
                                                  ? 'success'
                                                  : 'default'
                                              }
                                              sx={{ ml: 1 }}
                                            />
                                          </Box>

                                          {/* hidden details: description + success criteria */}
                                          <Typography
                                            variant="body2"
                                            color="black"
                                          
                                            sx={{ my: 0.5 }}
                                          >
                                            {obj.description ||
                                              'No description available.'}
                                          </Typography>
                                          {obj.success_criteria && (
                                            <Typography
                                              variant="h5"
                                              color="black"
                                              sx={{
                                                fontStyle: 'italic',
                                                display: 'block',
                                                
                                              }}
                                            >
                                              <strong>Success Criteria:</strong>{' '}
                                              {obj.success_criteria}
                                            </Typography>
                                          )}
                                        </Box>

                                        <Box
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1,
                                          }}
                                        ></Box>
                                      </ListItem>
                                    ))}
                                  </List>
                                </Collapse>
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                    </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <Box textAlign="center" py={6} sx={{ opacity: 0.5 }}>
                <AssignmentIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No learning objectives available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Learning objectives will be added soon.
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
      {/*  */}
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          mb: 4,
          mt: 4,
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box
            display="flex"
            alignItems="center"
            mb={1}
            sx={{
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.light} 100%)`,
              color: 'white',
              p: 3,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            <Avatar sx={{ bgcolor: theme.palette.primary.box, mr: 2 }}>
              <SchoolIcon />
            </Avatar>
            <Typography variant="h5" fontWeight="bold" color="white">
              Class Units
            </Typography>
          </Box>
          <Box sx={{ px: 3, pt: 0, pb: 3 }}>
            <UnitsList
              title="Completed"
              data={data.past_units}
              classId={data?.class?.id}
              sectionId={data?.section?.id}
            />
            <UnitsList
              title="Current"
              data={data.current_units}
              classId={data?.class?.id}
              sectionId={data?.section?.id}
            />
            <UnitsList
              title="Upcoming"
              data={data.upcoming_units}
              classId={data?.class?.id}
              sectionId={data?.section?.id}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Class Details Section - Top */}
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          mb: 4,
          mt: 4,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
              <SchoolIcon />
            </Avatar>
            <Typography variant="h5" fontWeight="bold">
              Class Details
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Chip
                  label={`Grade ${classData?.grade}`}
                  color="primary"
                  variant="filled"
                  sx={{ mb: 2, fontSize: '1.1rem', padding: '8px 16px' }}
                />
                <Chip
                  label={
                    classData?.branch_details?.is_main
                      ? 'Main Branch'
                      : 'Branch'
                  }
                  color={
                    classData?.branch_details?.is_main ? 'success' : 'primary'
                  }
                  variant="outlined"
                  sx={{ ml: 1, mb: 2 }}
                />
              </Box>

              <Box sx={{ space: 2 }}>
                <Box display="flex" alignItems="flex-start" mb={3}>
                  <LocationOnIcon color="action" sx={{ mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Address
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {classData?.branch_details?.address || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" mb={3}>
                  <PhoneIcon color="action" sx={{ mr: 2 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Phone
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {classData?.branch_details?.phone || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center">
                  <EmailIcon color="action" sx={{ mr: 2 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Email
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {classData?.branch_details?.email || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              {/* Additional class information can go here if needed */}
              <Box
                sx={{
                  background: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2,
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" color="primary" gutterBottom>
                  Class Summary
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  This class has {formattedObjectives.length} learning
                  objectives defined for the current curriculum.
                </Typography>
                {formattedObjectives.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`${formattedObjectives.filter((obj) => obj.is_completed).length} Completed`}
                      color="success"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${formattedObjectives.filter((obj) => !obj.is_completed).length} In Progress`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <ToastContainer />
    </Container>
  );
};

export default LearningObjectives;
