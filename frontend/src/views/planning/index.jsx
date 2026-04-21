import React, { useEffect, useState } from 'react';
import {
  Grid,
  Box,
  TablePagination,
  Typography,
  Container,
} from '@mui/material';
import { Button } from '@mui/material';
import { CreatePlan } from './components/CreatePlan';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import MiniPlanCard from './components/MiniPlanCard';
import CircularProgress from '@mui/material/CircularProgress';
import Fallbacks from 'utils/components/Fallbacks';
import PlanCard from './components/PlanCardView';
import ConfirmDialog from './components/ConfirmDialog';
import LessonFeedbackModal from './components/LessonFeedbackModal';
import FeedbackPopup from './components/CreateLessonActivities';
import { toast } from 'react-toastify';

const sortPlansByDate = (plans, order = 'asc') => {
  return plans.slice().sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

const Planning = () => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [plans, setPlans] = useState([]);
  const [plansEvaluation, setPlansEvaluation] = useState([]);
  const [PlansActivities, setPlansActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [mergedPlans, setMergedPlans] = useState([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 9,
    total: 0,
  });

  // merge function (plans, evaluations, activities)
  const mergePlans = (
    plans = [],
    plansEvaluation = [],
    plansActivities = [],
  ) => {
    // Helper to extract lessonPlanId defensively
    const getLessonPlanId = (item) =>
      item?.lesson_plan_details?.id ??
      item?.lesson_plan_id ??
      item?.lesson_plan ??
      null;

    // Build evaluation map: lessonPlanId -> best evaluation object (prefer latest updated_at)
    const evaluationMap = new Map();
    for (const ev of plansEvaluation || []) {
      const lpId = getLessonPlanId(ev);
      if (!lpId) continue;
      if (!evaluationMap.has(lpId)) {
        evaluationMap.set(lpId, ev);
      } else {
        const existing = evaluationMap.get(lpId);
        if (ev.updated_at && existing.updated_at) {
          if (new Date(ev.updated_at) > new Date(existing.updated_at)) {
            evaluationMap.set(lpId, ev);
          }
        }
        // otherwise keep the first one
      }
    }

    // Build activity map: lessonPlanId -> best activity object (prefer latest updated_at)
    const activityMap = new Map();
    for (const act of plansActivities || []) {
      // The activity payload may be nested under `data` (depending on how you set state), be defensive:
      const item = act?.data ?? act;
      const lpId = getLessonPlanId(item);
      if (!lpId) continue;
      if (!activityMap.has(lpId)) {
        activityMap.set(lpId, item);
      } else {
        const existing = activityMap.get(lpId);
        if (item.updated_at && existing.updated_at) {
          if (new Date(item.updated_at) > new Date(existing.updated_at)) {
            activityMap.set(lpId, item);
          }
        }
      }
    }

    // Now map plans -> merged plan
    return (plans || []).map((plan) => {
      const planId = plan?.id;
      const ev = evaluationMap.get(planId);
      const act = activityMap.get(planId);

      // decide which lesson details to prefer (ev > act > plan)
      const lessonDetails =
        ev?.lesson_plan_details ?? act?.lesson_plan_details ?? {};

      // destructure ev and act to pull out their nested lesson_plan_details and ids and extras
      const {
        lesson_plan_details: evLesson = {},
        id: evaluation_id,
        ...evRest
      } = ev ?? {};
      const {
        lesson_plan_details: actLesson = {},
        id: activity_id,
        ...actRest
      } = act ?? {};

      // Build merged object:
      // Order matters: later spreads overwrite earlier ones.
      const merged = {
        ...plan, // original plan fields
        ...lessonDetails, // override with lesson details from ev or act (if present)
        // attach evaluation extras (if any)
        ...(ev ? evRest : {}),
        evaluation_id: evaluation_id ?? null,
        // attach activity extras (if any)
        ...(act ? actRest : {}),
        activity_id: activity_id ?? null,
      };

      // Optionally, ensure certain fields are present as nested objects to avoid collisions:
      if (ev) merged._evaluation = { id: evaluation_id, ...evRest };
      if (act) merged._activity = { id: activity_id, ...actRest };

      return merged;
    });
  };

  const fetchPlans = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await GetToken();
      const res = await fetch(
        `${Backend.api}${Backend.getMyPlans}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1
        }&per_page=${pagination.per_page}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const response = await res.json();

      if (response.success && response.data) {
        const plansData = response.data.plans || response.data; // adjust if API returns nested plans
        setPlans(sortPlansByDate(plansData));
        setPagination((prev) => ({
          ...prev,
          total: response.data.total_count || plansData.length, // use server total if provided
        }));
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlansEvaluation = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await GetToken();
      const API = `${Backend.api}${Backend.getMyEvaluationFeedback}`;
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await res.json();
      if (response.success && response.data) {
        const plansData = response.data.plans || response.data;
        setPlansEvaluation(plansData);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch lesson plans');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlansActivities = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await GetToken();
      const API = `${Backend.api}${Backend.getMyLessonActivities}`;
      console.log('Fetching activities from:', API);
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await res.json();
      if (response.success && response.data) {
        const plansData = response.data.plans || response.data;
        setPlansActivities(plansData);
        console.log('Activities:', plansData);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch lesson plans activities');
      console.log('Failed to fetch lesson plans activities', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchPlansEvaluation();
    fetchPlansActivities();
    const merged = mergePlans(plans, plansEvaluation);
    setPlans(merged);
  }, [
    selectedYear?.id,
    pagination.page,
    pagination.per_page,
    createPlanOpen,
    editModalOpen,
    feedbackModalOpen,
  ]);

  useEffect(() => {
    if (plans.length === 0) {
      setMergedPlans([]);
      return;
    }
    const merged = mergePlans(plans, plansEvaluation, PlansActivities);
    setMergedPlans(merged);
    console.log('Merged Plans:', merged);
  }, [plans, plansEvaluation, PlansActivities]);

  const refreshPlans = () => {
    fetchPlans();
    fetchPlansEvaluation();
    fetchPlansActivities();
  };

  const handleClosePlan = () => {
    setSelectedPlan(null);
    setModalOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({
      ...pagination,
      per_page: parseInt(event.target.value, 10),
      page: 0,
    });
  };

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleEditPlan = (plan) => {
    console.log('Edit Plan:', plan);
    setEditPlan(plan);
    setEditModalOpen(true);
    setModalOpen(false);
  };

  const confirmDelete = () => {
    setConfirmOpen(false);
    handleConfirmedDelete(selectedPlan);
  };

  const handleConfirmedDelete = async (plan) => {
    const API = `${Backend.api}${Backend.getMyPlans}${plan.id}/`;
    setLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(API, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConfirmOpen(false);
        toast.success('Plan deleted successfully');
        handleClosePlan();
        refreshPlans();
      } else {
        toast.error('Failed to delete plan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (plan) => {
    setConfirmOpen(true);
    setSelectedPlan(plan);
  };

  const handleGiveFeedback = (plan) => {
    setSelectedPlan(plan);
    setFeedbackModalOpen(true);
  };

  const handleAddActivities = (plan) => {
    setSelectedPlan(plan);
    setFeedbackOpen(true);
  };

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          py: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography color="error" variant="h6" textAlign="center">
          {error || 'No data available'}
        </Typography>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button onClick={refreshPlans} variant="contained">
            Retry
          </Button>
        </Box>
      </Container>
    );
  }
  return (
    <Box sx={{ py: 4, backgroundColor: '#f9f9f9' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4">My Plans</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCreatePlanOpen(true)}
          >
            Create Day Plan
          </Button>
        </Box>
        <CreatePlan
          add={createPlanOpen}
          onClose={() => setCreatePlanOpen(false)}
          onSucceed={refreshPlans}
        />

        <Grid container spacing={3}>
          {mergedPlans.length > 0 ? (
            mergedPlans.map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <MiniPlanCard
                  plan={plan}
                  onPress={() => handleViewPlan(plan)}
                  onEdit={() => handleEditPlan(plan)}
                  onDelete={() => handleDelete(plan)}
                  onGiveFeedback={() => handleGiveFeedback(plan)}
                  onGiveActivities={() => handleAddActivities(plan)}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <Fallbacks
                  severity="planning"
                  title="No Plans"
                  description="No plans found for this year."
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setCreatePlanOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Create Day Plan
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>

        {pagination.total > pagination.per_page && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <TablePagination
              component="div"
              count={pagination.total}
              rowsPerPage={pagination.per_page}
              page={pagination.page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[6, 9, 12]}
            />
          </Box>
        )}
      </Container>
      {editPlan && (
        <CreatePlan
          add={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditPlan(null);
          }}
          onSucceed={refreshPlans}
          defaultValues={editPlan} // new prop for pre-filling fields
        />
      )}

      {selectedPlan && (
        <PlanCard
          open={modalOpen}
          onClose={handleClosePlan}
          plan={selectedPlan}
          onUpdated={refreshPlans}
          onEdit={handleEditPlan}
          onDelete={confirmDelete}
        />
      )}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => handleConfirmedDelete(selectedPlan)}
        title="Delete Lesson"
        message="Are you sure you want to delete this lesson?"
      />
      {selectedPlan && (
        <LessonFeedbackModal
          open={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          onSucceed={refreshPlans}
          planId={selectedPlan.id}
          classId={selectedPlan?.class_fk_details?.id || selectedPlan?.learner_group_details?.id}
          subunitId={selectedPlan?.subunit_id || selectedPlan?.subunit?.id}
          sectionId={selectedPlan?.section_id}
        />
      )}
      {selectedPlan && (
        <FeedbackPopup
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          lessonPlanId={selectedPlan?.id}
          onSuccess={refreshPlans}
        />
      )}
    </Box>
  );
};

export default Planning;
