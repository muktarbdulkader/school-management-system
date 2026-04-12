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

const StudentForm = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: 'student123',
    student_id: '',
    grade_id: '',
    section_id: '',
    date_of_birth: '',
    gender: '',
    parent_full_name: '',
    parent_email: '',
    parent_password: '',
    parent_phone: '',
    relationship: 'Father'
  });
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (open) {
      fetchFormData();
    }
  }, [open]);

  const fetchFormData = async () => {
    try {
      const token = await GetToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [classesRes, sectionsRes] = await Promise.all([
        fetch(`${Backend.api}${Backend.classes}`, { headers }),
        fetch(`${Backend.api}${Backend.sections}`, { headers })
      ]);

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.data || data.results || []);
      }
      if (sectionsRes.ok) {
        const data = await sectionsRes.json();
        setSections(data.data || data.results || []);
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

    if (!formData.full_name || !formData.email || !formData.grade_id || !formData.section_id) {
      toast.error('Please fill in all required student fields');
      return;
    }

    if (!formData.parent_full_name || !formData.parent_email || !formData.parent_password) {
      toast.error('Please fill in all required parent fields');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.students}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        toast.success('Student and parent account created successfully');
        onSuccess();
        handleClose();
      } else {
        const errorMsg = responseData.message || responseData.error || 'Failed to create student';
        console.error('Student creation error:', responseData);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error('Failed to create student: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      full_name: '',
      email: '',
      password: 'student123',
      student_id: '',
      grade_id: '',
      section_id: '',
      date_of_birth: '',
      gender: '',
      parent_full_name: '',
      parent_email: '',
      parent_password: '',
      parent_phone: '',
      relationship: 'Father'
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Student</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student ID"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="Auto-generated if empty"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Grade"
                name="grade_id"
                value={formData.grade_id}
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
                type="date"
                label="Date of Birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>

            {/* Parent Information Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'primary.main' }}>
                Parent/Guardian Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent/Guardian Full Name"
                name="parent_full_name"
                value={formData.parent_full_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Email"
                name="parent_email"
                type="email"
                value={formData.parent_email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Password"
                name="parent_password"
                type="password"
                value={formData.parent_password}
                onChange={handleChange}
                required
                helperText="Parent will use this to login"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Relationship to Student"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                required
              >
                <MenuItem value="Father">Father</MenuItem>
                <MenuItem value="Mother">Mother</MenuItem>
                <MenuItem value="Guardian">Guardian</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
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

export default StudentForm;
