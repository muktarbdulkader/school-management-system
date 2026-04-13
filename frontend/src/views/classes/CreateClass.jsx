import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Grid,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Divider,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  FormHelperText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconPlus,
  IconSchool,
  IconBooks,
  IconSection,
  IconCheck,
  IconInfoCircle,
  IconTrash,
  IconAlertCircle
} from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const steps = ['Select Term', 'Create Class', 'Add Sections', 'Assign Subjects', 'Assign Teachers', 'Review & Create'];

function CreateClass() {
  const navigate = useNavigate();

  // Get user data from Redux store
  const user = useSelector((state) => state?.user?.user);
  const userBranch = user?.branch || user?.branch_id || null;
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(userBranch || '');

  // Form state
  const [formData, setFormData] = useState({
    branchId: userBranch || '',
    termId: '',
    academicYear: '',
    gradeNumber: '',
    sectionsCount: '',
    customSubjects: [],
    teacherAssignments: []
  });

  // Available data from API
  const [availableTerms, setAvailableTerms] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [globalSubjectsLoading, setGlobalSubjectsLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isGradeAvailable, setIsGradeAvailable] = useState(true);

  // Subject assignment state
  const [selectedGlobalSubject, setSelectedGlobalSubject] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newBookCode, setNewBookCode] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  // Generated sections preview
  const [generatedSections, setGeneratedSections] = useState([]);

  // Check if class already exists from database
  const checkDuplicateClassInDatabase = async (gradeNumber, branchId) => {
    if (!gradeNumber || !branchId) return false;

    setCheckingDuplicate(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}classes/check-duplicate/?grade=${gradeNumber}&branch_id=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return data.exists || false;
      }

      // Fallback: Check locally fetched data
      const exists = availableClasses.some(c =>
        String(c.grade) === String(gradeNumber) &&
        String(c.branch) === String(branchId)
      );
      return exists;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      // Fallback to local check
      const exists = availableClasses.some(c =>
        String(c.grade) === String(gradeNumber) &&
        String(c.branch) === String(branchId)
      );
      return exists;
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Real-time check when grade number or branch changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.gradeNumber && formData.branchId) {
        const exists = await checkDuplicateClassInDatabase(formData.gradeNumber, formData.branchId);
        setIsGradeAvailable(!exists);

        if (exists) {
          setErrors(prev => ({
            ...prev,
            gradeNumber: `❌ Grade ${formData.gradeNumber} already exists in this branch! Please choose a different grade.`
          }));
        } else {
          setErrors(prev => ({ ...prev, gradeNumber: null }));
        }
      } else {
        setIsGradeAvailable(true);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.gradeNumber, formData.branchId]);

  // Validate grade number format
  const validateGradeFormat = (value) => {
    if (!value) return { valid: false, message: 'Grade number is required' };
    if (/^0+\d+$/.test(value)) {
      return { valid: false, message: 'Grade cannot have leading zeros (e.g., "01"). Use "1" instead.' };
    }
    if (/^-/.test(value)) {
      return { valid: false, message: 'Grade cannot be negative' };
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return { valid: false, message: 'Please enter a valid number' };
    }
    if (num < 1 || num > 12) {
      return { valid: false, message: 'Grade must be between 1 and 12' };
    }
    return { valid: true };
  };

  // Handle input changes
  const handleChange = (field) => (event) => {
    const value = event.target.value;

    if (field === 'gradeNumber') {
      const validation = validateGradeFormat(value);
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, gradeNumber: validation.message }));
        setFormData(prev => ({ ...prev, [field]: value }));
        return;
      }

      // Remove leading zeros
      const correctedValue = value.replace(/^0+/, '');
      setFormData(prev => ({ ...prev, [field]: correctedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    }

    // Auto-generate sections when sectionsCount changes
    if (field === 'sectionsCount' && value) {
      const count = parseInt(value, 10);
      if (count > 0 && count <= 26) {
        generateSectionsPreview(count);
      } else {
        setGeneratedSections([]);
      }
    }
  };

  // Generate unique subject code
  const generateSubjectCode = (subjectName, gradeNumber) => {
    const baseCode = subjectName.toUpperCase().replace(/\s+/g, '').substring(0, 6);
    const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
    return `${baseCode}_G${gradeNumber}_${timestamp}`;
  };

  // Check if subject already exists
  const isSubjectDuplicate = (subjectName) => {
    const existingSubjects = formData.customSubjects || [];
    return existingSubjects.some(
      s => s.name.toLowerCase().trim() === subjectName.toLowerCase().trim()
    );
  };

  // Validate subject code format
  const validateSubjectCode = (code) => {
    if (!code) return { valid: true };
    if (/\b0+\d+\b/.test(code)) {
      return { valid: false, message: 'Subject code cannot have leading zeros (e.g., "01"). Use "1" instead.' };
    }
    if (/-\d/.test(code)) {
      return { valid: false, message: 'Subject code cannot contain negative numbers' };
    }
    return { valid: true };
  };

  // Handle adding custom subject
  const handleAddCustomSubject = () => {
    const subjectName = selectedGlobalSubject
      ? globalSubjects.find(s => s.id === selectedGlobalSubject)?.name
      : null;

    if (!subjectName) {
      toast.error('Please select a subject from the dropdown');
      return;
    }

    if (isSubjectDuplicate(subjectName)) {
      toast.error(`❌ Subject "${subjectName}" is already assigned to this class`);
      return;
    }

    const codeValidation = validateSubjectCode(newSubjectCode);
    if (!codeValidation.valid) {
      toast.error(codeValidation.message);
      return;
    }

    const code = newSubjectCode.trim() || generateSubjectCode(subjectName, formData.gradeNumber);

    setFormData(prev => ({
      ...prev,
      customSubjects: [
        ...(prev.customSubjects || []),
        {
          id: Date.now(),
          name: subjectName,
          selected: true,
          code: code,
          book_code: newBookCode.trim(),
          description: `Subject for Grade ${formData.gradeNumber}`,
          assignment_day: '',
          global_subject_id: selectedGlobalSubject,
          selectedTeacher: '',
          selectedSection: 'all'
        }
      ]
    }));

    // Clear input fields
    setSelectedGlobalSubject('');
    setNewSubjectCode('');
    setNewBookCode('');

    toast.success(`✓ Subject "${subjectName}" added successfully`);
  };

  // Handle custom subject field change
  const handleCustomSubjectChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.customSubjects || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customSubjects: updated };
    });
  };

  // Handle custom subject checkbox toggle
  const handleCustomSubjectToggle = (index, checked) => {
    setFormData(prev => {
      const updated = [...(prev.customSubjects || [])];
      updated[index] = { ...updated[index], selected: checked };
      return { ...prev, customSubjects: updated };
    });
  };

  // Remove custom subject
  const removeCustomSubject = (index) => {
    const subjectName = formData.customSubjects[index].name;
    setFormData(prev => ({
      ...prev,
      customSubjects: prev.customSubjects.filter((_, i) => i !== index)
    }));
    toast.info(`Removed "${subjectName}" from subjects list`);
  };

  // Add teacher assignment (supports multiple sections)
  const addTeacherAssignment = (subjectId, teacherId, sectionIds = []) => {
    const newAssignments = [];

    sectionIds.forEach(sectionId => {
      // Check if assignment already exists
      const exists = formData.teacherAssignments.some(
        ta => ta.subjectId === subjectId && ta.teacherId === teacherId && ta.sectionId === sectionId
      );

      if (!exists) {
        newAssignments.push({
          id: Date.now() + Math.random(),
          subjectId,
          teacherId,
          sectionId,
          isPrimary: true
        });
      }
    });

    if (newAssignments.length === 0) {
      toast.warning('This teacher is already assigned to the selected section(s)');
      return;
    }

    setFormData(prev => ({
      ...prev,
      teacherAssignments: [...(prev.teacherAssignments || []), ...newAssignments]
    }));

    toast.success(`Teacher assigned to ${sectionIds.length} section(s)`);
  };

  // Remove teacher assignment
  const removeTeacherAssignment = (id) => {
    setFormData(prev => ({
      ...prev,
      teacherAssignments: prev.teacherAssignments.filter(ta => ta.id !== id)
    }));
  };

  // Generate section names preview
  const generateSectionsPreview = (count) => {
    const grade = formData.gradeNumber || '?';
    const sections = [];
    for (let i = 0; i < count; i++) {
      const letter = String.fromCharCode(65 + i);
      sections.push(`${grade}${letter}`);
    }
    setGeneratedSections(sections);
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};

    if (activeStep === 0) {
      if (!formData.branchId) {
        newErrors.branchId = 'Please select a branch';
      }
      if (!formData.termId) {
        newErrors.termId = 'Please select a term';
      }
    }

    if (activeStep === 1) {
      if (!formData.gradeNumber) {
        newErrors.gradeNumber = 'Please enter a grade number';
      } else if (!isGradeAvailable) {
        newErrors.gradeNumber = `❌ Grade ${formData.gradeNumber} already exists in this branch! Please choose a different grade.`;
      } else {
        const validation = validateGradeFormat(formData.gradeNumber);
        if (!validation.valid) {
          newErrors.gradeNumber = validation.message;
        }
      }
    }

    if (activeStep === 2) {
      if (!formData.sectionsCount || formData.sectionsCount < 1 || formData.sectionsCount > 26) {
        newErrors.sectionsCount = 'Please enter a valid number of sections (1-26)';
      }
    }

    if (activeStep === 3) {
      const selectedSubjects = formData.customSubjects?.filter(s => s.selected) || [];
      if (selectedSubjects.length === 0) {
        newErrors.subjects = 'Please add and select at least one subject';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch data on mount
  useEffect(() => {
    fetchBranches();
    fetchGlobalSubjects();
  }, []);

  useEffect(() => {
    if (formData.branchId) {
      fetchTerms(formData.branchId);
      fetchClasses(formData.branchId);
      fetchTeachers(formData.branchId);
    }
  }, [formData.branchId]);

  const fetchBranches = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}branches/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setBranches(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchTerms = async (branchId) => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}terms/?branch_id=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAvailableTerms(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      toast.error('Failed to load terms');
    }
  };

  const fetchClasses = async (branchId) => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}classes/?branch_id=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAvailableClasses(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTeachers = async (branchId) => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}teachers/?branch_id=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAvailableTeachers(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    }
  };

  const fetchGlobalSubjects = async () => {
    setGlobalSubjectsLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}global_subjects/dropdown/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGlobalSubjects(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching global subjects:', error);
    } finally {
      setGlobalSubjectsLoading(false);
    }
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === 2 && formData.sectionsCount) {
        generateSectionsPreview(parseInt(formData.sectionsCount, 10));
      }
      setActiveStep(prev => prev + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Final duplicate check before submission
    if (!isGradeAvailable) {
      toast.error(`❌ Grade ${formData.gradeNumber} already exists in this branch! Cannot create duplicate class.`);
      setActiveStep(1);
      return;
    }

    if (!validateStep()) return;

    setLoading(true);
    try {
      const token = await GetToken();
      const selectedSubjects = formData.customSubjects?.filter(s => s.selected) || [];

      // Step 1: Create the class with sections
      const classPayload = {
        grade_number: parseInt(formData.gradeNumber, 10),
        sections_count: parseInt(formData.sectionsCount, 10),
        branch_id: formData.branchId,
        term_id: formData.termId
      };

      const classResponse = await fetch(`${Backend.api}classes/create-with-sections/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classPayload)
      });

      const classData = await classResponse.json();
      if (!classData.success) {
        if (classData.message?.includes('already exists')) {
          toast.error(`❌ Grade ${formData.gradeNumber} already exists in this branch!`);
          setActiveStep(1);
          setIsGradeAvailable(false);
        } else {
          toast.error(classData.message || 'Failed to create class');
        }
        setLoading(false);
        return;
      }

      const newClassId = classData.data?.class_id || classData.data?.id;

      // Step 2: Create subjects and link to class
      for (const subject of selectedSubjects) {
        const subjectPayload = {
          name: subject.name,
          code: subject.code,
          description: subject.description,
          assignment_day: subject.assignment_day || null,
          branch: formData.branchId,
          class_grade: newClassId,
          global_subject: subject.global_subject_id
        };

        const subjectResponse = await fetch(`${Backend.api}subjects/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subjectPayload)
        });

        const subjectData = await subjectResponse.json();
        if (!subjectData.success) {
          console.error('Subject creation failed:', subjectData);
          toast.error(`Failed to create subject "${subject.name}": ${subjectData.message || JSON.stringify(subjectData.errors)}`);
          continue;
        }
        if (subjectData.data) {
          const newSubjectId = subjectData.data.id;

          // Step 3: Create teacher assignments
          const subjectAssignments = formData.teacherAssignments.filter(
            ta => ta.subjectId === subject.id
          );

          for (const assignment of subjectAssignments) {
            let sectionId = null;
            if (assignment.sectionId && assignment.sectionId !== 'all') {
              const sectionIndex = parseInt(assignment.sectionId.replace('section_', ''), 10);
              if (classData.data?.sections?.[sectionIndex]) {
                sectionId = classData.data.sections[sectionIndex].id;
              }
            }

            const assignmentPayload = {
              teacher: assignment.teacherId,
              class_fk: newClassId,
              section: sectionId,
              subject: newSubjectId,
              term: formData.termId,
              is_primary: true,
              is_active: true
            };

            await fetch(`${Backend.api}teacher_assignments/`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(assignmentPayload)
            });
          }
        }
      }

      toast.success('✓ Class structure created successfully!');
      navigate('/classes');
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Error creating class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Term
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose the academic term for this class setup
            </Typography>

            <FormControl fullWidth sx={{ maxWidth: 400, mb: 3 }} error={!!errors.branchId}>
              <InputLabel>Branch *</InputLabel>
              <Select
                value={formData.branchId}
                onChange={handleChange('branchId')}
                label="Branch *"
              >
                <MenuItem value="">Select Branch</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.branchId && <FormHelperText error>{errors.branchId}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth sx={{ maxWidth: 400 }} error={!!errors.termId}>
              <InputLabel>Term *</InputLabel>
              <Select
                value={formData.termId}
                onChange={(e) => {
                  const selectedTerm = availableTerms.find(t => t.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    termId: e.target.value,
                    academicYear: selectedTerm?.academic_year || ''
                  }));
                }}
                label="Term *"
                disabled={!formData.branchId || availableTerms.length === 0}
              >
                <MenuItem value="">
                  {!formData.branchId ? 'Select Branch First' : 'Select Term'}
                </MenuItem>
                {availableTerms.map((term) => (
                  <MenuItem key={term.id} value={term.id}>
                    {term.name} ({term.academic_year})
                  </MenuItem>
                ))}
              </Select>
              {errors.termId && <FormHelperText error>{errors.termId}</FormHelperText>}
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Create Class
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the grade number for the class
            </Typography>

            <TextField
              fullWidth
              label="Grade Number"
              type="number"
              value={formData.gradeNumber}
              onChange={handleChange('gradeNumber')}
              error={!!errors.gradeNumber}
              helperText={errors.gradeNumber || 'Enter a number between 1 and 12'}
              sx={{ maxWidth: 400, mb: 3 }}
              InputProps={{
                startAdornment: <IconSchool size={20} style={{ marginRight: 8, color: '#666' }} />
              }}
            />

            {checkingDuplicate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ActivityIndicator size={16} />
                <Typography variant="caption" color="text.secondary">
                  Checking database for existing classes...
                </Typography>
              </Box>
            )}

            {!checkingDuplicate && formData.gradeNumber && formData.branchId && (
              <Alert
                severity={isGradeAvailable ? "success" : "error"}
                sx={{ mt: 2 }}
                icon={isGradeAvailable ? <IconCheck /> : <IconAlertCircle />}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {isGradeAvailable
                    ? `✓ Grade ${formData.gradeNumber} is available for this branch`
                    : `❌ Grade ${formData.gradeNumber} already exists in this branch!`}
                </Typography>
                {!isGradeAvailable && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Please choose a different grade number. The following grades are already taken:
                  </Typography>
                )}
              </Alert>
            )}

            {availableClasses.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Existing classes in this branch:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                  {availableClasses.map((cls) => (
                    <Chip
                      key={cls.id}
                      label={`Grade ${cls.grade}`}
                      color={String(cls.grade) === String(formData.gradeNumber) ? "error" : "default"}
                      size="small"
                      variant={String(cls.grade) === String(formData.gradeNumber) ? "filled" : "outlined"}
                    />
                  ))}
                </Stack>
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Add Sections
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the number of sections for Grade {formData.gradeNumber}
            </Typography>

            <TextField
              fullWidth
              label="Number of Sections"
              type="number"
              value={formData.sectionsCount}
              onChange={handleChange('sectionsCount')}
              error={!!errors.sectionsCount}
              helperText={errors.sectionsCount || 'Enter a number between 1 and 26'}
              sx={{ maxWidth: 400, mb: 3 }}
              InputProps={{
                startAdornment: <IconSection size={20} style={{ marginRight: 8, color: '#666' }} />
              }}
            />

            {generatedSections.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview - Sections to be created:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {generatedSections.map((section, index) => (
                      <Chip key={index} label={section} color="primary" variant="outlined" icon={<IconCheck size={16} />} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Assign Subjects
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select subjects from the global list for Grade {formData.gradeNumber}
            </Typography>

            <Stack spacing={2}>
              {formData.customSubjects?.map((subject, index) => (
                <Card key={subject.id} variant="outlined" sx={{ bgcolor: subject.selected ? 'background.paper' : 'action.hover' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Checkbox
                        checked={subject.selected}
                        onChange={(e) => handleCustomSubjectToggle(index, e.target.checked)}
                      />
                      <Box flex={1}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {subject.name}
                          </Typography>
                          <Chip label={subject.code} size="small" color="primary" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            fullWidth
                            label="Description"
                            value={subject.description}
                            onChange={(e) => handleCustomSubjectChange(index, 'description', e.target.value)}
                            size="small"
                          />
                          <TextField
                            select
                            label="Assignment Day"
                            value={subject.assignment_day}
                            onChange={(e) => handleCustomSubjectChange(index, 'assignment_day', e.target.value)}
                            size="small"
                            sx={{ minWidth: 150 }}
                          >
                            <MenuItem value="">None</MenuItem>
                            <MenuItem value="Monday">Monday</MenuItem>
                            <MenuItem value="Tuesday">Tuesday</MenuItem>
                            <MenuItem value="Wednesday">Wednesday</MenuItem>
                            <MenuItem value="Thursday">Thursday</MenuItem>
                            <MenuItem value="Friday">Friday</MenuItem>
                          </TextField>
                        </Stack>
                      </Box>
                      <IconButton onClick={() => removeCustomSubject(index)} color="error" size="small">
                        <IconTrash size={18} />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Select Global Subject *</InputLabel>
                      <Select
                        value={selectedGlobalSubject}
                        onChange={(e) => setSelectedGlobalSubject(e.target.value)}
                        label="Select Global Subject *"
                        disabled={globalSubjectsLoading}
                      >
                        <MenuItem value="">-- Select a Subject --</MenuItem>
                        {globalSubjects.map((subject) => (
                          <MenuItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Stack direction="row" spacing={2}>
                      <TextField
                        fullWidth
                        label="Subject Code (Optional)"
                        value={newSubjectCode}
                        onChange={(e) => setNewSubjectCode(e.target.value)}
                        size="small"
                        helperText="Auto-generated if empty"
                      />
                      <TextField
                        fullWidth
                        label="Book Code / Reference"
                        value={newBookCode}
                        onChange={(e) => setNewBookCode(e.target.value)}
                        size="small"
                      />
                    </Stack>

                    <Button
                      variant="contained"
                      startIcon={<IconPlus size={18} />}
                      onClick={handleAddCustomSubject}
                      disabled={!selectedGlobalSubject}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Add Subject
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {errors.subjects && <Alert severity="error">{errors.subjects}</Alert>}

              <Alert severity="info" icon={<IconInfoCircle size={18} />}>
                <Typography variant="body2">
                  <strong>Note:</strong> Subjects can be customized with specific codes and book references for this class.
                  Duplicate subjects are automatically prevented.
                </Typography>
              </Alert>
            </Stack>
          </Box>
        );

      case 4: {
        const sectionOptions = [
          { id: 'all', label: 'All Sections' },
          ...generatedSections.map((sectionName, index) => ({
            id: `section_${index}`,
            label: sectionName
          }))
        ];

        const selectedSubjects = formData.customSubjects?.filter(s => s.selected) || [];

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Assign Teachers
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Assign teachers to subjects and sections
            </Typography>

            {selectedSubjects.length === 0 ? (
              <Alert severity="warning">Please add subjects first in the previous step.</Alert>
            ) : (
              <Stack spacing={3}>
                {selectedSubjects.map((subject, index) => (
                  <Card key={subject.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {subject.name}
                      </Typography>

                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Teacher</InputLabel>
                          <Select
                            value={subject.selectedTeacher || ''}
                            onChange={(e) => handleCustomSubjectChange(index, 'selectedTeacher', e.target.value)}
                            label="Teacher"
                          >
                            <MenuItem value="">Select Teacher</MenuItem>
                            {availableTeachers.map((teacher) => (
                              <MenuItem key={teacher.id} value={teacher.id}>
                                {teacher.user_details?.full_name || teacher.user?.full_name || 'Unknown'}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small">
                          <InputLabel>Sections</InputLabel>
                          <Select
                            multiple
                            value={subject.selectedSections || []}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Handle "All Sections" selection
                              if (value.includes('all')) {
                                // If "all" is selected, select all section IDs
                                const allSectionIds = sectionOptions
                                  .filter(opt => opt.id !== 'all')
                                  .map(opt => opt.id);
                                handleCustomSubjectChange(index, 'selectedSections', allSectionIds);
                              } else {
                                handleCustomSubjectChange(index, 'selectedSections', value);
                              }
                            }}
                            label="Sections"
                            renderValue={(selected) => {
                              if (selected.length === 0) return 'Select Sections';
                              if (selected.length === sectionOptions.length - 1) return 'All Sections';
                              const labels = selected.map(id =>
                                sectionOptions.find(s => s.id === id)?.label || id
                              );
                              return labels.join(', ');
                            }}
                          >
                            {sectionOptions.map((option) => (
                              <MenuItem key={option.id} value={option.id}>
                                <Checkbox
                                  checked={
                                    option.id === 'all'
                                      ? (subject.selectedSections?.length || 0) === sectionOptions.length - 1
                                      : subject.selectedSections?.includes(option.id) || false
                                  }
                                />
                                <ListItemText primary={option.label} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            if (subject.selectedTeacher && subject.selectedSections?.length > 0) {
                              addTeacherAssignment(subject.id, subject.selectedTeacher, subject.selectedSections);
                              handleCustomSubjectChange(index, 'selectedTeacher', '');
                              handleCustomSubjectChange(index, 'selectedSections', []);
                            }
                          }}
                          disabled={!subject.selectedTeacher || !(subject.selectedSections?.length > 0)}
                          startIcon={<IconPlus size={16} />}
                        >
                          Assign
                        </Button>
                      </Stack>

                      {/* Display existing assignments */}
                      {formData.teacherAssignments
                        .filter(ta => ta.subjectId === subject.id)
                        .map((ta) => {
                          const teacher = availableTeachers.find(t => t.id === ta.teacherId);
                          const sectionLabel = ta.sectionId === 'all'
                            ? 'All Sections'
                            : sectionOptions.find(s => s.id === ta.sectionId)?.label || 'Unknown';
                          return (
                            <Chip
                              key={ta.id}
                              label={`${teacher?.user_details?.full_name || 'Unknown'} (${sectionLabel})`}
                              onDelete={() => removeTeacherAssignment(ta.id)}
                              color="primary"
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          );
                        })}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        );
      }

      case 5: {
        const selectedSubjects = formData.customSubjects?.filter(s => s.selected) || [];
        const selectedTerm = availableTerms.find(t => t.id === formData.termId);
        const selectedBranch = branches.find(b => b.id === formData.branchId);

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Create
            </Typography>

            {!isGradeAvailable && (
              <Alert severity="error" icon={<IconAlertCircle />} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  ❌ Cannot create this class - Grade {formData.gradeNumber} already exists in the database!
                </Typography>
                <Typography variant="body2">
                  Please go back and select a different grade number.
                </Typography>
              </Alert>
            )}

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Term</Typography>
                    <Typography variant="h6">{selectedTerm?.name} ({formData.academicYear})</Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Branch</Typography>
                    <Typography variant="h6">{selectedBranch?.name}</Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Class</Typography>
                    <Typography variant="h6" color={!isGradeAvailable ? "error" : "primary"}>
                      Grade {formData.gradeNumber}
                      {!isGradeAvailable && " ❌ (Already Exists in Database)"}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Sections ({formData.sectionsCount})</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      {generatedSections.map((section, index) => (
                        <Chip key={index} label={section} size="small" />
                      ))}
                    </Stack>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Subjects ({selectedSubjects.length})</Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {selectedSubjects.map((subject) => (
                        <Stack key={subject.id} direction="row" spacing={1} alignItems="center">
                          <Chip label={subject.name} color="primary" size="small" />
                          <Chip label={subject.code} size="small" variant="outlined" />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Teacher Assignments ({formData.teacherAssignments.length})</Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {formData.teacherAssignments.map((ta) => {
                        const subject = selectedSubjects.find(s => s.id === ta.subjectId);
                        const teacher = availableTeachers.find(t => t.id === ta.teacherId);
                        const sectionLabel = ta.sectionId === 'all' ? 'All Sections' : '';
                        return (
                          <Typography key={ta.id} variant="body2">
                            • {subject?.name} → {teacher?.user_details?.full_name || 'Unknown'} {sectionLabel}
                          </Typography>
                        );
                      })}
                    </Stack>
                  </Box>

                  {isGradeAvailable && (
                    <Alert severity="success" icon={<IconCheck size={18} />}>
                      ✓ Grade {formData.gradeNumber} is available. Ready to create the class!
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        );
      }

      default:
        return null;
    }
  };

  return (
    <PageContainer title="Create Class">
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={18} />}
            onClick={() => navigate('/classes')}
          >
            Back
          </Button>
          <Typography variant="h4">Create New Class</Typography>
        </Stack>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <DrogaCard>
          <CardContent>
            {renderStepContent()}

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
              {activeStep > 0 && (
                <Button variant="outlined" onClick={handleBack} disabled={loading}>
                  Back
                </Button>
              )}

              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading || (activeStep === 1 && (errors.gradeNumber || !formData.gradeNumber))}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                  disabled={loading || !isGradeAvailable}
                  startIcon={loading ? <ActivityIndicator size={16} /> : <IconPlus size={18} />}
                >
                  {loading ? 'Creating...' : 'Create Class'}
                </Button>
              )}
            </Stack>
          </CardContent>
        </DrogaCard>
      </Box>
    </PageContainer>
  );
}

export default CreateClass; 