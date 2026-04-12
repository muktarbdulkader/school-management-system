import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  OutlinedInput,
  Chip,
  Checkbox,
  ListItemText
} from '@mui/material';
import { IconPlus, IconArrowLeft } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

const AddTeacher = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    branch_id: '',
    class_id: '',
    section_id: '',
    subject_ids: []
  });

  // Dropdown data
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch classes when branch changes
  useEffect(() => {
    if (formData.branch_id) {
      fetchClasses(formData.branch_id);
      // Reset dependent fields
      setFormData(prev => ({ ...prev, class_id: '', section_id: '', subject_ids: [] }));
      setSections([]);
      setSubjects([]);
    }
  }, [formData.branch_id]);

  // Fetch sections when class changes
  useEffect(() => {
    if (formData.class_id) {
      fetchSections(formData.class_id);
      fetchSubjects(formData.class_id);
      // Reset dependent fields
      setFormData(prev => ({ ...prev, section_id: '', subject_ids: [] }));
    }
  }, [formData.class_id]);

  const fetchBranches = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}branches/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Branches data:', data);
        if (data.success && data.data) {
          setBranches(data.data);
        } else if (Array.isArray(data)) {
          setBranches(data);
        } else if (data.results) {
          setBranches(data.results);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    }
  };

  const fetchClasses = async (branchId) => {
    setFetchingData(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}classes/?branch_id=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Classes data:', data);
        if (data.success && data.data) {
          setClasses(data.data);
        } else if (Array.isArray(data)) {
          setClasses(data);
        } else if (data.results) {
          setClasses(data.results);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchSections = async (classId) => {
    setFetchingData(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}sections/?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Sections data:', data);
        if (data.success && data.data) {
          setSections(data.data);
        } else if (Array.isArray(data)) {
          setSections(data);
        } else if (data.results) {
          setSections(data.results);
        }
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchSubjects = async (classId) => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}subjects/?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Subjects data:', data);
        if (data.success && data.data) {
          setSubjects(data.data);
        } else if (Array.isArray(data)) {
          setSubjects(data);
        } else if (data.results) {
          setSubjects(data.results);
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    // For ID fields, ensure value is a string
    const isIdField = ['branch_id', 'class_id', 'section_id'].includes(field);
    setFormData(prev => ({
      ...prev,
      [field]: isIdField && value ? String(value) : value
    }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubjectChange = (event) => {
    const { value } = event.target;
    const subjectIds = typeof value === 'string' ? value.split(',') : value;
    setFormData(prev => ({
      ...prev,
      subject_ids: subjectIds.map(id => String(id))
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.branch_id) {
      newErrors.branch_id = 'Branch is required';
    }

    if (!formData.class_id) {
      newErrors.class_id = 'Class/Grade is required';
    }

    if (!formData.section_id) {
      newErrors.section_id = 'Section is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      console.log('Submitting teacher data:', {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        branch_id: formData.branch_id,
        class_id: formData.class_id,
        section_id: formData.section_id,
        subject_ids: formData.subject_ids
      });

      const response = await fetch(`${Backend.api}teachers/register/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          branch_id: formData.branch_id,
          class_id: formData.class_id,
          section_id: formData.section_id,
          subject_ids: formData.subject_ids
        })
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok && data.success) {
        toast.success('Teacher registered successfully!');
        navigate('/teachers');
      } else {
        toast.error(data.message || 'Failed to register teacher');
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error('Error registering teacher:', error);
      toast.error('Error registering teacher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Add New Teacher">
      <DrogaCard>
        <Box sx={{ p: 2 }}>
          <Button
            startIcon={<IconArrowLeft size={18} />}
            onClick={() => navigate('/teachers')}
            sx={{ mb: 2 }}
          >
            Back to Teachers
          </Button>

          <Typography variant="h4" gutterBottom>
            Add New Teacher
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new teacher account with class and subject assignments
          </Typography>

          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={3}>
                {/* Personal Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                    Personal Information
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name *"
                    value={formData.full_name}
                    onChange={handleChange('full_name')}
                    error={!!errors.full_name}
                    helperText={errors.full_name}
                    placeholder="e.g., John Doe"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    error={!!errors.email}
                    helperText={errors.email}
                    placeholder="e.g., teacher@school.edu"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password *"
                    type="password"
                    value={formData.password}
                    onChange={handleChange('password')}
                    error={!!errors.password}
                    helperText={errors.password || 'Minimum 6 characters'}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    placeholder="e.g., +1234567890"
                  />
                </Grid>

                {/* School Assignment */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    School Assignment
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.branch_id}>
                    <InputLabel>Branch *</InputLabel>
                    <Select
                      value={formData.branch_id}
                      onChange={handleChange('branch_id')}
                      label="Branch *"
                    >
                      <MenuItem value="">
                        <em>Select Branch</em>
                      </MenuItem>
                      {branches.map((branch) => (
                        <MenuItem key={String(branch.id)} value={String(branch.id)}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.branch_id && <FormHelperText>{errors.branch_id}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.class_id}>
                    <InputLabel>Class/Grade *</InputLabel>
                    <Select
                      value={formData.class_id}
                      onChange={handleChange('class_id')}
                      label="Class/Grade *"
                      disabled={!formData.branch_id || fetchingData}
                    >
                      <MenuItem value="">
                        <em>{formData.branch_id ? 'Select Class' : 'Select Branch First'}</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={String(cls.id)} value={String(cls.id)}>
                          Grade {cls.grade}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.class_id && <FormHelperText>{errors.class_id}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.section_id}>
                    <InputLabel>Section *</InputLabel>
                    <Select
                      value={formData.section_id}
                      onChange={handleChange('section_id')}
                      label="Section *"
                      disabled={!formData.class_id || fetchingData}
                    >
                      <MenuItem value="">
                        <em>{formData.class_id ? 'Select Section' : 'Select Class First'}</em>
                      </MenuItem>
                      {sections.map((section) => (
                        <MenuItem key={String(section.id)} value={String(section.id)}>
                          {section.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.section_id && <FormHelperText>{errors.section_id}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Subjects to Teach</InputLabel>
                    <Select
                      multiple
                      value={formData.subject_ids}
                      onChange={handleSubjectChange}
                      input={<OutlinedInput label="Subjects to Teach" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const subject = subjects.find(s => String(s.id) === String(value));
                            return (
                              <Chip key={value} label={subject?.name || value} size="small" />
                            );
                          })}
                        </Box>
                      )}
                      disabled={!formData.class_id}
                    >
                      {subjects.map((subject) => {
                        const subjectId = String(subject.id);
                        return (
                          <MenuItem key={subjectId} value={subjectId}>
                            <Checkbox checked={formData.subject_ids.includes(subjectId)} />
                            <ListItemText primary={subject.name} />
                          </MenuItem>
                        );
                      })}
                    </Select>
                    <FormHelperText>
                      {formData.class_id ? 'Select subjects this teacher will teach' : 'Select Class First'}
                    </FormHelperText>
                  </FormControl>
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/teachers')}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} /> : <IconPlus size={20} />}
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Teacher'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </DrogaCard>
    </PageContainer>
  );
};

export default AddTeacher;
