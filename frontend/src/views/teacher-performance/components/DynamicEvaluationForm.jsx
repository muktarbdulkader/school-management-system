import React, { useEffect, useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Grid,
  Rating,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  IconInfoCircle,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconAlertTriangle
} from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import dayjs from 'dayjs';

const STEPS = ['Select Teacher & Term', 'Rate Criteria', 'Review & Submit'];

const DynamicEvaluationForm = ({ open, onClose, onSuccess, preselectedTeacher = null }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [teachers, setTeachers] = useState([]);
  const [terms, setTerms] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [evaluationData, setEvaluationData] = useState({
    teacher: preselectedTeacher?.id || '',
    term: '',
    academic_year: '',
    status: 'draft',
    strengths: '',
    areas_for_improvement: '',
    recommendations: '',
    action_items: ''
  });

  const [criteriaRatings, setCriteriaRatings] = useState({});
  const [existingEvaluation, setExistingEvaluation] = useState(null);

  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open]);

  useEffect(() => {
    if (evaluationData.term) {
      const selectedTerm = terms.find(t => t.id === evaluationData.term);
      if (selectedTerm) {
        setEvaluationData(prev => ({
          ...prev,
          academic_year: selectedTerm.academic_year
        }));
      }
    }
  }, [evaluationData.term, terms]);

  useEffect(() => {
    if (evaluationData.teacher && evaluationData.term) {
      checkExistingEvaluation();
    }
  }, [evaluationData.teacher, evaluationData.term]);

  const fetchInitialData = async () => {
    setFetchingData(true);
    try {
      const token = await GetToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch teachers, terms, and active criteria in parallel
      const [teachersRes, termsRes, criteriaRes] = await Promise.all([
        fetch(`${Backend.api}${Backend.teachers}`, { headers }),
        fetch(`${Backend.api}${Backend.terms}`, { headers }),
        fetch(`${Backend.api}${Backend.performanceCriteriaActive}`, { headers })
      ]);

      const [teachersData, termsData, criteriaData] = await Promise.all([
        teachersRes.json(),
        termsRes.json(),
        criteriaRes.json()
      ]);

      if (teachersData.success) setTeachers(teachersData.data || []);
      if (termsData.success) setTerms(termsData.data || []);
      if (criteriaData.success) {
        setCriteria(criteriaData.data || []);
        // Initialize empty ratings for all criteria
        const initialRatings = {};
        (criteriaData.data || []).forEach(c => {
          initialRatings[c.id] = {
            criteria: c.id,
            rating_value: c.measurement_type === 'rating_1_5' ? 3 :
                         c.measurement_type === 'rating_1_10' ? 5 :
                         c.measurement_type === 'percentage' ? 50 :
                         c.measurement_type === 'boolean' ? false : '',
            text_value: '',
            boolean_value: false,
            comment: ''
          };
        });
        setCriteriaRatings(initialRatings);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load required data');
    } finally {
      setFetchingData(false);
    }
  };

  const checkExistingEvaluation = async () => {
    if (!evaluationData.teacher || !evaluationData.term) return;

    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}${Backend.performanceEvaluationByTeacher(evaluationData.teacher)}?term=${evaluationData.term}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const existing = data.data[0];
        setExistingEvaluation(existing);
        // Pre-fill form with existing data
        setEvaluationData({
          teacher: existing.teacher,
          term: existing.term,
          academic_year: existing.academic_year,
          status: existing.status,
          strengths: existing.strengths || '',
          areas_for_improvement: existing.areas_for_improvement || '',
          recommendations: existing.recommendations || '',
          action_items: existing.action_items || ''
        });

        // Pre-fill ratings
        const existingRatings = {};
        (existing.criteria_ratings || []).forEach(r => {
          existingRatings[r.criteria] = {
            criteria: r.criteria,
            rating_value: r.rating_value,
            text_value: r.text_value || '',
            boolean_value: r.boolean_value || false,
            comment: r.comment || ''
          };
        });
        setCriteriaRatings(prev => ({ ...prev, ...existingRatings }));
      } else {
        setExistingEvaluation(null);
      }
    } catch (error) {
      console.error('Error checking existing evaluation:', error);
    }
  };

  const handleEvaluationDataChange = (field, value) => {
    setEvaluationData(prev => ({ ...prev, [field]: value }));
    if (field === 'teacher' || field === 'term') {
      setExistingEvaluation(null);
    }
  };

  const handleCriteriaRatingChange = (criteriaId, field, value) => {
    setCriteriaRatings(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        [field]: value
      }
    }));
  };

  const getMeasurementInput = (criteriaItem, ratingData) => {
    const { measurement_type } = criteriaItem;
    const value = ratingData?.rating_value ?? '';

    switch (measurement_type) {
      case 'rating_1_5':
        return (
          <Box>
            <Rating
              value={Number(value) || 0}
              onChange={(e, newValue) => handleCriteriaRatingChange(criteriaItem.id, 'rating_value', newValue)}
              size="large"
            />
            <Typography variant="caption" sx={{ ml: 1 }}>
              {value ? `${value}/5` : 'Select rating'}
            </Typography>
          </Box>
        );
      case 'rating_1_10':
        return (
          <TextField
            type="number"
            value={value}
            onChange={(e) => handleCriteriaRatingChange(criteriaItem.id, 'rating_value', e.target.value)}
            inputProps={{ min: 1, max: 10 }}
            fullWidth
            helperText="Enter a rating from 1 to 10"
          />
        );
      case 'percentage':
        return (
          <TextField
            type="number"
            value={value}
            onChange={(e) => handleCriteriaRatingChange(criteriaItem.id, 'rating_value', e.target.value)}
            inputProps={{ min: 0, max: 100 }}
            fullWidth
            helperText="Enter percentage (0-100)"
            InputProps={{ endAdornment: <Typography color="text.secondary">%</Typography> }}
          />
        );
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={ratingData?.boolean_value || false}
                onChange={(e) => {
                  handleCriteriaRatingChange(criteriaItem.id, 'boolean_value', e.target.checked);
                  handleCriteriaRatingChange(criteriaItem.id, 'rating_value', e.target.checked ? 5 : 0);
                }}
              />
            }
            label={ratingData?.boolean_value ? 'Yes' : 'No'}
          />
        );
      case 'text':
        return (
          <TextField
            value={ratingData?.text_value || ''}
            onChange={(e) => handleCriteriaRatingChange(criteriaItem.id, 'text_value', e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Enter text evaluation..."
          />
        );
      case 'numeric':
      default:
        return (
          <TextField
            type="number"
            value={value}
            onChange={(e) => handleCriteriaRatingChange(criteriaItem.id, 'rating_value', e.target.value)}
            fullWidth
            placeholder="Enter numeric value"
          />
        );
    }
  };

  const calculateOverallScore = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    criteria.forEach(c => {
      const rating = criteriaRatings[c.id];
      if (rating && c.measurement_type !== 'text') {
        let normalizedScore = 0;
        const val = Number(rating.rating_value) || 0;

        switch (c.measurement_type) {
          case 'rating_1_5':
            normalizedScore = val;
            break;
          case 'rating_1_10':
            normalizedScore = val / 2;
            break;
          case 'percentage':
            normalizedScore = (val / 100) * 5;
            break;
          case 'boolean':
            normalizedScore = rating.boolean_value ? 5 : 0;
            break;
          case 'numeric':
            normalizedScore = Math.min(5, val);
            break;
        }

        totalWeightedScore += normalizedScore * c.weight;
        totalWeight += c.weight;
      }
    });

    if (totalWeight === 0) return 0;
    const weightedAverage = totalWeightedScore / totalWeight;
    return {
      weightedAverage: weightedAverage.toFixed(2),
      percentage: ((weightedAverage / 5) * 100).toFixed(1)
    };
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (!evaluationData.teacher) {
          toast.error('Please select a teacher');
          return false;
        }
        if (!evaluationData.term) {
          toast.error('Please select a term');
          return false;
        }
        return true;
      case 1:
        // Check if at least some criteria have been rated
        const ratedCount = Object.values(criteriaRatings).filter(r =>
          r.rating_value !== '' || r.text_value || r.boolean_value
        ).length;
        if (ratedCount === 0) {
          toast.error('Please rate at least one criteria');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async (submitStatus = 'draft') => {
    setLoading(true);
    try {
      const token = await GetToken();

      const ratingsArray = Object.values(criteriaRatings).filter(r =>
        r.rating_value !== '' || r.text_value || r.boolean_value !== null
      );

      const payload = {
        ...evaluationData,
        status: submitStatus,
        criteria_ratings: ratingsArray
      };

      const url = existingEvaluation
        ? `${Backend.api}${Backend.performanceEvaluations}${existingEvaluation.id}/`
        : `${Backend.api}${Backend.performanceEvaluations}`;
      const method = existingEvaluation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(
          submitStatus === 'draft'
            ? 'Evaluation saved as draft'
            : 'Evaluation submitted successfully'
        );
        onSuccess?.();
        handleClose();
      } else {
        toast.error(data.message || 'Failed to save evaluation');
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Failed to save evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setEvaluationData({
      teacher: preselectedTeacher?.id || '',
      term: '',
      academic_year: '',
      status: 'draft',
      strengths: '',
      areas_for_improvement: '',
      recommendations: '',
      action_items: ''
    });
    setCriteriaRatings({});
    setExistingEvaluation(null);
    onClose();
  };

  const scores = calculateOverallScore();

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={3}>
            {existingEvaluation && (
              <Alert severity="warning" icon={<IconAlertTriangle size={20} />}>
                <Typography variant="body2">
                  An evaluation already exists for this teacher in the selected term.
                  You are currently editing the existing evaluation (Status: {existingEvaluation.status}).
                </Typography>
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Select Teacher *"
                  value={evaluationData.teacher}
                  onChange={(e) => handleEvaluationDataChange('teacher', e.target.value)}
                  disabled={!!preselectedTeacher}
                >
                  {teachers.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.user_details?.full_name || t.name} ({t.teacher_id})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Select Term *"
                  value={evaluationData.term}
                  onChange={(e) => handleEvaluationDataChange('term', e.target.value)}
                >
                  {terms.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name} - {t.academic_year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {evaluationData.teacher && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Teacher Information
                  </Typography>
                  {(() => {
                    const teacher = teachers.find(t => t.id === evaluationData.teacher);
                    return teacher ? (
                      <Stack spacing={0.5}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {teacher.user_details?.full_name || teacher.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {teacher.teacher_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Branch: {teacher.branch_name || 'N/A'}
                        </Typography>
                      </Stack>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Alert severity="info" icon={<IconInfoCircle size={20} />}>
              <Typography variant="body2">
                Rate the teacher for each criteria below. Different criteria may use different measurement types.
                Comments are optional but recommended for providing context.
              </Typography>
            </Alert>

            {criteria.length === 0 ? (
              <Alert severity="warning">
                No active criteria found. Please create criteria first.
              </Alert>
            ) : (
              criteria.map((c) => (
                <Card key={c.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {c.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.description}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            size="small"
                            label={`Weight: ${c.weight}`}
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        {getMeasurementInput(c, criteriaRatings[c.id])}
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Comment (Optional)"
                          value={criteriaRatings[c.id]?.comment || ''}
                          onChange={(e) => handleCriteriaRatingChange(c.id, 'comment', e.target.value)}
                          multiline
                          rows={2}
                          placeholder="Add specific comments..."
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Card sx={{ bgcolor: 'primary.lighter' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Calculated Scores
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Weighted Average
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {scores.weightedAverage}/5
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Overall Percentage
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {scores.percentage}%
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <TextField
              fullWidth
              label="Key Strengths"
              value={evaluationData.strengths}
              onChange={(e) => handleEvaluationDataChange('strengths', e.target.value)}
              multiline
              rows={3}
              placeholder="Describe the teacher's key strengths..."
            />

            <TextField
              fullWidth
              label="Areas for Improvement"
              value={evaluationData.areas_for_improvement}
              onChange={(e) => handleEvaluationDataChange('areas_for_improvement', e.target.value)}
              multiline
              rows={3}
              placeholder="Identify areas where the teacher can improve..."
            />

            <TextField
              fullWidth
              label="Recommendations"
              value={evaluationData.recommendations}
              onChange={(e) => handleEvaluationDataChange('recommendations', e.target.value)}
              multiline
              rows={3}
              placeholder="Provide recommendations for professional development..."
            />

            <TextField
              fullWidth
              label="Action Items"
              value={evaluationData.action_items}
              onChange={(e) => handleEvaluationDataChange('action_items', e.target.value)}
              multiline
              rows={2}
              placeholder="List specific action items for the teacher..."
            />

            <Divider />

            <Typography variant="subtitle2" gutterBottom>
              Criteria Ratings Summary
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {criteria.map(c => {
                const rating = criteriaRatings[c.id];
                if (!rating || (!rating.rating_value && !rating.text_value)) return null;

                let displayValue = '';
                if (c.measurement_type === 'boolean') {
                  displayValue = rating.boolean_value ? 'Yes' : 'No';
                } else if (c.measurement_type === 'text') {
                  displayValue = rating.text_value ? '✓' : '-';
                } else {
                  displayValue = rating.rating_value;
                }

                return (
                  <Chip
                    key={c.id}
                    label={`${c.name}: ${displayValue}`}
                    color="default"
                    size="small"
                  />
                );
              })}
            </Box>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, minHeight: '70vh' } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
        {existingEvaluation ? 'Edit Performance Evaluation' : 'Create Performance Evaluation'}
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ my: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {fetchingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {renderStepContent()}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Box>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            startIcon={<IconChevronLeft size={18} />}
          >
            Back
          </Button>
        </Box>
        <Stack direction="row" spacing={2}>
          {activeStep === STEPS.length - 1 ? (
            <>
              <Button
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                variant="outlined"
              >
                {loading ? <CircularProgress size={18} /> : 'Save as Draft'}
              </Button>
              <Button
                onClick={() => handleSubmit('submitted')}
                disabled={loading}
                variant="contained"
                startIcon={<IconCheck size={18} />}
              >
                {loading ? 'Submitting...' : 'Submit Evaluation'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<IconChevronRight size={18} />}
              disabled={fetchingData}
            >
              Next
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default DynamicEvaluationForm;
