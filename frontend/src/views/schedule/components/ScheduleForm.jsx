import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Grid
} from '@mui/material';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const ScheduleForm = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    period_number: 1,
    start_time: '',
    end_time: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    teacher_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (open) {
      fetchFormData();
    }
  }, [open]);

  const fetchFormData = async () => {
    try {
      const token = await GetToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [classesRes, sectionsRes, subjectsRes, teachersRes] = await Promise.all([
        fetch(`${Backend.api}${Backend.classes}`, { headers }),
        fetch(`${Backend.api}${Backend.sections}`, { headers }),
        fetch(`${Backend.api}${Backend.subjects}`, { headers }),
        fetch(`${Backend.api}${Backend.teachers}`, { headers })
      ]);

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.data || data.results || []);
      }
      if (sectionsRes.ok) {
        const data = await sectionsRes.json();
        setSections(data.data || data.results || []);
      }
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(data.data || data.results || []);
      }
      if (teachersRes.ok) {
        const data = await teachersRes.json();
        setTeachers(data.data || data.results || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.start_time || !formData.end_time || !formData.class_id || !formData.section_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.scheduleSlots}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Schedule created successfully');
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      day_of_week: 'Monday',
      period_number: 1,
      start_time: '',
      end_time: '',
      class_id: '',
      section_id: '',
      subject_id: '',
      teacher_id: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Schedule Slot</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Day of Week"
                name="day_of_week"
                value={formData.day_of_week}
                onChange={handleChange}
                required
              >
                {daysOfWeek.map(day => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Period Number"
                name="period_number"
                value={formData.period_number}
                onChange={handleChange}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Start Time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="End Time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Class"
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                required
              >
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.grade}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Section"
                name="section_id"
                value={formData.section_id}
                onChange={handleChange}
                required
              >
                {sections.map(section => (
                  <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Subject"
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
              >
                <MenuItem value="">None</MenuItem>
                {subjects.map(subject => (
                  <MenuItem key={subject.id} value={subject.id}>{subject.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Teacher"
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleChange}
              >
                <MenuItem value="">None</MenuItem>
                {teachers.map(teacher => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name || teacher.user_details?.full_name || teacher.user?.full_name || 'Unknown'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ScheduleForm;
