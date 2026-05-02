import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
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

const TEACHER_TARGET_TYPES = [
  { value: 'my_classes', label: 'My Classes (All Students)' },
  { value: 'specific_class', label: 'Specific Class/Section' },
  { value: 'specific_students', label: 'Specific Students' }
];

const UploadResourcePage = () => {
  const navigate = useNavigate();
  // Get user from Redux store
  const user = useSelector((state) => state.user?.user);
  const userRoles = useSelector((state) => state.user?.roles || []);

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  // Teacher-specific states
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [availableSections, setAvailableSections] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [isTeacher, setIsTeacher] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'document',
    target_type: 'all',
    target_students: [],
    target_teachers: [],
    target_classes: [],
    target_subject: ''
  });
  const [file, setFile] = useState(null);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    if (!user) return false;

    const adminRoles = ['admin', 'super_admin', 'head_admin', 'ceo', 'staff'];
    const hasAdminRole = userRoles.some(role => {
      const roleName = typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase();
      return adminRoles.includes(roleName);
    });
    const isSuperUser = user.is_superuser || user.is_staff;

    return hasAdminRole || isSuperUser;
  }, [user, userRoles]);

  // Check if user is teacher and set appropriate target_type
  useEffect(() => {
    const checkTeacher = () => {
      if (!user) return;
      const teacherRoles = ['teacher', 'instructor'];
      const hasTeacherRole = userRoles.some(role => {
        const roleName = typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase();
        return teacherRoles.includes(roleName);
      });
      const teacherStatus = hasTeacherRole || user.is_teacher;
      setIsTeacher(teacherStatus);

      // Set default target_type based on role
      if (teacherStatus && !isAdmin) {
        setFormData(prev => ({ ...prev, target_type: 'my_classes' }));
      }
    };
    checkTeacher();
  }, [user, userRoles, isAdmin]);

  // Load dropdown data for admin users
  useEffect(() => {
    const loadAssignmentData = async () => {
      if (!isAdmin) return;

      try {
        const token = await GetToken();

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
      } catch (error) {
        console.error('Error loading assignment data:', error);
      }
    };

    loadAssignmentData();
  }, [isAdmin]);

  // Load teacher assignments
  useEffect(() => {
    const loadTeacherAssignments = async () => {
      if (!isTeacher) return;

      try {
        const token = await GetToken();
        const response = await fetch(`${Backend.api}${Backend.teacherAssignmentsMaterials}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setTeacherAssignments(data.data?.classes || []);
        }
      } catch (error) {
        console.error('Error loading teacher assignments:', error);
      }
    };

    loadTeacherAssignments();
  }, [isTeacher]);

  // Load students when teacher selects class/section/subject
  useEffect(() => {
    const loadTeacherStudents = async () => {
      if (!isTeacher || !selectedClass || !selectedSubject) return;

      try {
        const token = await GetToken();
        let url = `${Backend.api}${Backend.teacherStudentsMaterials}?class_id=${selectedClass}&subject_id=${selectedSubject}`;
        if (selectedSection) {
          url += `&section_id=${selectedSection}`;
        }
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setTeacherStudents(data.data || []);
        }
      } catch (error) {
        console.error('Error loading teacher students:', error);
      }
    };

    loadTeacherStudents();
  }, [isTeacher, selectedClass, selectedSection, selectedSubject]);

  // Handle class selection for teachers
  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedSection('');
    setSelectedSubject('');
    setTeacherStudents([]);

    // Find sections and subjects for this class
    const classData = teacherAssignments.find(c => c.id === classId);
    if (classData) {
      setAvailableSections(classData.sections || []);
      setAvailableSubjects(classData.subjects || []);
    }
  };

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
      } else if (isTeacher) {
        // Teacher upload logic - MUST include subject
        if (!selectedSubject) {
          toast.error('Please select a subject for this resource');
          setLoading(false);
          return;
        }

        data.append('target_type', formData.target_type);
        data.append('target_subject', selectedSubject);

        if (formData.target_type === 'my_classes') {
          // Send all assigned class IDs with their sections
          teacherAssignments.forEach(c => {
            data.append('target_classes', c.id);
            // If section selected, send it; otherwise all sections get the resource
            if (selectedSection) {
              data.append('target_sections', selectedSection);
            } else {
              c.sections.forEach(s => data.append('target_sections', s.id));
            }
          });
        } else if (formData.target_type === 'specific_class') {
          // Send selected class and section
          if (selectedClass) {
            data.append('target_classes', selectedClass);
            if (selectedSection) {
              data.append('target_sections', selectedSection);
            }
          }
        } else if (formData.target_type === 'specific_students') {
          // Send selected students
          formData.target_students.forEach(id => data.append('target_students', id));
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
        // Build detailed success message
        let successMsg = 'Resource uploaded successfully';
        if (isAdmin && formData.target_type) {
          const targetLabels = {
            'all': ' for all users',
            'students': ' for all students',
            'teachers': ' for all teachers',
            'specific_students': ` for ${formData.target_students.length} selected student(s)`,
            'specific_teachers': ` for ${formData.target_teachers.length} selected teacher(s)`,
            'classes': ` for ${formData.target_classes.length} selected class(es)`
          };
          successMsg += targetLabels[formData.target_type] || '';
        }
        toast.success(successMsg);
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
          <Typography variant="h3">{isAdmin ? 'Upload Digital Resource (Admin)' : isTeacher ? 'Upload Resource for Students' : 'Upload Digital Resource'}</Typography>
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

            {/* Target Audience Selection - for Admins and Teachers */}
            {(isAdmin || isTeacher) && (
              <>
                <TextField
                  fullWidth
                  select
                  label="Assign To"
                  value={formData.target_type}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value, target_students: [], target_teachers: [], target_classes: [] })}
                  helperText={isAdmin ? "Select who should have access to this resource" : "Select which students can access this resource"}
                >
                  {isAdmin ? TARGET_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  )) : TEACHER_TARGET_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Teacher - All uploads require: Class → Section → Subject */}
                {isTeacher && formData.target_type !== 'all' && teacherAssignments.length > 0 && (
                  <>
                    {/* Step 1: Select Class */}
                    <TextField
                      fullWidth
                      select
                      required
                      label="Select Class *"
                      value={selectedClass}
                      onChange={(e) => handleClassChange(e.target.value)}
                      helperText="First select the class"
                      sx={{ mt: 2 }}
                    >
                      {teacherAssignments.map((cls) => (
                        <MenuItem key={cls.id} value={cls.id}>
                          Grade {cls.grade}
                        </MenuItem>
                      ))}
                    </TextField>

                    {/* Step 2: Select Section (Optional) */}
                    {selectedClass && availableSections.length > 0 && (
                      <TextField
                        fullWidth
                        select
                        label="Select Section (Optional)"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        helperText="Leave empty for all sections"
                        sx={{ mt: 2 }}
                      >
                        <MenuItem value="">
                          <em>All Sections</em>
                        </MenuItem>
                        {availableSections.map((section) => (
                          <MenuItem key={section.id} value={section.id}>
                            {section.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}

                    {/* Step 3: Select Subject (Filtered by Class/Section) */}
                    {selectedClass && (
                      <TextField
                        fullWidth
                        select
                        required
                        label="Select Subject *"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        helperText="Select subject you teach in this class/section"
                        sx={{ mt: 2 }}
                      >
                        {/* Filter subjects based on selected class and section */}
                        {teacherAssignments
                          .filter(c => c.id === selectedClass)
                          .flatMap(c => c.subjects || [])
                          .filter((s, i, arr) => arr.findIndex(t => t.id === s.id) === i)
                          .map((subject) => (
                            <MenuItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </MenuItem>
                          ))}
                      </TextField>
                    )}
                  </>
                )}

                {/* Teacher - Specific Students Selection */}
                {isTeacher && formData.target_type === 'specific_students' && selectedSubject && teacherStudents.length > 0 && (
                  <Autocomplete
                    multiple
                    options={teacherStudents}
                    getOptionLabel={(option) => `${option.name} (${option.student_id || 'No ID'})`}
                    value={teacherStudents.filter(s => formData.target_students.includes(s.id))}
                    onChange={(e, newValue) => setFormData({ ...formData, target_students: newValue.map(v => v.id) })}
                    sx={{ mt: 2 }}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Students" placeholder="Search and select students" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                  />
                )}

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
    </PageContainer >
  );
};

export default UploadResourcePage;
