'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { CircularProgress as CircularProgressSmall } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

// Exam Types - defined outside components for shared access
const examTypes = [
  { value: 'unit_test', label: 'Quiz' },
  { value: 'mid_term', label: 'Mid-term' },
  { value: 'final', label: 'Final' },
  { value: 'diagnostic_test', label: 'Diagnostic' },
  { value: 'other', label: 'Other' }
];

// Exam Form Component
const ExamForm = ({ open, onClose, exam, onSave, terms, classes, branches, isSuperuser, teacherProfile, user, exams }) => {
  const [formData, setFormData] = useState({
    name: '',
    exam_type: 'unit_test',
    term_id: '',
    subject_id: '',
    class_id: '',
    section_id: '',
    branch_id: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    max_score: 100,
    passing_score: 40,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [filteredSections, setFilteredSections] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  useEffect(() => {
    if (exam) {
      const classId = exam.class_details?.id || exam.class_fk?.id || exam.class_id || '';
      setFormData({
        name: exam.name || '',
        exam_type: exam.exam_type || 'unit_test',
        term_id: exam.term?.id || exam.term_id || '',
        subject_id: exam.subject?.id || exam.subject_id || '',
        class_id: classId,
        section_id: exam.section?.id || exam.section_id || '',
        start_date: exam.start_date || '',
        end_date: exam.end_date || '',
        start_time: exam.start_time || '',
        end_time: exam.end_time || '',
        max_score: exam.max_score || 100,
        passing_score: exam.passing_score || 40,
        description: exam.description || '',
      });

      // Load sections and subjects for the existing exam's class
      if (classId) {
        fetchSectionsForClass(classId);
        fetchSubjectsForClass(classId);
      }
    } else {
      setFormData({
        name: '',
        exam_type: 'unit_test',
        term_id: '',
        subject_id: '',
        class_id: '',
        section_id: '',
        branch_id: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        max_score: 100,
        passing_score: 40,
        description: '',
      });
      setFilteredSections([]);
      setFilteredSubjects([]);
    }
    setErrors({});
  }, [exam, open]);

  // Debug: log classes, isSuperuser, and branches when they change
  useEffect(() => {
    console.log('ExamForm - isSuperuser:', isSuperuser, 'branches:', branches.length, 'classes:', classes.length);
  }, [classes, isSuperuser, branches]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Exam name is required';
    if (!formData.term_id) newErrors.term_id = 'Term is required';
    if (!formData.subject_id) newErrors.subject_id = 'Subject is required';
    if (!formData.class_id) newErrors.class_id = 'Class is required';
    if (isSuperuser && !formData.branch_id) newErrors.branch_id = 'Branch is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }
    if (formData.max_score <= 0) newErrors.max_score = 'Max score must be greater than 0';
    if (formData.passing_score < 0 || formData.passing_score > formData.max_score) {
      newErrors.passing_score = `Passing score must be between 0 and ${formData.max_score}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to check for duplicate exams
  const checkDuplicateExam = (existingExams, formData, currentExamId) => {
    const duplicate = existingExams.find(e => {
      // Skip current exam when editing
      if (currentExamId && e.id === currentExamId) return false;

      // Check same subject, class, section
      const sameSubject = (e.subject?.id || e.subject_id) === formData.subject_id;
      const sameClass = (e.class_details?.id || e.class_fk?.id || e.class_id) === formData.class_id;
      const sameSection = (e.section?.id || e.section_id) === formData.section_id ||
        (!e.section?.id && !e.section_id && !formData.section_id);

      // Check overlapping dates
      const sameDates = e.start_date === formData.start_date && e.end_date === formData.end_date;

      // Check overlapping times (if times are set)
      const sameTimes = (!formData.start_time && !e.start_time) ||
        (formData.start_time === e.start_time && formData.end_time === e.end_time);

      // It's a duplicate if: same subject, class, section, dates, times AND same exam_type
      // Different exam_type is allowed (e.g., Quiz and Mid-term for same subject/time)
      if (sameSubject && sameClass && sameSection && sameDates && sameTimes) {
        if (e.exam_type === formData.exam_type) {
          return true; // Duplicate: same everything including exam type
        }
      }
      return false;
    });

    return duplicate;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Check for duplicate exams
    if (exams && exams.length > 0) {
      const duplicate = checkDuplicateExam(exams, formData, exam?.id);
      if (duplicate) {
        toast.error(`An exam already exists for this subject with the same dates/times and type "${examTypes.find(t => t.value === duplicate.exam_type)?.label || duplicate.exam_type}". Please use a different exam type or change the schedule.`);
        return;
      }
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const payload = {
        ...formData,
        created_by_id: user?.id,
      };
      console.log('Exam payload:', payload);

      const url = exam
        ? `${Backend.api}${Backend.exams}${exam.id}/`
        : `${Backend.api}${Backend.exams}`;

      const method = exam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Exam save response:', response.status, data);

      if (response.ok && data.success) {
        toast.success(exam ? 'Exam updated successfully!' : 'Exam created successfully!');
        onSave(data.data);
        onClose();
      } else {
        console.error('Exam save error:', data);
        toast.error(data.message || JSON.stringify(data) || 'Failed to save exam');
      }
    } catch (error) {
      console.error('Error saving exam:', error);
      toast.error('Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // When branch changes, filter classes
      if (field === 'branch_id') {
        // Classes will be filtered by parent component based on branch
      }

      // When class changes, reset section and subject, and set branch_id from class
      if (field === 'class_id') {
        newData.section_id = '';
        newData.subject_id = '';
        const selectedClass = classes.find(c => c.id === value);
        if (selectedClass) {
          newData.branch_id = selectedClass.branch_details?.id || selectedClass.branch;
        }
        fetchSectionsForClass(value);
        fetchSubjectsForClass(value);
      }

      return newData;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const fetchSectionsForClass = async (classId) => {
    if (!classId) {
      setFilteredSections([]);
      return;
    }

    setSectionsLoading(true);
    try {
      const token = await GetToken();
      const url = `${Backend.api}${Backend.sections}?class_id=${classId}`;
      console.log('Fetching sections from:', url);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Sections API response:', data);
      if (data.success) {
        setFilteredSections(data.data || []);
        console.log('Sections loaded:', data.data?.length || 0);
      } else {
        console.log('Sections API returned no success:', data);
        setFilteredSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setFilteredSections([]);
    } finally {
      setSectionsLoading(false);
    }
  };

  const fetchSubjectsForClass = async (classId) => {
    if (!classId) {
      setFilteredSubjects([]);
      return;
    }

    setSubjectsLoading(true);
    try {
      const token = await GetToken();
      const headers = { Authorization: `Bearer ${token}` };
      let allSubjects = [];

      // Fetch 1: Get subjects from new /classes/{id}/subjects/ endpoint
      try {
        const response = await fetch(`${Backend.api}${Backend.classes}${classId}/subjects/`, { headers });
        const data = await response.json();
        if (data.success && data.data) {
          allSubjects = [...allSubjects, ...data.data];
        }
      } catch (e) {
        console.log('Class subjects fetch failed:', e);
      }

      // Fetch 2: Teacher's direct assignments for this class (for teachers)
      try {
        const assignmentsRes = await fetch(`${Backend.auth}${Backend.teachersOverviewDashboard}`, { headers });
        const assignmentsData = await assignmentsRes.json();
        if (assignmentsData.success && assignmentsData.data?.subjects) {
          const teacherSubjects = assignmentsData.data.subjects
            .filter(a => (a.class_id === classId || a.class_fk?.id === classId))
            .map(a => a.subject)
            .filter(s => s && s.id);
          allSubjects = [...allSubjects, ...teacherSubjects];
        }
      } catch (e) {
        console.log('Teacher assignments fetch failed:', e);
      }

      // Remove duplicates by ID
      const uniqueSubjects = allSubjects.filter((v, i, a) =>
        a.findIndex(t => t.id === v.id) === i
      );

      console.log('Fetched subjects for class', classId, ':', uniqueSubjects.length);
      setFilteredSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error fetching subjects for class:', error);
      setFilteredSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {exam ? 'Edit Exam' : 'Create New Exam'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Exam Name *"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.exam_type}>
              <InputLabel>Exam Type *</InputLabel>
              <Select
                value={formData.exam_type}
                onChange={(e) => handleChange('exam_type', e.target.value)}
                label="Exam Type *"
              >
                {examTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.term_id}>
              <InputLabel>Term *</InputLabel>
              <Select
                value={formData.term_id}
                onChange={(e) => handleChange('term_id', e.target.value)}
                label="Term *"
              >
                {terms.map(term => (
                  <MenuItem key={term.id} value={term.id}>{term.name}</MenuItem>
                ))}
              </Select>
              {errors.term_id && <Typography color="error" variant="caption">{errors.term_id}</Typography>}
            </FormControl>
          </Grid>
          {isSuperuser && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.branch_id}>
                <InputLabel>Branch *</InputLabel>
                <Select
                  value={formData.branch_id}
                  onChange={(e) => handleChange('branch_id', e.target.value)}
                  label="Branch *"
                >
                  {branches.map(branch => (
                    <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                  ))}
                </Select>
                {errors.branch_id && <Typography color="error" variant="caption">{errors.branch_id}</Typography>}
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.class_id}>
              <InputLabel>Class *</InputLabel>
              <Select
                value={formData.class_id}
                onChange={(e) => handleChange('class_id', e.target.value)}
                label="Class *"
              >
                {classes.length === 0 ? (
                  <MenuItem value="" disabled>No classes available</MenuItem>
                ) : (
                  classes.map(cls => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.grade || cls.name}</MenuItem>
                  ))
                )}
              </Select>
              {classes.length === 0 && (
                <Typography color="warning.main" variant="caption">
                  No classes available
                </Typography>
              )}
              {errors.class_id && <Typography color="error" variant="caption">{errors.class_id}</Typography>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl
              fullWidth
              disabled={!formData.class_id || sectionsLoading}
              error={!!errors.section_id}
            >
              <InputLabel>
                {sectionsLoading ? 'Loading...' : 'Section'}
              </InputLabel>
              <Select
                value={formData.section_id}
                onChange={(e) => handleChange('section_id', e.target.value)}
                label={sectionsLoading ? 'Loading...' : 'Section'}
              >
                <MenuItem value="">
                  <em>{filteredSections.length === 0 ? 'No sections available' : 'All Sections'}</em>
                </MenuItem>
                {filteredSections.map(section => (
                  <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>
                ))}
              </Select>
              {!formData.class_id && (
                <Typography color="text.secondary" variant="caption">
                  Select a class first
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl
              fullWidth
              error={!!errors.subject_id}
              disabled={!formData.class_id || subjectsLoading}
            >
              <InputLabel>
                {subjectsLoading ? 'Loading subjects...' : 'Subject *'}
              </InputLabel>
              <Select
                value={formData.subject_id}
                onChange={(e) => handleChange('subject_id', e.target.value)}
                label={subjectsLoading ? 'Loading subjects...' : 'Subject *'}
              >
                <MenuItem value="">
                  <em>
                    {!formData.class_id
                      ? 'Select class first'
                      : subjectsLoading
                        ? 'Loading...'
                        : filteredSubjects.length === 0
                          ? 'No subjects for this class'
                          : 'Select Subject'}
                  </em>
                </MenuItem>
                {filteredSubjects.map(subject => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                    {subject.code && (
                      <Typography component="span" color="text.secondary" sx={{ ml: 1, fontSize: '0.85em' }}>
                        ({subject.code})
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
              {errors.subject_id && <Typography color="error" variant="caption">{errors.subject_id}</Typography>}
              {!formData.class_id && (
                <Typography color="text.secondary" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  Select a class to see available subjects
                </Typography>
              )}
              {formData.class_id && !subjectsLoading && filteredSubjects.length === 0 && (
                <Typography color="warning.main" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  No subjects assigned to this class. Please assign subjects in Class Management.
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date *"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              error={!!errors.start_date}
              helperText={errors.start_date}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date *"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              error={!!errors.end_date}
              helperText={errors.end_date}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="time"
              label="Start Time"
              value={formData.start_time}
              onChange={(e) => handleChange('start_time', e.target.value?.substring(0, 5))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="time"
              label="End Time"
              value={formData.end_time}
              onChange={(e) => handleChange('end_time', e.target.value?.substring(0, 5))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Max Score *"
              value={formData.max_score}
              onChange={(e) => handleChange('max_score', parseFloat(e.target.value))}
              error={!!errors.max_score}
              helperText={errors.max_score}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Passing Score *"
              value={formData.passing_score}
              onChange={(e) => handleChange('passing_score', parseFloat(e.target.value))}
              error={!!errors.passing_score}
              helperText={errors.passing_score}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : (exam ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// View Exam Dialog
const ViewExamDialog = ({ open, onClose, exam }) => {
  if (!exam) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Exam Details</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="h5" gutterBottom>{exam.name}</Typography>
          <Chip
            label={exam.exam_type}
            color="primary"
            size="small"
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Subject</Typography>
              <Typography variant="body1">{exam.subject?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Class</Typography>
              <Typography variant="body1">
                {exam.class_details?.grade || exam.class_details?.name || exam.class_fk?.grade || exam.class_fk?.name || 'N/A'}
                {exam.section_details?.name && ` - ${exam.section_details.name}`}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Term</Typography>
              <Typography variant="body1">{exam.term?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Max Score</Typography>
              <Typography variant="body1">{exam.max_score}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Passing Score</Typography>
              <Typography variant="body1">{exam.passing_score}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography variant="body1">
                {exam.start_date} {exam.end_date !== exam.start_date && `to ${exam.end_date}`}
              </Typography>
            </Grid>
            {(exam.start_time || exam.end_time) && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Time</Typography>
                <Typography variant="body1">
                  {exam.start_time || '--:--'} to {exam.end_time || '--:--'}
                </Typography>
              </Grid>
            )}
            {exam.description && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{exam.description}</Typography>
              </Grid>
            )}
            {exam.created_by && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Created By</Typography>
                <Typography variant="body1">{exam.created_by.full_name || exam.created_by.email}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Delete Confirmation Dialog
const DeleteConfirmDialog = ({ open, onClose, onConfirm, examName, loading }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Confirm Delete</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete the exam <strong>"{examName}"</strong>?
      </Typography>
      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
        This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>Cancel</Button>
      <Button
        onClick={onConfirm}
        color="error"
        variant="contained"
        disabled={loading}
      >
        {loading ? 'Deleting...' : 'Delete'}
      </Button>
    </DialogActions>
  </Dialog>
);

// Main Exam Management Component
export default function ExamManagement() {
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    term: '',
    class: '',
    subject: '',
    examType: '',
    branch: '',
  });

  // Reference data
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]); // Store all classes for filtering
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [teacherAssignments, setTeacherAssignments] = useState([]);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Role checks
  const isSuperuser = user?.is_superuser || user?.roles?.some(r =>
    ['super_admin', 'superadmin'].includes(typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase())
  );
  const isAdmin = user?.roles?.some(r =>
    ['admin', 'super_admin', 'superadmin', 'staff', 'head_admin', 'ceo'].includes(
      typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()
    )
  );
  const isTeacher = user?.teacher_profiles?.length > 0 || user?.teacher_profile ||
    user?.roles?.some(r => (typeof r === 'string' ? r : r.name)?.toLowerCase() === 'teacher');

  // Debug logging
  console.log('User role checks:', { isSuperuser, isAdmin, isTeacher, userRoles: user?.roles });

  // Teachers can create exams (backend will validate their assignments)
  const canCreateExam = isSuperuser || isAdmin || isTeacher;
  const canEditExam = isSuperuser || isAdmin || isTeacher;
  const canDeleteExam = isSuperuser || isAdmin || isTeacher;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterExams();
  }, [exams, searchTerm, filters]);

  // Filter classes by selected branch (for superadmin)
  useEffect(() => {
    if (allClasses.length > 0) {
      if (filters.branch) {
        const filteredClasses = allClasses.filter(c =>
          c.branch_details?.id === filters.branch || c.branch === filters.branch
        );
        setClasses(filteredClasses);
      } else {
        setClasses(allClasses);
      }
    }
  }, [filters.branch, allClasses]);

  const fetchInitialData = async () => {
    try {
      const token = await GetToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      };

      // Determine if user is a teacher based on current user data
      const userIsTeacher = user?.teacher_profiles?.length > 0 || user?.teacher_profile ||
        user?.roles?.some(r => (typeof r === 'string' ? r : r.name)?.toLowerCase() === 'teacher');

      // Fetch teacher profile (always try, user might be both admin and teacher)
      let teacherDataResult = null;
      try {
        const teacherRes = await fetch(`${Backend.api}${Backend.teacherMe}`, { headers });
        const teacherData = await teacherRes.json();
        if (teacherData.success) {
          setTeacherProfile(teacherData.data);
          teacherDataResult = teacherData.data;
          console.log('Teacher profile found:', teacherData.data);
        }
      } catch (e) {
        console.log('Not a teacher or no teacher profile');
      }

      // Fetch teacher assignments (if user has teacher profile or is teacher)
      let teacherAssignmentsData = [];
      if (teacherDataResult || userIsTeacher) {
        try {
          const assignmentsRes = await fetch(`${Backend.auth}${Backend.teachersOverviewDashboard}`, { headers });
          const assignmentsData = await assignmentsRes.json();
          console.log('=== Teacher Assignments API Response ===');
          console.log('Success:', assignmentsData.success);
          console.log('Data keys:', assignmentsData.data ? Object.keys(assignmentsData.data) : 'No data');
          console.log('Full data:', assignmentsData.data);
          if (assignmentsData.success) {
            teacherAssignmentsData = assignmentsData.data?.subjects || [];
            setTeacherAssignments(teacherAssignmentsData);
            console.log('Teacher assignments loaded:', teacherAssignmentsData.length);
            console.log('Sample assignment:', teacherAssignmentsData[0]);
          }
        } catch (e) {
          console.error('Failed to fetch teacher assignments:', e);
        }
      }

      // Fetch reference data
      const fetchPromises = [
        fetch(`${Backend.api}${Backend.terms}`, { headers }),
        fetch(`${Backend.api}${Backend.classes}`, { headers }),
        fetch(`${Backend.api}${Backend.subjects}`, { headers }),
      ];

      // Fetch branches for superadmin
      if (isSuperuser) {
        fetchPromises.push(fetch(`${Backend.api}${Backend.branches}`, { headers }));
      }

      const responses = await Promise.all(fetchPromises);

      const parsedData = await Promise.all(responses.map(r => r.json()));
      const [termsData, classesData, subjectsData] = parsedData;
      const branchesData = isSuperuser ? parsedData[3] : null;

      if (termsData.success) setTerms(termsData.data || []);

      // Store all classes and filter for teachers
      if (classesData.success) {
        const allClassesData = classesData.data || [];
        console.log('Classes loaded:', allClassesData.length, allClassesData);
        setAllClasses(allClassesData);

        // For teachers, show all classes (backend will validate on create)
        // For admins/superusers, show all classes
        setClasses(allClassesData);
      }

      if (subjectsData.success) setSubjects(subjectsData.data || []);

      // Store branches for superadmin
      if (isSuperuser && branchesData?.success) {
        console.log('Branches loaded:', branchesData.data?.length || 0);
        setBranches(branchesData.data || []);
      } else if (isSuperuser) {
        console.log('Branches fetch failed or no data:', branchesData);
      }

      // Fetch exams
      await fetchExams(headers);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async (headers) => {
    try {
      const params = new URLSearchParams();
      if (filters.term) params.append('term_id', filters.term);
      if (filters.class) params.append('class_id', filters.class);
      if (filters.subject) params.append('subject_id', filters.subject);

      const url = `${Backend.api}${Backend.exams}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (data.success) {
        setExams(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch exams');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to fetch exams');
    }
  };

  const filterExams = () => {
    let filtered = [...exams];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(exam =>
        exam.name?.toLowerCase().includes(term) ||
        exam.subject?.name?.toLowerCase().includes(term) ||
        (exam.class_details?.grade || exam.class_fk?.grade || '').toLowerCase().includes(term) ||
        exam.exam_type?.toLowerCase().includes(term)
      );
    }

    if (filters.examType) {
      filtered = filtered.filter(exam => exam.exam_type === filters.examType);
    }

    setFilteredExams(filtered);
  };

  const fetchSections = async (classId) => {
    if (!classId) {
      setSections([]);
      return;
    }
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.sections}?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSections(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleCreateExam = () => {
    setSelectedExam(null);
    setFormOpen(true);
  };

  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    fetchSections(exam.class_details?.id || exam.class_fk?.id || exam.class_id);
    setFormOpen(true);
  };

  const handleViewExam = (exam) => {
    setSelectedExam(exam);
    setViewOpen(true);
  };

  const handleDeleteClick = (exam) => {
    setSelectedExam(exam);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExam) return;

    setDeleteLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.exams}${selectedExam.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Exam deleted successfully');
        setExams(prev => prev.filter(e => e.id !== selectedExam.id));
        setDeleteOpen(false);
        setSelectedExam(null);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete exam');
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveExam = (savedExam) => {
    if (selectedExam) {
      setExams(prev => prev.map(e => e.id === savedExam.id ? savedExam : e));
    } else {
      setExams(prev => [savedExam, ...prev]);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    if (field === 'class') {
      fetchSections(value);
    }
  };

  const clearFilters = () => {
    setFilters({ term: '', class: '', subject: '', examType: '', branch: '' });
    setSearchTerm('');
    setSections([]);
  };

  const getExamTypeColor = (type) => {
    const colors = {
      'unit_test': 'default',
      'mid_term': 'info',
      'final': 'success',
      'diagnostic_test': 'warning',
      'other': 'default',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <ToastContainer />

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Exam Management
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Create and manage exams, quizzes, and assessments
              </Typography>
            </Box>
          </Box>

          {canCreateExam && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateExam}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              Create Exam
            </Button>
          )}
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Total Exams</Typography>
                  <Typography variant="h4">{exams.length}</Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Upcoming</Typography>
                  <Typography variant="h4" color="info.main">
                    {exams.filter(e => new Date(e.start_date) >= new Date()).length}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Completed</Typography>
                  <Typography variant="h4" color="success.main">
                    {exams.filter(e => new Date(e.end_date) < new Date()).length}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>This Month</Typography>
                  <Typography variant="h4" color="warning.main">
                    {exams.filter(e => {
                      const date = new Date(e.start_date);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterIcon color="primary" />
              <Typography variant="h6">Filters</Typography>
              {(filters.term || filters.class || filters.subject || filters.examType || searchTerm) && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  sx={{ ml: 'auto' }}
                >
                  Clear All
                </Button>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Term</InputLabel>
                  <Select
                    value={filters.term}
                    onChange={(e) => handleFilterChange('term', e.target.value)}
                    label="Term"
                  >
                    <MenuItem value="">All Terms</MenuItem>
                    {terms.map(term => (
                      <MenuItem key={term.id} value={term.id}>{term.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {isSuperuser && (
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Branch</InputLabel>
                    <Select
                      value={filters.branch}
                      onChange={(e) => handleFilterChange('branch', e.target.value)}
                      label="Branch"
                    >
                      <MenuItem value="">All Branches</MenuItem>
                      {branches.map(branch => (
                        <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={filters.class}
                    onChange={(e) => handleFilterChange('class', e.target.value)}
                    label="Class"
                  >
                    <MenuItem value="">All Classes</MenuItem>
                    {classes.map(cls => (
                      <MenuItem key={cls.id} value={cls.id}>{cls.grade || cls.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={filters.subject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                    label="Subject"
                  >
                    <MenuItem value="">All Subjects</MenuItem>
                    {subjects.map(subject => (
                      <MenuItem key={subject.id} value={subject.id}>{subject.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Exam Type</InputLabel>
                  <Select
                    value={filters.examType}
                    onChange={(e) => handleFilterChange('examType', e.target.value)}
                    label="Exam Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {examTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Exams Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><Typography fontWeight="bold">Exam Name</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Type</Typography></TableCell>
                {isSuperuser && <TableCell><Typography fontWeight="bold">Branch</Typography></TableCell>}
                <TableCell><Typography fontWeight="bold">Subject</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Class</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Score</Typography></TableCell>
                <TableCell align="right"><Typography fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperuser ? 8 : 7} align="center" sx={{ py: 8 }}>
                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No exams found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || filters.term || filters.class || filters.subject || filters.examType
                        ? 'Try adjusting your filters'
                        : 'Create your first exam to get started'}
                    </Typography>
                    {canCreateExam && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleCreateExam}
                        sx={{ mt: 2 }}
                      >
                        Create Exam
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExams.map((exam, index) => {
                  // Debug logging for first exam
                  if (index === 0) {
                    console.log('First exam data:', exam);
                    console.log('class_details:', exam.class_details);
                    console.log('class_fk:', exam.class_fk);
                  }
                  return (
                    <Fade in={true} key={exam.id} style={{ transitionDelay: `${index * 50}ms` }}>
                      <TableRow hover>
                        <TableCell>
                          <Box>
                            <Typography fontWeight="medium">{exam.name}</Typography>
                            {exam.description && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                {exam.description}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={examTypes.find(t => t.value === exam.exam_type)?.label || exam.exam_type}
                            size="small"
                            color={getExamTypeColor(exam.exam_type)}
                          />
                        </TableCell>
                        {isSuperuser && <TableCell>{exam.branch?.name || 'N/A'}</TableCell>}
                        <TableCell>{exam.subject?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {exam.class_details?.grade || exam.class_details?.name || exam.class_fk?.grade || exam.class_fk?.name || 'N/A'}
                          {exam.section_details?.name && ` - ${exam.section_details.name}`}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {exam.start_date}
                              {exam.end_date !== exam.start_date && ` to ${exam.end_date}`}
                            </Typography>
                          </Box>
                          {(exam.start_time || exam.end_time) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {exam.start_time || '--:--'} - {exam.end_time || '--:--'}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            Max: {exam.max_score}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pass: {exam.passing_score}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewExam(exam)}
                                color="info"
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>

                            {canEditExam && (
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditExam(exam)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}

                            {canDeleteExam && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(exam)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    </Fade>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialogs */}
      <ExamForm
        key={`exam-form-${classes.length}-${formOpen}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        exam={selectedExam}
        onSave={handleSaveExam}
        terms={terms}
        classes={classes}
        branches={branches}
        isSuperuser={isSuperuser}
        teacherProfile={teacherProfile}
        user={user}
        exams={exams}
      />

      <ViewExamDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        exam={selectedExam}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        examName={selectedExam?.name}
        loading={deleteLoading}
      />
    </Container>
  );
}
