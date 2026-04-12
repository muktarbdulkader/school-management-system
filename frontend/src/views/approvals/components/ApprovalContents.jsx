import React, { useState } from 'react';
import { Collapse, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { gridSpacing } from 'store/constant';
import PropTypes from 'prop-types';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import PlanCard from 'views/planning/components/PlanCard';
import Fallbacks from 'utils/components/Fallbacks';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

const ApprovalContents = ({ loading, error, data, level, status, handleUpdating, handleDeletePlan }) => {
  const theme = useTheme();

  const [selectedPerspective, setSelectedPerspective] = useState(0);

  const handlePerspectiveCollapsing = (index) => {
    if (selectedPerspective === index) {
      setSelectedPerspective(null);
    } else {
      setSelectedPerspective(index);
    }
  };

  const groupedPlans = [];

  data.forEach((plan) => {
    const perspectiveType = plan?.kpi?.perspective_type?.name;

    if (perspectiveType) {
      if (!groupedPlans[perspectiveType]) {
        groupedPlans[perspectiveType] = [];
      }
      groupedPlans[perspectiveType].push(plan);
    }
  });

  return (
    <React.Fragment>
      {loading ? (
        <Grid container sx={{ minHeight: 400 }}>
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
            <ActivityIndicator size={20} />
          </Grid>
        </Grid>
      ) : error ? (
        <ErrorPrompt title="Server Error" message={`There is error retrieving details tasks`} />
      ) : data.length === 0 ? (
        <Fallbacks severity="task" title={`Detail of tasks are not found`} description="" sx={{ paddingTop: 6 }} />
      ) : (
        <Grid container sx={{ minHeight: 400 }} spacing={gridSpacing}>
          {Object.keys(groupedPlans).map((perspectiveType, index) => (
            <Grid item xs={12} key={perspectiveType}>
              <DrogaCard
                onPress={() => handlePerspectiveCollapsing(index)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', m: 0 }}
              >
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    m: 1,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.5'
                  }}
                >
                  {perspectiveType}
                </Typography>

                <IconButton onClick={() => handlePerspectiveCollapsing(index)}>
                  {selectedPerspective === index ? (
                    <IconChevronDown size="1.4rem" stroke="1.4" />
                  ) : (
                    <IconChevronRight size="1.4rem" stroke="1.4" />
                  )}
                </IconButton>
              </DrogaCard>

              <Collapse in={selectedPerspective === index}>
                <Grid container spacing={2} mt={0.6}>
                  {groupedPlans[perspectiveType].map((plan, index) => (
                    <Grid item xs={12} sm={12} md={6} lg={6} xl={6} key={index}>
                      <PlanCard
                        plan={plan}
                        // onPress={() => navigate('/planning/view', { state: { ...plan } })}
                        hideOptions={(level === 'first' && status === 'amended') || status === 'open for discussion' ? false : true}
                        onEdit={
                          (level === 'first' && status === 'amended') || status === 'open for discussion'
                            ? () => handleUpdating(plan)
                            : null
                        }
                        onDelete={
                          (level === 'first' && status === 'amended') || status === 'open for discussion'
                            ? () => handleDeletePlan(plan?.id)
                            : null
                        }
                        editInitiative={false}
                        sx={{
                          ':hover': {
                            boxShadow: theme.shadows[1],
                            transform: 'scale(1.03)',
                            transition: 'transform 0.3s ease-in-out'
                          }
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Collapse>
            </Grid>
          ))}
        </Grid>
      )}
    </React.Fragment>
  );
};

ApprovalContents.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.bool,
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  level: PropTypes.string,
  status: PropTypes.string,
  handleUpdating: PropTypes.func
};

export default ApprovalContents;
