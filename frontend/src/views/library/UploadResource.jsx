import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  Paper,
  MenuItem,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Autocomplete
} from '@mui/material';
import { IconUpload, IconArrowLeft, IconFile } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const RESOURCE_TYPES = [
  { value: 'document', label: 'Document (PDF, Word, etc.)' },
  { value: 'image', label: 'Image (JPG, PNG, etc.)' },
  { value: 'video', label: 'Video (MP4, etc.)' },
  { value: 'audio', label: 'Audio (MP3, etc.)' },
  { value: 'other', label: 'Other' }
];

const TARGET_TYPES = [
  { value: 'all', label: 'All Users (Students & Teachers)' },
  { value: 'students', label: 'All Students' },
  { value: 'teachers', label: 'All Teachers' },
  { value: 'specific_students', label: 'Specific Students' },
  { value: 'specific_teachers', label: 'Specific Teachers' },
  { value: 'classes', label: 'Specific Classes' }
];

const UploadResourcePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'document',
    target_type: 'all',
    target_students: [],
    target_teachers: [],
    target_classes: []
  });
  const [file, setFile] = useState(null);

  // Check if user is admin and load dropdown data
  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      try {
        const token = await GetToken();

        // Check admin status from user data in localStorage or make an API call
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userRoles = userData.roles || [];
        const adminRoles = ['admin', 'super_admin', 'head_admin', 'ceo', 'staff'];
        const hasAdminRole = userRoles.some(role => adminRoles.includes(role.toLowerCase()));
        const isSuperUser = userData.is_superuser || userData.is_staff;
        const admin = hasAdminRole || isSuperUser;

        setIsAdmin(admin);

        if (admin) {
          // Load classes, students, and teachers for dropdowns
          const [classesRes, studentsRes, teachersRes] = await Promise.all([
            fetch(`${Backend.api}${Backend.resourceClasses}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${Backend.api}${Backend.resourceStudents}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${Backend.api}${Backend.resourceTeachers}`, { headers: { Authorization: `Bearer ${token}` } })
          ]);

          const [classesData, studentsData, teachersData] = await Promise.all([
            classesRes.json(),
            studentsRes.json(),
            teachersRes.json()
          ]);

          if (classesData.success) setClasses(classesData.data || []);
          if (studentsData.success) setStudents(studentsData.data || []);
          if (teachersData.success) setTeachers(teachersData.data || []);
        }
      } catch (error) {
        console.error('Error loading assignment data:', error);
      }
    };

    checkAdminAndLoadData();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('resource_type', formData.resource_type);
      data.append('file', file);

      // Add assignment data for admin users
      if (isAdmin) {
        data.append('target_type', formData.target_type);

        if (formData.target_type === 'specific_students') {
          formData.target_students.forEach(id => data.append('target_students', id));
        } else if (formData.target_type === 'specific_teachers') {
          formData.target_teachers.forEach(id => data.append('target_teachers', id));
        } else if (formData.target_type === 'classes') {
          formData.target_classes.forEach(id => data.append('target_classes', id));
        }
      }

      const response = await fetch(`${Backend.api}${Backend.digitalResources}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success('Resource uploaded successfully');
        navigate('/home');
      } else {
        toast.error(result.message || 'Failed to upload resource');
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Upload Resource">
      <DrogaCard>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate('/home')}>
            <IconArrowLeft size={24} />
          </IconButton>
          <Typography variant="h3">Upload Digital Resource</Typography>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter resource title"
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter resource description (optional)"
              multiline
              rows={3}
            />

            <TextField
              fullWidth
              select
              label="Resource Type *"
              value={formData.resource_type}
              onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
            >
              {RESOURCE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            {/* Target Audience Selection - Only for Admins */}
            {isAdmin && (
              <>
                <TextField
                  fullWidth
                  select
                  label="Assign To"
                  value={formData.target_type}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value, target_students: [], target_teachers: [], target_classes: [] })}
                  helperText="Select who should have access to this resource"
                >
                  {TARGET_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Specific Students Selection */}
                {formData.target_type === 'specific_students' && (
                  <Autocomplete
                    multiple
                    options={students}
                    getOptionLabel={(option) => `${option.name} (${option.class})`}
                    value={students.filter(s => formData.target_students.includes(s.id))}
                    onChange={(e, newValue) => setFormData({ ...formData, target_students: newValue.map(v => v.id) })}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Students" placeholder="Search and select students" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={`${option.name} (${option.class})`}
                          size="small"
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                  />
                )}

                {/* Specific Teachers Selection */}
                {formData.target_type === 'specific_teachers' && (
                  <Autocomplete
                    multiple
                    options={teachers}
                    getOptionLabel={(option) => option.name}
                    value={teachers.filter(t => formData.target_teachers.includes(t.id))}
                    onChange={(e, newValue) => setFormData({ ...formData, target_teachers: newValue.map(v => v.id) })}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Teachers" placeholder="Search and select teachers" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option.name} size="small" {...getTagProps({ index })} key={option.id} />
                      ))
                    }
                  />
                )}

                {/* Specific Classes Selection */}
                {formData.target_type === 'classes' && (
                  <Autocomplete
                    multiple
                    options={classes}
                    getOptionLabel={(option) => option.grade}
                    value={classes.filter(c => formData.target_classes.includes(c.id))}
                    onChange={(e, newValue) => setFormData({ ...formData, target_classes: newValue.map(v => v.id) })}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Classes" placeholder="Search and select classes" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option.grade} size="small" {...getTagProps({ index })} key={option.id} />
                      ))
                    }
                  />
                )}

                <Divider sx={{ my: 2 }} />
              </>
            )}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                File * ({file ? file.name : 'No file selected'})
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<IconFile size={18} />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                Select File
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={loading ? <ActivityIndicator size={18} /> : <IconUpload size={18} />}
                onClick={handleSubmit}
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Uploading...' : 'Upload Resource'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </DrogaCard>
    </PageContainer>
  );
};

export default UploadResourcePage;
