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
  Button,
  Avatar,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const AddAssignments = ({
  add,
  isAdding,
  onClose,
  onSubmit,
  subjects,
  classes,
  sections,
  students,
  teacherSubjects = [],
  classData,
}) => {
  const [assignmentDetails, setAssignmentDetails] = useState({
    title: '',
    description: '',
    subject_id: classData?.id || '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: '',
    class_id: classData?.class_id || '',
    section: classData?.section_id || '',
    students: [],
    is_group_assignment: false,
    max_points: 100,
    file_url: '',
  });

  // Update form when classData changes (when opened from specific class)
  useEffect(() => {
    if (classData && add) {
      setAssignmentDetails(prev => ({
        ...prev,
        subject_id: classData.id || prev.subject_id,
        class_id: classData.class_id || prev.class_id,
        section: classData.section_id || prev.section,
      }));
    }
  }, [classData, add]);

  // Filter subjects available for the selected class
  const availableSubjects = assignmentDetails.class_id && teacherSubjects.length > 0
    ? [...new Map(
      teacherSubjects
        .filter(item => item.class_id === assignmentDetails.class_id)
        .map(item => [item.id, { id: item.id, name: item.name, code: item.code }])
    ).values()]
    : subjects;

  // Filter sections available for the selected class
  const availableSections = assignmentDetails.class_id && teacherSubjects.length > 0
    ? [...new Map(
      teacherSubjects
        .filter(item => item.class_id === assignmentDetails.class_id && item.section_id)
        .map(item => [item.section_id, { id: item.section_id, name: item.section_name }])
    ).values()]
    : sections;

  // Filter students by selected class and section
  const availableStudents = students.filter((stu) => {
    if (!assignmentDetails.class_id) return true; // show all if no class selected
    // Find the class name from classes list
    const selectedClass = classes.find(c => c.id === assignmentDetails.class_id);
    const className = selectedClass?.grade;
    const classMatch = !className || stu.grade_details?.grade === className;
    if (!classMatch) return false;
    if (!assignmentDetails.section) return true; // show all of class if no section selected
    // Find section name from available sections
    const selectedSec = availableSections.find(s => s.id === assignmentDetails.section);
    const sectionName = selectedSec?.name;
    return !sectionName || stu.section_details?.name === sectionName;
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    // When class changes, reset subject, section, and student selection
    if (name === 'class_id') {
      setAssignmentDetails({ ...assignmentDetails, class_id: value, subject_id: '', section: '', students: [] });
    } else {
      setAssignmentDetails({ ...assignmentDetails, [name]: value });
    }
  };

  //   const handleStudentsChange = (event) => {
  //     const selectedStudents = event.target.value;

  //     // If it's not a group assignment, ensure only one student is selected
  //     if (!assignmentDetails.is_group_assignment) {
  //       setAssignmentDetails({
  //         ...assignmentDetails,
  //         students:
  //           selectedStudents.length > 1
  //             ? [selectedStudents[selectedStudents.length - 1]]
  //             : selectedStudents,
  //       });
  //     } else {
  //       setAssignmentDetails({
  //         ...assignmentDetails,
  //         students: selectedStudents,
  //       });
  //     }
  //   };

  const renderStudentOption = (student) => {
    const userDetails = student.user_details || {};
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar
          src={userDetails.avatar} // Add avatar URL if available
          sx={{ width: 32, height: 32 }}
        >
          {userDetails.full_name?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="body1">{userDetails.full_name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {student.grade_details?.grade} - {student.section_details?.name}
          </Typography>
        </Box>
      </Box>
    );
  };

  const handleStudentsChange = (event) => {
    let selectedStudents = event.target.value;

    if (!Array.isArray(selectedStudents)) {
      selectedStudents = selectedStudents ? [selectedStudents] : [];
    }

    if (!assignmentDetails.is_group_assignment) {
      selectedStudents =
        selectedStudents.length > 0
          ? [selectedStudents[selectedStudents.length - 1]]
          : [];
    }

    setAssignmentDetails({
      ...assignmentDetails,
      students: selectedStudents,
    });
  };

  const handleGroupAssignmentChange = (event) => {
    const isGroup = event.target.value === 'true';
    setAssignmentDetails({
      ...assignmentDetails,
      is_group_assignment: isGroup,

      students: isGroup
        ? [...assignmentDetails.students]
        : assignmentDetails.students.length > 0
          ? [assignmentDetails.students[0]]
          : [],
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (
      !assignmentDetails.title ||
      !assignmentDetails.subject_id ||
      !assignmentDetails.due_date ||
      !assignmentDetails.class_id ||
      !assignmentDetails.max_points
    ) {
      toast.error('Please fill all required fields (Title, Subject, Class, Due Date, Max Points).');
      return;
    }
    onSubmit(assignmentDetails, () => {
      // Reset form after successful submission
      setAssignmentDetails({
        title: '',
        description: '',
        subject_id: classData?.id || '',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: '',
        class_id: classData?.class_id || '',
        section: classData?.section_id || '',
        students: [],
        is_group_assignment: false,
        max_points: 100,
        file_url: '',
      });
    });
  };

  return (
    <DrogaFormModal
      open={add}
      title="Add Assignment"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isAdding}
    >
      <Grid container spacing={2}>
        <Grid container item xs={12} spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Assignment Title"
              name="title"
              value={assignmentDetails.title}
              onChange={handleChange}
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="subject-label">Subject</InputLabel>
              <Select
                labelId="subject-label"
                label="Subject"
                name="subject_id"
                value={assignmentDetails.subject_id}
                onChange={handleChange}
                disabled={!assignmentDetails.class_id}
              >
                {availableSubjects.length > 0 ? (
                  availableSubjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>Select a class first</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={3}
            value={assignmentDetails.description}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="File URL (Optional)"
            name="file_url"
            placeholder="https://example.com/document.pdf"
            value={assignmentDetails.file_url}
            onChange={handleChange}
            margin="normal"
            helperText="Enter a link to any external resource (Google Drive, Dropbox, etc.)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="class-label">Class</InputLabel>
            <Select
              labelId="class-label"
              label="Class"
              name="class_id"
              value={assignmentDetails.class_id}
              onChange={handleChange}
            >
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.grade}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="section-label">Section</InputLabel>
            <Select
              labelId="section-label"
              label="Section"
              name="section"
              value={assignmentDetails.section}
              onChange={handleChange}
              disabled={!assignmentDetails.class_id}
            >
              <MenuItem value="">All Sections</MenuItem>
              {availableSections.map((sec) => (
                <MenuItem key={sec.id} value={sec.id}>
                  {sec.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Assigned Date"
            name="assigned_date"
            type="date"
            value={assignmentDetails.assigned_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Due Date"
            name="due_date"
            type="date"
            value={assignmentDetails.due_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Maximum Points"
            name="max_points"
            type="number"
            value={assignmentDetails.max_points}
            onChange={handleChange}
            margin="normal"
            inputProps={{
              min: 1,
              step: 1,
            }}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Is Group Assignment?</InputLabel>
            <Select
              name="is_group_assignment"
              value={assignmentDetails.is_group_assignment}
              onChange={handleGroupAssignmentChange}
            >
              <MenuItem value="false">No (Individual Assignment)</MenuItem>
              <MenuItem value="true">Yes (Group Assignment)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel>
              {assignmentDetails.is_group_assignment
                ? 'Select Students'
                : 'Select Student'}
            </InputLabel>
            <Select
              multiple={assignmentDetails.is_group_assignment}
              name="students"
              value={assignmentDetails.students}
              onChange={handleStudentsChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {students
                    .filter((stu) => selected.includes(stu.id))
                    .map((stu) => {
                      const userDetails = stu.user_details || {};
                      return (
                        <Chip
                          key={stu.id}
                          label={userDetails.full_name || stu.name}
                          avatar={
                            <Avatar
                              src={userDetails.avatar}
                              sx={{ width: 24, height: 24 }}
                            >
                              {(userDetails.full_name || stu.name)?.charAt(0)}
                            </Avatar>
                          }
                        />
                      );
                    })}
                </Box>
              )}
            >
              {availableStudents.length > 0 ? (
                availableStudents.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {renderStudentOption(student)}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {assignmentDetails.class_id ? 'No students found for this class/section' : 'Select a class first'}
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </DrogaFormModal>
  );
};

AddAssignments.propTypes = {
  add: PropTypes.bool,
  isAdding: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  subjects: PropTypes.array.isRequired,
  classes: PropTypes.array.isRequired,
  sections: PropTypes.array.isRequired,
  students: PropTypes.array.isRequired,
  teacherSubjects: PropTypes.array,
  classData: PropTypes.object,
};

AddAssignments.defaultProps = {
  add: false,
  teacherSubjects: [],
  classData: null,
};

export default AddAssignments;
