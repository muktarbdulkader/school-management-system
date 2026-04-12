import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Box,
  OutlinedInput
} from '@mui/material';
import { toast } from 'react-hot-toast';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const TeacherForm = ({ open, onClose, onSuccess, teacher = null }) => {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    subject_specialties: '',
    rating: 0,
    attendance_percentage: 100,
    branch_id: '',
    subjects: []
  });

  useEffect(() => {
    if (open) {
      fetchSubjects();
      fetchBranches();
      if (teacher) {
        setFormData({
          full_name: teacher.user_details?.full_name || '',
          email: teacher.user_details?.email || '',
          phone: teacher.user_details?.phone || '',
          password: '',
          subject_specialties: teacher.subject_specialties || '',
          rating: teacher.rating || 0,
          attendance_percentage: teacher.attendance_percentage || 100,
          branch_id: teacher.user_details?.branch_id || '',
          subjects: teacher.subjects?.map(s => s.id) || []
        });
      }
    }
  }, [open, teacher]);

  const fetchSubjects = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.subjects}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.branches}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBranches(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!teacher && !formData.password) {
      toast.error('Password is required for new teachers');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      
      // Create user first
      const userData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        branch_id: formData.branch_id,
        role: 'teacher'
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      let userId;
      if (teacher) {
        // Update existing user
        userId = teacher.user || teacher.user_details?.id;
        
        if (!userId) {
          throw new Error('Teacher user ID not found');
        }
        
        const userResponse = await fetch(
          `${Backend.api}${Backend.users}${userId}/`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
          }
        );
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.message || 'Failed to update user');
        }
      } else {
        // Create new user
        const userResponse = await fetch(`${Backend.api}${Backend.users}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.message || 'Failed to create user');
        }
        const userResponseData = await userResponse.json();
        userId = userResponseData.data?.id || userResponseData.id;
      }

      // Create or update teacher profile
      const teacherData = {
        user: userId,
        subject_specialties: formData.subject_specialties,
        rating: parseFloat(formData.rating),
        attendance_percentage: parseFloat(formData.attendance_percentage)
      };

      const teacherUrl = teacher 
        ? `${Backend.api}${Backend.teachers}${teacher.id}/`
        : `${Backend.api}${Backend.teachers}`;
      
      const teacherResponse = await fetch(teacherUrl, {
        method: teacher ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherData)
      });

      if (!teacherResponse.ok) {
        const errorData = await teacherResponse.json();
        throw new Error(errorData.message || 'Failed to save teacher');
      }

      toast.success(teacher ? 'Teacher updated successfully' : 'Teacher created successfully');
      onSuccess();
      onClose();
      
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        subject_specialties: '',
        rating: 0,
        attendance_percentage: 100,
        branch_id: '',
        subjects: []
      });
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast.error(error.message || 'Failed to save teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrogaFormModal
      open={open}
      title={teacher ? 'Edit Teacher' : 'Add New Teacher'}
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={loading}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Full Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </Grid>

        {!teacher && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              type="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              helperText="Minimum 8 characters"
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Subject Specialties"
            name="subject_specialties"
            value={formData.subject_specialties}
            onChange={handleChange}
            helperText="Describe the teacher's subject specializations"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Initial Rating"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            inputProps={{ min: 0, max: 5, step: 0.1 }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Attendance Percentage"
            name="attendance_percentage"
            value={formData.attendance_percentage}
            onChange={handleChange}
            inputProps={{ min: 0, max: 100 }}
          />
        </Grid>

        {branches.length > 0 && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChange}
                label="Branch"
              >
                <MenuItem value="">
                  <em>Select Branch</em>
                </MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </DrogaFormModal>
  );
};

TeacherForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  teacher: PropTypes.object
};

export default TeacherForm;
