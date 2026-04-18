import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Chip,
  Typography,
  Divider,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const initialLessonDetails = {
  class_id: '',
  subject_id: '',
  unit_id: '',
  subunit_id: '',
  learner_group_id: '',
  group_section: '',
  duration: 50,
  lesson_aims: '',
  learning_objectives: '',
  term_id: '',
  lesson_activities: [
    {
      order_number: 1,
      time_slot: '',
      topic_content: '',
      learner_activity: '',
      formative_assessment: '',
      materials: '',
    },
  ],
  lesson_evaluations: [
    {
      groupSections: '',
      lesson_plan_evaluation: '',
    },
  ],
};

const AddDailyLesson = ({
  add,
  isAdding,
  onClose,
  onSubmit,
  subjects,
  units,
  subunits,
  learnerGroups,
  groupSections,
  learningObjectives,
  terms,
  categories,
}) => {
  const [lessonDetails, setLessonDetails] = useState(initialLessonDetails);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLessonDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle class change - resets subject, unit, subunit and sets learner_group_id
  const handleClassChange = (event) => {
    const { value } = event.target;
    setLessonDetails((prev) => ({
      ...prev,
      class_id: value,
      learner_group_id: value,
      subject_id: '',
      unit_id: '',
      subunit_id: '',
    }));
  };

  // Handle subject change - resets unit, subunit
  const handleSubjectChange = (event) => {
    const { value } = event.target;
    setLessonDetails((prev) => ({
      ...prev,
      subject_id: value,
      unit_id: '',
      subunit_id: '',
    }));
  };

  // Get subjects available for selected class (from categories)
  const getSubjectsForClass = () => {
    if (!lessonDetails.class_id) return [];
    if (!categories || categories.length === 0) return [];

    // Normalize class_id to string for comparison
    const selectedClassId = String(lessonDetails.class_id);

    // Find categories for this class
    const classCategories = categories.filter(cat => {
      const catClassId = cat.class_details?.id || cat.class_fk_id;
      return String(catClassId) === selectedClassId;
    });

    // Extract unique subjects from those categories
    const subjectIds = [...new Set(classCategories.map(cat => cat.subject_details?.id || cat.subject_id).filter(Boolean))];

    return subjects.filter(sub => subjectIds.includes(sub.id));
  };

  // Get units for selected class and subject
  const getUnitsForClassAndSubject = () => {
    if (!lessonDetails.class_id || !lessonDetails.subject_id) return [];

    // Normalize IDs to strings for comparison
    const selectedClassId = String(lessonDetails.class_id);
    const selectedSubjectId = String(lessonDetails.subject_id);

    return units.filter(unit => {
      const category = categories?.find(cat => cat.id === unit.category_id || cat.id === unit.category_details?.id);
      if (!category) return false;
      const catClassId = String(category.class_details?.id || category.class_fk_id);
      const catSubjectId = String(category.subject_details?.id || category.subject_id);
      return catClassId === selectedClassId && catSubjectId === selectedSubjectId;
    });
  };

  const handleActivityChange = (index, event) => {
    const { name, value } = event.target;
    const updatedActivities = [...lessonDetails.lesson_activities];
    updatedActivities[index][name] = value;
    setLessonDetails((prev) => ({
      ...prev,
      lesson_activities: updatedActivities,
    }));
  };

  const handleEvaluationChange = (index, event) => {
    const { name, value } = event.target;
    const updatedEvaluations = [...lessonDetails.lesson_evaluations];
    updatedEvaluations[index][name] = value;
    setLessonDetails((prev) => ({
      ...prev,
      lesson_evaluations: updatedEvaluations,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (
      !lessonDetails.subject_id ||
      !lessonDetails.unit_id ||
      !lessonDetails.learner_group_id ||
      !lessonDetails.term_id
    ) {
      toast.error('Please fill all required fields.');
      return;
    }
    onSubmit(lessonDetails);
    setLessonDetails(initialLessonDetails);
  };

  return (
    <DrogaFormModal
      open={add}
      title="Add Daily Lesson"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isAdding}
    >
      <Grid container spacing={3}>
        {/* Lesson Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Lesson Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        {/* Class must be selected first */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Class</InputLabel>
            <Select
              name="class_id"
              value={lessonDetails.class_id}
              onChange={handleClassChange}
              label="Class"
            >
              <MenuItem value="">
                <em>{learnerGroups.length === 0 ? "No classes available" : "Select Class"}</em>
              </MenuItem>
              {learnerGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name || `Class ${group.grade}`}
                </MenuItem>
              ))}
              {learnerGroups.length === 0 && (
                <MenuItem disabled>
                  No classes assigned. Please contact administrator.
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Subject</InputLabel>
            <Select
              name="subject_id"
              value={lessonDetails.subject_id}
              onChange={handleSubjectChange}
              label="Subject"
              disabled={!lessonDetails.class_id}
            >
              {!lessonDetails.class_id && (
                <MenuItem disabled>Please select a class first</MenuItem>
              )}
              {lessonDetails.class_id && getSubjectsForClass().map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
              {lessonDetails.class_id && getSubjectsForClass().length === 0 && (
                <MenuItem disabled>No subjects available for this class</MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Unit</InputLabel>
            <Select
              name="unit_id"
              value={lessonDetails.unit_id}
              onChange={handleChange}
              label="Unit"
              disabled={!lessonDetails.class_id || !lessonDetails.subject_id}
            >
              {(!lessonDetails.class_id || !lessonDetails.subject_id) && (
                <MenuItem disabled>Please select class and subject first</MenuItem>
              )}
              {getUnitsForClassAndSubject().map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name}
                </MenuItem>
              ))}
              {lessonDetails.class_id && lessonDetails.subject_id && getUnitsForClassAndSubject().length === 0 && (
                <MenuItem disabled>No units available - create a unit first</MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Subunit</InputLabel>
            <Select
              name="subunit_id"
              value={lessonDetails.subunit_id}
              onChange={handleChange}
              label="Subunit"
            >
              {subunits.map((subunit) => (
                <MenuItem key={subunit.id} value={subunit.id}>
                  {subunit.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Duration (minutes)"
            name="duration"
            type="number"
            value={lessonDetails.duration}
            onChange={handleChange}
            inputProps={{ min: 5, max: 120 }}
          />
        </Grid>

        {/* Section Information */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Section Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Group Section</InputLabel>
            <Select
              name="group_section"
              value={lessonDetails.group_section}
              onChange={handleChange}
              label="Group Section"
            >
              {groupSections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Term</InputLabel>
            <Select
              name="term_id"
              value={lessonDetails.term_id}
              onChange={handleChange}
              label="Term"
            >
              {terms.map((term) => (
                <MenuItem key={term.id} value={term.id}>
                  {term.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Lesson Content */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Lesson Content
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Lesson Aims"
            name="lesson_aims"
            value={lessonDetails.lesson_aims}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Learning Objectives</InputLabel>
            <Select
              name="learning_objectives"
              value={lessonDetails.learning_objectives}
              onChange={handleChange}
              label="Learning Objectives"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {learningObjectives
                    .filter((obj) => selected.includes(obj.id))
                    .map((obj) => (
                      <Chip key={obj.id} label={obj.description} />
                    ))}
                </Box>
              )}
            >
              {learningObjectives.map((objective) => (
                <MenuItem key={objective.id} value={objective.id}>
                  {objective.framework_code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* New Fields: Lesson Activities & Lesson Evaluation */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Lesson Activities
          </Typography>
        </Grid>

        {lessonDetails.lesson_activities.map((activity, index) => (
          <Grid
            container
            spacing={2}
            key={index}
            sx={{ mb: 2, pl: 2, borderLeft: '4px solid #1976d2' }}
          >
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Order #"
                name="order_number"
                type="number"
                value={activity.order_number}
                onChange={(e) => handleActivityChange(index, e)}
                margin="normal"
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Time Slot"
                name="time_slot"
                value={activity.time_slot}
                onChange={(e) => handleActivityChange(index, e)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Topic / Content"
                name="topic_content"
                value={activity.topic_content}
                onChange={(e) => handleActivityChange(index, e)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Learner Activity"
                name="learner_activity"
                value={activity.learner_activity}
                onChange={(e) => handleActivityChange(index, e)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Formative Assessment"
                name="formative_assessment"
                value={activity.formative_assessment}
                onChange={(e) => handleActivityChange(index, e)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Materials"
                name="materials"
                value={activity.materials}
                onChange={(e) => handleActivityChange(index, e)}
                margin="normal"
              />
            </Grid>
          </Grid>
        ))}

        {/* Lesson Evaluations */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Lesson Evaluation
          </Typography>
        </Grid>

        {lessonDetails.lesson_evaluations.map((evaluation, index) => (
          <Grid
            container
            spacing={2}
            key={index}
            sx={{ mb: 2, pl: 2, borderLeft: '4px solid #388e3c' }}
          >
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Group Sections</InputLabel>
                <Select
                  name="groupSections"
                  value={evaluation.groupSections}
                  onChange={(e) => handleEvaluationChange(index, e)}
                  label="Group Sections"
                >
                  {groupSections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lesson Plan Evaluation"
                name="lesson_plan_evaluation"
                value={evaluation.lesson_plan_evaluation}
                onChange={(e) => handleEvaluationChange(index, e)}
                margin="normal"
              />
            </Grid>
          </Grid>
        ))}
      </Grid>
    </DrogaFormModal>
  );
};

AddDailyLesson.propTypes = {
  add: PropTypes.bool.isRequired,
  isAdding: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  subjects: PropTypes.array.isRequired,
  units: PropTypes.array.isRequired,
  subunits: PropTypes.array.isRequired,
  learnerGroups: PropTypes.array.isRequired,
  groupSections: PropTypes.array.isRequired,
  learningObjectives: PropTypes.array.isRequired,
  terms: PropTypes.array.isRequired,
  categories: PropTypes.array,
};

export default AddDailyLesson;
