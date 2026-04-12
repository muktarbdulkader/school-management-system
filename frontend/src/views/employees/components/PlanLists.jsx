import React, { useState } from 'react';
import {
  Collapse,
  Grid,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { gridSpacing } from 'store/constant';
import PropTypes from 'prop-types';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Fallbacks from 'utils/components/Fallbacks';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import DrogaCard from 'ui-component/cards/DrogaCard';
import MiniPlanCard from 'views/planning/components/MiniPlanCard';
import IsEmployee from 'utils/is-employee';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { UpdatePlan } from 'views/planning/components/UpdatePlan';
import { Storage } from 'configration/storage';
import { useKPI } from 'context/KPIProvider';
import { toast } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import DeletePrompt from 'ui-component/modal/DeletePrompt';

//======================  UNITS PLAN LISTING COMPONENT  ================================

const PlanLists = ({ loading, error, data, canEdit, refresh }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isEmployee = IsEmployee();
  const { handleUpdatePlan } = useKPI();
  const [selectedPerspective, setSelectedPerspective] = useState(0);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [update, setUpdate] = useState(false);
  const [selectedPlanID, setSelectedPlanID] = useState(null);
  const [deletePlan, setDeletePlan] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePerspectiveCollapsing = (index) => {
    if (selectedPerspective === index) {
      setSelectedPerspective(null);
    } else {
      setSelectedPerspective(index);
    }
  };

  const handleSettingUP = (selected) => {
    const newKPI = {
      id: selected?.kpi_id,
      f_name: selected?.frequency?.name,
      f_value: selected?.frequency?.value,
      frequency_id: selected?.frequency_id,
      mu: selected?.kpi?.measuring_unit?.name,
      name: selected?.kpi?.name,
      total_target: selected?.total_target,
      weight: selected?.weight,
      objective: selected?.objective,
    };

    const targets = selected?.target?.map((prevTarget) => ({
      period_id: prevTarget?.period_id,
      target: prevTarget?.target,
    }));
    handleUpdatePlan([{ ...newKPI, targets: targets }]);
    Storage.setItem(
      'selectFiscal',
      JSON.stringify({ id: selected?.fiscal_year_id, year: '' }),
    );

    setSelectedPlanID(selected?.id);
    setUpdate(true);
  };

  const handleUpdatingPlan = (plan) => {
    handleSettingUP(plan);
  };

  const handleUpdateModalClose = () => {
    handleUpdatePlan([]);
    setUpdate(false);
    setSelectedPlanID(null);
  };

  const handleDeletePlan = (data) => {
    setSelectedPlan(data);
    setDeletePlan(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = await GetToken();
      const Api = Backend.api + Backend.deletePlan + `/${selectedPlan?.id}`;
      fetch(Api, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            setDeletePlan(false);
            toast.success(response.data.message);
            refresh();
          } else {
            toast.info(response.data.message);
          }
        });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const groupedPlans = {};

  data.forEach((plan) => {
    const perspectiveType = plan?.perspective_type;

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
          <Grid
            item
            xs={12}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
            }}
          >
            <ActivityIndicator size={20} />
          </Grid>
        </Grid>
      ) : error ? (
        <ErrorPrompt
          title="Server Error"
          message={`There is error retrieving details tasks`}
        />
      ) : data.length === 0 ? (
        <Fallbacks
          severity="task"
          title={`There is no plan found`}
          description=""
          sx={{ paddingTop: 6 }}
        />
      ) : (
        <Grid container sx={{ minHeight: 400 }} spacing={gridSpacing}>
          {Object.keys(groupedPlans).map((perspectiveType, index) => (
            <Grid item xs={12} key={perspectiveType}>
              <DrogaCard
                onPress={() => handlePerspectiveCollapsing(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
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
                    lineHeight: '1.5',
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
                    <Grid item xs={12} sm={12} md={6} lg={4} xl={4} key={index}>
                      <MiniPlanCard
                        plan={plan}
                        onPress={() =>
                          navigate('/planning/view', { state: { ...plan } })
                        }
                        onEdit={() => handleUpdatingPlan(plan)}
                        onDelete={() => handleDeletePlan(plan)}
                        hideOptions={canEdit ? false : true}
                        editInitiative={false}
                        is_employee={isEmployee}
                        sx={{
                          ':hover': {
                            boxShadow: theme.shadows[1],
                            transform: 'scale(1.03)',
                            transition: 'transform 0.3s ease-in-out',
                          },
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

      {selectedPlanID && (
        <UpdatePlan
          add={update}
          plan_id={selectedPlanID}
          onClose={handleUpdateModalClose}
          onSucceed={() => refresh()}
          isUpdate={true}
        />
      )}
      {deletePlan && (
        <DeletePrompt
          type="Delete"
          open={deletePlan}
          title="Deleting Plan"
          description={
            `Are you sure you want to delete ` + selectedPlan?.kpi?.name
          }
          onNo={() => setDeletePlan(false)}
          onYes={() => handleDelete()}
          deleting={deleting}
          handleClose={() => setDeletePlan(false)}
        />
      )}
    </React.Fragment>
  );
};

PlanLists.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.bool,
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  level: PropTypes.string,
  status: PropTypes.string,
  handleUpdating: PropTypes.func,
};

export default PlanLists;
