import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  MenuItem,
  useTheme,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import PropTypes from 'prop-types';
import { TaskProgress } from 'ui-component/steppers/Stepper';
import DrogaButton from 'ui-component/buttons/DrogaButton';

function formatToBackendDateTime(date, time = '00:00:00') {
  let dt;

  if (date instanceof Date) {
    dt = date;
  } else {
    // Combine date + time strings and create a Date object
    dt = new Date(`${date}T${time}`);
  }

  // Convert to ISO string
  return dt.toISOString(); // e.g., "2025-09-26T00:00:00.000Z"
}

export const CreatePlan = ({ add, onClose, onSucceed, defaultValues }) => {
  const theme = useTheme();
  // state for inputs
  const [subjectId, setSubjectId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [subunitId, setSubunitId] = useState('');
  const [date, setDate] = useState(new Date().toISOString()); // default to today
  const [learnerGroupId, setLearnerGroupId] = useState('');
  const [duration, setDuration] = useState(50);
  const [block, setBlock] = useState('');
  const [lessonStructure, setLessonStructure] = useState('udl');
  const [lessonAims, setLessonAims] = useState('');
  const [learningObjective, setLearningObjective] = useState('');
  const [termId, setTermId] = React.useState('');
  const [week, setWeek] = React.useState('1');

  // stepper state
  const [isAdding, setIsAdding] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [error, setError] = React.useState({ state: false, message: '' });

  // fake fetched data (replace with API calls)
  const [units, setUnits] = React.useState([]);
  const [subunits, setSubunits] = React.useState([]);
  const [subjects, setSubjects] = React.useState([]);
  const [terms, setTerms] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [objectives, setObjectives] = React.useState([]);

  useEffect(() => {
    if (defaultValues) {
      setSubjectId(defaultValues?.subject_details?.id);
      setUnitId(defaultValues?.unit_details?.id);
      setSubunitId(defaultValues?.subunit_details?.id);
      setDate(defaultValues?.date);
      setLearnerGroupId(defaultValues?.learner_group_details?.id);
      setDuration(defaultValues?.duration);
      setBlock(defaultValues?.block);
      setLessonStructure(defaultValues?.lesson_structure);
      setLessonAims(defaultValues?.lesson_aims);
      setLearningObjective(defaultValues?.learning_objectives);
      setTermId(defaultValues?.term_details?.id);
      setWeek(defaultValues?.week);
    }
  }, [defaultValues]);

  function filterById(items, targetId) {
   
    return items.filter((item) => item.id === targetId);
  }

  // initial data fetch subjects, terms, classes
  useEffect(() => {
    const fetchData = async () => {
      const token = await GetToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      };
      const API = Backend.api + Backend.subjects;

      try {
        // Subjects
        const subjectsRes = await fetch(API, { headers });
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData?.data || []);

        // Terms
        const termsAPI = Backend.api + Backend.terms;
        const termsRes = await fetch(termsAPI, { headers });
        const termsData = await termsRes.json();
        setTerms(termsData?.data || []);

        // Classes
        const ClassesAPI =
          Backend.api + Backend.classes + '?subject_id=' + subjectId;
        const classesRes = await fetch(ClassesAPI, { headers });
        const classesData = await classesRes.json();
        setClasses(classesData?.data || []);
      } catch (err) {
        console.error('Fetch error', err);
        toast.error('Failed to load initial data');
      }
    };

    fetchData();
  }, []);

  // Fetch units when subject changes
  useEffect(() => {
    if (!subjectId) return;
    const fetchUnits = async () => {
      const token = await GetToken();
      const headers = { Authorization: `Bearer ${token}` };
      const API = Backend.api + Backend.objectiveUnits + '?' + subjectId;
      try {
        const res = await fetch(API, {
          headers,
        });
        const data = await res.json();
        setUnits((defaultValues ? data?.data : (classes ? data?.data?.filter((u) => u?.class_details?.id === classes[0]?.id) : []) ) || []);
      } catch (err) {
        toast.error('Failed to load units');
      }
    };

    fetchUnits();
  }, [subjectId]);

  // Fetch subunits when unit changes
  useEffect(() => {
    if (!unitId) return;
    const fetchSubunits = async () => {
      const token = await GetToken();
      const headers = { Authorization: `Bearer ${token}` };
      const API =
        Backend.api + Backend.objectiveSubunits + '?unit_id=' + unitId;
      try {
        const res = await fetch(API, {
          headers,
        });
        const data = await res.json();
        setSubunits(data?.data?.filter((su) => su?.unit_details?.id === unitId) || []);
      } catch (err) {
        toast.error('Failed to load subunits');
      }
    };

    fetchSubunits();
  }, [unitId]);

  // Fetch objectives when subunit changes
  // useEffect(() => {
  //   if (!subunitId) return;
  //   const fetchObjectives = async () => {
  //     const token = await GetToken();
  //     const headers = { Authorization: `Bearer ${token}` };
  //     const API =
  //       Backend.api + Backend.learningObjectives + '?subunit_id=' + subunitId;

  //     try {
  //       const res = await fetch(API, { headers });
  //       const data = await res.json();
  //       setObjectives(data?.data || []);
  //     } catch (err) {
  //       toast.error('Failed to load objectives');
  //     }
  //   };

  //   fetchObjectives();
  // }, [subunitId]);

  const handleBack = () => {
    setError({ state: false, message: '' });
    setActiveIndex(activeIndex - 1);
  };

  // Validation function
  const validateStep = () => {
    switch (activeIndex) {
      case 0: // Basic Info
        if (!subjectId) return 'Please select a subject';
        if (!unitId) return 'Please select a unit';
        if (!subunitId) return 'Please select a subunit';
        if (!date) return 'Please select a date';
        break;
      case 1: // Class & Term
        if (!learnerGroupId) return 'Please select a class';
        if (!termId) return 'Please select a term';
        if (!week) return 'Please enter a week';
        break;
      case 2: // Lesson Details
        if (!duration || duration <= 0) return 'Please enter a valid duration';
        if (!block) return 'Please enter a block';
        if (!lessonStructure) return 'Please select a lesson structure';
        if (!lessonAims) return 'Please enter lesson aims';
        if (!learningObjective) return 'Please select a learning objective';
        break;
      default:
        return '';
    }
    return '';
  };
  const handleNext = () => {
    const errorMsg = validateStep();
    if (errorMsg) {
      setError({ state: true, message: errorMsg });
      return;
    }
    setError({ state: false, message: '' });
    setActiveIndex(activeIndex + 1);
  };

  const handlePlanSubmission = async () => {
    const errorMsg = validateStep();
    if (errorMsg) {
      setError({ state: true, message: errorMsg });
      return;
    }

    setError({ state: false, message: '' });
    setIsAdding(true);

    try {
      const token = await GetToken();
      const Api =
        Backend.api +
        Backend.lessonPlans +
        (defaultValues ? `${defaultValues.id}` : '');
      const headers = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };
      const data = {
        subject_id: subjectId,
        unit_id: unitId,
        subunit_id: subunitId,
        date,
        learner_group_id: learnerGroupId,
        duration,
        block,
        lesson_structure: lessonStructure,
        lesson_aims: lessonAims,
        learning_objectives: learningObjective,
        created_by: token?.user_id,
        term_id: termId,
        week,
      };
      const method = defaultValues ? 'PATCH' : 'POST';
      console.log('Submitting data:', data);
      const response = await fetch(Api, {
        method,
        headers,
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(response.message || 'Plan created!');
        onSucceed?.();
        onClose?.();
      } else {
        toast.error(response.data?.message || 'Error creating plan');
        console.error('Error response:', response);
      }
    } catch (error) {
      toast.error(error.message);
      console.error('Submission error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  // steps
  const steps = [
    {
      name: 'Basic Info',
      component: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Unit"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
          >
            {units.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u?.category_details?.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Subunit"
            value={subunitId}
            onChange={(e) => setSubunitId(e.target.value)}
          >
            {subunits.map((su) => (
              <MenuItem key={su.id} value={su.id}>
                {su.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="datetime-local"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      ),
    },
    {
      name: 'Class & Term',
      component: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Class"
            value={learnerGroupId}
            onChange={(e) => setLearnerGroupId(e.target.value)}
          >
            {classes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                Grade {c.grade}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Term"
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
          >
            {terms.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Week"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          />
        </Box>
      ),
    },
    {
      name: 'Lesson Details',
      component: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            type="number"
            label="Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />

          <TextField
            label="Block"
            value={block}
            onChange={(e) => setBlock(e.target.value)}
          />

          <TextField
            select
            label="Lesson Structure"
            value={lessonStructure}
            onChange={(e) => setLessonStructure(e.target.value)}
          >
            <MenuItem value="udl">UDL</MenuItem>
            <MenuItem value="grr">GRR</MenuItem>
            <MenuItem value="5e">5E</MenuItem>
            <MenuItem value="direct_instruction">Direct instruction</MenuItem>
            <MenuItem value="workshop_model">Workshop model</MenuItem>
          </TextField>

          <TextField
            multiline
            minRows={3}
            label="Lesson Aims"
            value={lessonAims}
            onChange={(e) => setLessonAims(e.target.value)}
          />

          <TextField
            label="Learning Objective"
            value={learningObjective}
            onChange={(e) => setLearningObjective(e.target.value)}
          >
            {objectives.map((o) => (
              <MenuItem key={o.id} value={o.id}>
                {o.framework_code}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      ),
    },
  ];

  return (
    <Dialog open={add} onClose={onClose} maxWidth="md" fullWidth>
      <Paper
        sx={{
          minHeight: '60dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <DialogTitle variant="h4" sx={{ margin: 0 }}>
              {steps[activeIndex].name}
            </DialogTitle>
            <TaskProgress
              numberOfSteps={steps.length}
              currentIndex={activeIndex}
            />
          </Box>
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
            style={{ cursor: 'pointer' }}
            onClick={onClose}
          >
            <IconX size={24} />
          </motion.div>
        </Box>

        {/* Scrollable Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            padding: 3,
            gap: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {steps[activeIndex].component}
        </Box>

        {/* Footer */}
        <DialogActions
          sx={{ padding: 2, borderTop: `1px solid ${theme.palette.divider}` }}
        >
          {error.state && <Alert severity="error">{error.message}</Alert>}

          {activeIndex > 0 && (
            <Button
              onClick={handleBack}
              sx={{ paddingX: 4, paddingY: 1, marginRight: 2 }}
            >
              Back
            </Button>
          )}

          {activeIndex === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              sx={{ py: 1, px: 6, boxShadow: 0, borderRadius: 2 }}
              onClick={handlePlanSubmission}
            >
              {isAdding ? (
                <CircularProgress size={18} sx={{ color: 'white' }} />
              ) : (
                'Submit'
              )}
            </Button>
          ) : (
            <DrogaButton
              type="button"
              title="Next"
              variant="contained"
              sx={{ px: 6, py: 1, boxShadow: 0 }}
              onPress={handleNext}
            />
          )}
        </DialogActions>
      </Paper>
    </Dialog>
  );
};

CreatePlan.propTypes = {
  add: PropTypes.bool,
  onClose: PropTypes.func,
  onSucceed: PropTypes.func,
};
