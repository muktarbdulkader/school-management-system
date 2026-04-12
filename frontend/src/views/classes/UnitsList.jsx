import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Collapse,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';

const UnitsList = ({ title, data, classId, sectionId }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState({});

  const handleToggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCompleteSubunit = async (subunit) => {
    console.log(
      'Marking subunit as complete:',
      subunit,
      'classId:',
      classId,
      'sectionId:',
      sectionId,
    );
    if (!classId || !sectionId) {
      toast.error('Class ID or Section ID is missing.');
      return;
    }
    const token = await GetToken();
    const API = `${Backend.auth}${Backend.teachersMarkSubunitCompleted}${classId}/${sectionId}/${subunit.id}/`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };
    try {
      const response = await fetch(API, { method: 'POST', headers: header });
      if (response.ok) {
        toast.success(`Subunit ${subunit.name} marked as complete`);
        // refresh the page to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(`Failed to mark subunit ${subunit.name} as complete`);
      }
    } catch (error) {
      toast.error(`Error marking subunit ${subunit.name} as complete`);
      console.error('Error marking subunit as complete:', error);
    }
  };

  const handleSetCurrentUnit = async (unit) => {
    setLoading(true);
    const API = `${Backend.auth}${Backend.teachersSetCurrentUnit}${classId}/${sectionId}/${unit.id}/`;
    const token = await GetToken();
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };
    try {
      const response = await fetch(API, { method: 'POST', headers: header });
      const responseData = await response.json();
      if (responseData.success) {
        toast.success(responseData.message);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrentSubUnit = async (subUnit) => {
    setLoading(true);
    const API = `${Backend.auth}${Backend.teachersSetCurrentUnit}${classId}/${sectionId}/${subUnit.id}/`;
    const token = await GetToken();
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };
    try {
      const response = await fetch(API, { method: 'POST', headers: header });
      const responseData = await response.json();
      if (responseData.success) {
        toast.success(responseData.message);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
        {title}
      </Typography>

      {data && data.length > 0 ? (
        <List sx={{ py: 0 }}>
          {data.map((unit) => {
            const hasSubunits =
              (unit.subunits && unit.subunits.length > 0) ||
              (unit.objectives_without_subunit &&
                unit.objectives_without_subunit.length > 0);
            const isExpanded = expanded[unit.id];

            return (
              <React.Fragment key={unit.id}>
                {/* Collapsed Row */}
                <ListItem
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1, sm: 1.5 },
                    mb: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    boxShadow: isExpanded ? 2 : 0,
                    transition: 'all 0.25s ease-in-out',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    '&:hover': {
                      borderColor: 'primary.light',
                      boxShadow: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                  onClick={() => handleToggleExpand(unit.id)}
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
                          fontWeight="600"
                          sx={{
                            mr: 1,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            wordBreak: 'break-word',
                          }}
                        >
                          {unit.name}
                        </Typography>
                        <Chip
                          label={`Order: ${unit.order}`}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={unit.category}
                  />

                  {/* Actions */}
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
                  >
                    <Tooltip
                      title={
                        unit.is_completed
                          ? 'Grade this unit'
                          : 'Mark unit complete'
                      }
                    >
                      {title === 'Current' && (
                        <Button
                          size="small"
                          variant={unit.is_completed ? 'contained' : 'outlined'}
                          color={unit.is_completed ? 'info' : 'success'}
                          disabled={unit.is_completed}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (unit.is_completed) {
                              alert(`Grade ${unit.name}`); // Placeholder
                            } else {
                              alert(`Mark ${unit.name} as complete`); // Placeholder
                            }
                          }}
                          sx={{ flex: { xs: 1, sm: 'none' } }}
                        >
                          {unit.is_completed ? 'Grade' : 'Mark Complete'}
                        </Button>
                      )}
                      {title === 'Upcoming' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCurrentUnit(unit);
                          }}
                          sx={{ flex: { xs: 1, sm: 'none' } }}
                        >
                          Set as Current Unit
                        </Button>
                      )}
                    </Tooltip>

                    {hasSubunits && (
                      <IconButton
                        size="small"
                        edge="end"
                        sx={{ ml: { sm: 1 } }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    )}
                  </Box>
                </ListItem>

                {/* Expanded Details */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
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
                    {/* Subunits */}
                    {unit.subunits?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="primary"
                          sx={{ mb: 1 }}
                        >
                          Subunits
                        </Typography>
                        <List dense sx={{ pl: 1 }}>
                          {unit.subunits.map((sub) => (
                            <ListItem
                              key={sub.id}
                              sx={{
                                pl: 2,
                                py: 1,
                                borderBottom: '1px dashed',
                                borderColor: 'divider',
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" fontWeight="500">
                                    {sub.name}
                                  </Typography>
                                }
                                secondary={`Order: ${sub.order}`}
                              />
                              {title === 'Current' && (
                                <Button
                                  size="small"
                                  variant={
                                    !sub.is_completed ? 'contained' : 'outlined'
                                  }
                                  color={!sub.is_completed ? 'info' : 'success'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (sub.is_completed) {
                                    } else {
                                      handleCompleteSubunit(sub);
                                    }
                                  }}
                                >
                                  {sub.is_completed
                                    ? 'Completed'
                                    : 'Mark Complete'}
                                </Button>
                              )}
                              {title === 'Upcoming' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetCurrentSubUnit(sub);
                                  }}
                                  sx={{ flex: { xs: 1, sm: 'none' } }}
                                >
                                  Set as Current
                                </Button>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* Objectives without subunit */}
                    {unit.objectives_without_subunit?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="secondary"
                          sx={{ mb: 1 }}
                        >
                          Objectives
                        </Typography>
                        <List dense sx={{ pl: 1 }}>
                          {unit.objectives_without_subunit.map((obj) => (
                            <ListItem
                              key={obj.id}
                              sx={{
                                pl: 2,
                                py: 1,
                                borderBottom: '1px dashed',
                                borderColor: 'divider',
                              }}
                            >
                              <ListItemText
                                primary={obj.description}
                                secondary={
                                  obj.is_completed ? 'Completed' : 'Pending'
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
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
            No {title.toLowerCase()} units
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title} units will be available soon.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UnitsList;
