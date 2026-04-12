import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Box,
  Button,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const initialClassDetails = {
  className: '',
  subject: '',
  students: [],
  schedule: '',
};

const AddClass = ({ add, isAdding, onClose, onSubmit }) => {
  const [classDetails, setClassDetails] = useState(initialClassDetails);
  const [currentStudent, setCurrentStudent] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setClassDetails({ ...classDetails, [name]: value });
  };

  const handleStudentAdd = () => {
    if (
      currentStudent.trim() &&
      !classDetails.students.includes(currentStudent.trim())
    ) {
      setClassDetails((prev) => ({
        ...prev,
        students: [...prev.students, currentStudent.trim()],
      }));
      setCurrentStudent('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!classDetails.className || !classDetails.subject) {
      toast.error('Please fill all required fields.');
      return;
    }
    onSubmit(classDetails);
    setClassDetails(initialClassDetails);
  };

  return (
    <DrogaFormModal
      open={add}
      title="Add New Class"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isAdding}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Class Name"
            name="className"
            value={classDetails.className}
            onChange={handleChange}
            margin="normal"
            required
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Subject</InputLabel>
            <Select
              name="subject"
              value={classDetails.subject}
              onChange={handleChange}
              label="Subject"
              required
            >
              {/* {subjects.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))} */}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Schedule"
            name="schedule"
            value={classDetails.schedule}
            onChange={handleChange}
            margin="normal"
            placeholder="e.g., Mon/Wed/Fri 10:00-11:30"
          />
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              fullWidth
              label="Add Student"
              value={currentStudent}
              onChange={(e) => setCurrentStudent(e.target.value)}
              margin="normal"
            />
            <Button
              variant="contained"
              onClick={handleStudentAdd}
              sx={{ mt: 2, mb: 2 }}
            >
              Add
            </Button>
          </Box>

          {/* {classDetails.students.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
              {classDetails.students.map((student) => (
                <Chip
                  key={student}
                  label={student}
                  onDelete={() => handleStudentRemove(student)}
                />
              ))}
            </Box>
          )} */}
        </Grid>
      </Grid>
    </DrogaFormModal>
  );
};

AddClass.propTypes = {
  add: PropTypes.bool.isRequired,
  isAdding: PropTypes.bool.isRequired,
  students: PropTypes.array.isRequired,
  subjects: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default AddClass;
