import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Divider,
  Alert,
  Card,
  CardContent,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  useMediaQuery,
  useTheme,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconPlus,
  IconSchool,
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

// Constants
const MAX_SECTIONS = 26;
const MIN_GRADE = 1;
const MAX_GRADE = 12;
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function CreateClass() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get user data from Redux store
  const user = useSelector((state) => state?.user?.user);
  const userBranch = user?.branch || user?.branch_id || null;

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [availableTerms, setAvailableTerms] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [globalSubjectsLoading, setGlobalSubjectsLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isGradeAvailable, setIsGradeAvailable] = useState(true);
  const [errors, setErrors] = useState({});
  const [generatedSections, setGeneratedSections] = useState([]);

  // Subject assignment state
  const [selectedGlobalSubject, setSelectedGlobalSubject] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newBookCode, setNewBookCode] = useState('');

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

  // Debounce ref for duplicate checking
  const duplicateCheckTimeout = useRef(null);

  // Helper Functions
  const validateGradeFormat = useCallback((value) => {
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
    if (num < MIN_GRADE || num > MAX_GRADE) {
      return { valid: false, message: `Grade must be between ${MIN_GRADE} and ${MAX_GRADE}` };
    }
    return { valid: true, value: num };
  }, []);

  const generateSubjectCode = useCallback((subjectName, gradeNumber) => {
    const baseCode = subjectName.toUpperCase().replace(/\s+/g, '').substring(0, 6);
    const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
    return `${baseCode}_G${gradeNumber}_${timestamp}`;
  }, []);

  const validateSubjectCode = useCallback((code) => {
    if (!code) return { valid: true };
    if (/\b0+\d+\b/.test(code)) {
      return { valid: false, message: 'Subject code cannot have leading zeros (e.g., "01"). Use "1" instead.' };
    }
    if (/-\d/.test(code)) {
      return { valid: false, message: 'Subject code cannot contain negative numbers' };
    }
    return { valid: true };
  }, []);

  const generateSectionsPreview = useCallback((count, gradeNumber) => {
    const grade = gradeNumber || '?';
    const sections = [];
    for (let i = 0; i < Math.min(count, MAX_SECTIONS); i++) {
      const letter = String.fromCharCode(65 + i);
      sections.push(`${grade}${letter}`);
    }
    return sections;
  }, []);

  // API Functions
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
      toast.error('Failed to load branches');
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
      toast.error('Failed to load global subjects');
    } finally {
      setGlobalSubjectsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}subjects/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAvailableSubjects(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const checkDuplicateClassInDatabase = useCallback(async (gradeNumber, branchId) => {
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
      const exists = availableClasses.some(c =>
        String(c.grade) === String(gradeNumber) &&
        String(c.branch) === String(branchId)
      );
      return exists;
    } finally {
      setCheckingDuplicate(false);
    }
  }, [availableClasses]);

  // Effects
  useEffect(() => {
    fetchBranches();
    fetchGlobalSubjects();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (formData.branchId) {
      fetchTerms(formData.branchId);
      fetchClasses(formData.branchId);
      fetchTeachers(formData.branchId);
    }
  }, [formData.branchId]);

  // Real-time duplicate check with debounce
  useEffect(() => {
    if (duplicateCheckTimeout.current) {
      clearTimeout(duplicateCheckTimeout.current);
    }

    if (formData.gradeNumber && formData.branchId) {
      duplicateCheckTimeout.current = setTimeout(async () => {
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
      }, 500);
    } else {
      setIsGradeAvailable(true);
    }

    return () => {
      if (duplicateCheckTimeout.current) {
        clearTimeout(duplicateCheckTimeout.current);
      }
    };
  }, [formData.gradeNumber, formData.branchId, checkDuplicateClassInDatabase]);

  // Generate sections preview when sectionsCount changes
  useEffect(() => {
    if (formData.sectionsCount && formData.gradeNumber) {
      const count = parseInt(formData.sectionsCount, 10);
      if (count > 0 && count <= MAX_SECTIONS) {
        const sections = generateSectionsPreview(count, formData.gradeNumber);
        setGeneratedSections(sections);
      } else {
        setGeneratedSections([]);
      }
    } else {
      setGeneratedSections([]);
    }
  }, [formData.sectionsCount, formData.gradeNumber, generateSectionsPreview]);

  // Event Handlers
  const handleChange = useCallback((field) => (event) => {
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
      setErrors(prev => ({ ...prev, gradeNumber: null }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    }
  }, [validateGradeFormat, errors]);

  const handleTermChange = useCallback((event) => {
    const termId = event.target.value;
    const selectedTerm = availableTerms.find(t => t.id === termId);
    setFormData(prev => ({
      ...prev,
      termId: termId,
      academicYear: selectedTerm?.academic_year || ''
    }));
    if (errors.termId) {
      setErrors(prev => ({ ...prev, termId: null }));
    }
  }, [availableTerms, errors.termId]);

  const handleAddCustomSubject = useCallback(() => {
    const globalSubject = globalSubjects.find(s => s.id === selectedGlobalSubject);
    const subjectName = globalSubject?.name;

    if (!subjectName) {
      toast.error('Please select a subject from the dropdown');
      return;
    }

    // Check for duplicate subject name in current class
    const existingSubjects = formData.customSubjects || [];
    if (existingSubjects.some(s => s.name.toLowerCase().trim() === subjectName.toLowerCase().trim())) {
      toast.error(`❌ Subject "${subjectName}" is already added to this class`);
      return;
    }

    const codeValidation = validateSubjectCode(newSubjectCode);
    if (!codeValidation.valid) {
      toast.error(codeValidation.message);
      return;
    }

    // Generate code if not provided
    const subjectCode = newSubjectCode.trim() || generateSubjectCode(subjectName, formData.gradeNumber);

    setFormData(prev => ({
      ...prev,
      customSubjects: [
        ...(prev.customSubjects || []),
        {
          id: Date.now(),
          name: subjectName,
          selected: true,
          code: subjectCode,
          book_code: newBookCode.trim(),
          description: `Subject for Grade ${formData.gradeNumber}`,
          assignment_day: '',
          global_subject_id: selectedGlobalSubject,
          selectedTeacher: '',
          selectedSections: []
        }
      ]
    }));

    // Clear input fields
    setSelectedGlobalSubject('');
    setNewSubjectCode('');
    setNewBookCode('');

    toast.success(`✓ Subject "${subjectName}" added successfully`);
  }, [selectedGlobalSubject, globalSubjects, formData.customSubjects, formData.gradeNumber, newSubjectCode, newBookCode, validateSubjectCode, generateSubjectCode]);

  const handleCustomSubjectChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.customSubjects || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customSubjects: updated };
    });
  }, []);

  const handleCustomSubjectToggle = useCallback((index, checked) => {
    setFormData(prev => {
      const updated = [...(prev.customSubjects || [])];
      updated[index] = { ...updated[index], selected: checked };
      return { ...prev, customSubjects: updated };
    });
  }, []);

  const removeCustomSubject = useCallback((index) => {
    const subjectName = formData.customSubjects[index].name;
    setFormData(prev => ({
      ...prev,
      customSubjects: prev.customSubjects.filter((_, i) => i !== index)
    }));
    toast.info(`Removed "${subjectName}" from subjects list`);
  }, [formData.customSubjects]);

  const addTeacherAssignment = useCallback((subjectId, teacherId, sectionIds = []) => {
    const newAssignments = [];

    sectionIds.forEach(sectionId => {
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
  }, [formData.teacherAssignments]);

  const removeTeacherAssignment = useCallback((id) => {
    setFormData(prev => ({
      ...prev,
      teacherAssignments: prev.teacherAssignments.filter(ta => ta.id !== id)
    }));
  }, []);

  const validateStep = useCallback(() => {
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
      if (!formData.sectionsCount || formData.sectionsCount < 1 || formData.sectionsCount > MAX_SECTIONS) {
        newErrors.sectionsCount = `Please enter a valid number of sections (1-${MAX_SECTIONS})`;
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
  }, [activeStep, formData, isGradeAvailable, validateGradeFormat]);

  const handleNext = useCallback(() => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  }, [validateStep]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  const handleSubmit = useCallback(async () => {
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
        if (!subject.name || !subject.code) {
          console.error('Subject missing required fields:', subject);
          toast.error(`Cannot create subject: missing name or code`);
          continue;
        }

        const subjectPayload = {
          name: subject.name,
          code: subject.code,
          description: subject.description || '',
          assignment_day: subject.assignment_day || null,
          branch: formData.branchId,
          class_grade: newClassId,
          section: null
        };

        if (subject.global_subject_id) {
          subjectPayload.global_subject = subject.global_subject_id;
        }

        // Check for duplicate code
        const isDuplicateCode = availableSubjects.some(s =>
          s.code === subjectPayload.code &&
          s.branch === subjectPayload.branch &&
          s.class_grade === subjectPayload.class_grade
        );

        if (isDuplicateCode) {
          const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
          subjectPayload.code = `${subjectPayload.code}_${timestamp}`;
          console.log('Duplicate code detected, using new code:', subjectPayload.code);
        }

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
          toast.error(`Failed to create subject "${subject.name}": ${subjectData.message || 'Unknown error'}`);
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
  }, [formData, isGradeAvailable, validateStep, availableSubjects, navigate]);

  // Render Functions
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

            <FormControl fullWidth sx={{ maxWidth: isMobile ? '100%' : 400, mb: 3 }} error={!!errors.branchId}>
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

            <FormControl fullWidth sx={{ maxWidth: isMobile ? '100%' : 400 }} error={!!errors.termId}>
              <InputLabel>Term *</InputLabel>
              <Select
                value={formData.termId}
                onChange={handleTermChange}
                label="Term *"
                disabled={!formData.branchId || availableTerms.length === 0}
              >
                <MenuItem value="">
                  {!formData.branchId ? 'Select Branch First' : availableTerms.length === 0 ? 'No terms available' : 'Select Term'}
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
              helperText={errors.gradeNumber || `Enter a number between ${MIN_GRADE} and ${MAX_GRADE}`}
              sx={{ maxWidth: isMobile ? '100%' : 400, mb: 3 }}
              InputProps={{
                startAdornment: <IconSchool size={20} style={{ marginRight: 8, color: '#666' }} />
              }}
            />

            {checkingDuplicate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CircularProgress size={16} />
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
              Enter the number of sections for Grade {formData.gradeNumber || '?'}
            </Typography>

            <TextField
              fullWidth
              label="Number of Sections"
              type="number"
              value={formData.sectionsCount}
              onChange={handleChange('sectionsCount')}
              error={!!errors.sectionsCount}
              helperText={errors.sectionsCount || `Enter a number between 1 and ${MAX_SECTIONS}`}
              sx={{ maxWidth: isMobile ? '100%' : 400, mb: 3 }}
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
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                      <Checkbox
                        checked={subject.selected}
                        onChange={(e) => handleCustomSubjectToggle(index, e.target.checked)}
                      />
                      <Box flex={1}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {subject.name}
                          </Typography>
                          <Chip label={subject.code} size="small" color="primary" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                            {DAYS_OF_WEEK.map(day => (
                              <MenuItem key={day} value={day}>{day}</MenuItem>
                            ))}
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
                      <InputLabel>Select Subject *</InputLabel>
                      <Select
                        value={selectedGlobalSubject}
                        onChange={(e) => setSelectedGlobalSubject(e.target.value)}
                        label="Select Subject *"
                        disabled={globalSubjectsLoading}
                      >
                        <MenuItem value="">-- Select a Subject --</MenuItem>
                        {globalSubjects.map((subject) => (
                          <MenuItem key={`global-${subject.id}`} value={subject.id}>
                            {subject.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
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
                              if (value.includes('all')) {
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
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          alignItems={isMobile ? 'flex-start' : 'center'}
          sx={{ mb: 4 }}
        >
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={18} />}
            onClick={() => navigate('/classes')}
            fullWidth={isMobile}
            disabled={loading}
          >
            Back
          </Button>
          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
            Create New Class
          </Typography>
        </Stack>

        <Stepper
          activeStep={activeStep}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ mb: 4, overflowX: 'auto' }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <DrogaCard>
          <CardContent>
            {renderStepContent()}

            <Stack
              direction={isMobile ? 'column-reverse' : 'row'}
              spacing={2}
              justifyContent="flex-end"
              sx={{ mt: 4 }}
            >
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                  fullWidth={isMobile}
                >
                  Back
                </Button>
              )}

              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading || (activeStep === 1 && (!!errors.gradeNumber || !formData.gradeNumber))}
                  fullWidth={isMobile}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                  disabled={loading || !isGradeAvailable}
                  fullWidth={isMobile}
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