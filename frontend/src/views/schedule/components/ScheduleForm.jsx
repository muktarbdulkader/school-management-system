import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const ScheduleForm = ({ open, onClose, onSuccess, editingSchedule }) => {
  const [formData, setFormData] = useState({
    term_id: '',
    day_of_week: 'Monday',
    period_number: 1,
    start_time: '',
    end_time: '',
    branch_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    teacher_id: '',
    slot_type_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [slotTypes, setSlotTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [terms, setTerms] = useState([]);
  const [validationError, setValidationError] = useState(null);

  // Get user data from Redux like the main schedule page
  const userData = useSelector((state) => {
    try {
      return state?.user?.user || state?.auth?.user || {};
    } catch (error) {
      console.error('Error accessing user data:', error);
      return {};
    }
  });

  const userRoles = userData.roles || userData.user_roles || [];
  const isSuperUser = userData.is_superuser || userData.is_super_user;

  // Check for superadmin role
  const hasSuperAdminRole = userRoles.some(r => {
    const roleName = (typeof r === 'string' ? r : (r.role?.name || r.name || '')).toLowerCase();
    return roleName.includes('super_admin') || roleName.includes('superadmin');
  });
  const isSuperAdmin = isSuperUser || hasSuperAdminRole;
  const canSelectBranch = isSuperUser || hasSuperAdminRole;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (open) {
      fetchFormData();
    }
  }, [open]);

  // Log user role for debugging
  useEffect(() => {
    console.log('ScheduleForm - Redux userData:', userData);
    console.log('ScheduleForm - isSuperAdmin:', isSuperAdmin);
    console.log('ScheduleForm - canSelectBranch:', canSelectBranch);
  }, [userData]);

  // Populate form when editing
  useEffect(() => {
    if (editingSchedule) {
      setFormData({
        term_id: editingSchedule.term_details?.id || editingSchedule.term?.id || '',
        day_of_week: editingSchedule.day_of_week || 'Monday',
        period_number: editingSchedule.period_number || 1,
        start_time: editingSchedule.start_time || '',
        end_time: editingSchedule.end_time || '',
        branch_id: editingSchedule.branch_details?.id || '',
        class_id: editingSchedule.class_details?.id || '',
        section_id: editingSchedule.section_details?.id || '',
        subject_id: editingSchedule.subject_details?.id || '',
        teacher_id: editingSchedule.teacher_details?.id || '',
        slot_type_id: editingSchedule.slot_type?.id || ''
      });
    } else {
      // Reset form for new entry
      setFormData({
        term_id: '',
        day_of_week: 'Monday',
        period_number: 1,
        start_time: '',
        end_time: '',
        branch_id: '',
        class_id: '',
        section_id: '',
        subject_id: '',
        teacher_id: '',
        slot_type_id: ''
      });
    }
  }, [editingSchedule]);

  const fetchFormData = async () => {
    try {
      const token = await GetToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Build fetch list based on user role
      const fetchList = [
        fetch(`${Backend.api}${Backend.classes}`, { headers }),
        fetch(`${Backend.api}${Backend.sections}`, { headers }),
        fetch(`${Backend.api}${Backend.subjects}`, { headers }),
        fetch(`${Backend.api}${Backend.teacherAssignments}`, { headers }),
        fetch(`${Backend.api}${Backend.slotTypes}`, { headers }),
        fetch(`${Backend.api}${Backend.terms}`, { headers })
      ];

      // Only fetch branches for super admin
      if (isSuperAdmin) {
        fetchList.push(fetch(`${Backend.api}${Backend.branches}`, { headers }));
      }

      const [classesRes, sectionsRes, subjectsRes, assignmentsRes, slotTypesRes, termsRes, branchesRes] = await Promise.all(fetchList);

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.data || data.results || []);
      }
      if (sectionsRes.ok) {
        const data = await sectionsRes.json();
        setAllSections(data.data || data.results || []);
        setSections(data.data || data.results || []);
      }
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        const subjectsList = data.data || data.results || [];
        setSubjects(subjectsList);
        setAllSubjects(subjectsList);
      }
      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        const assignments = data.data || data.results || [];
        setTeacherAssignments(assignments);

        // Extract unique teachers from assignments
        const uniqueTeachers = [];
        const teacherIds = new Set();
        assignments.forEach(assignment => {
          if (assignment.teacher_details && !teacherIds.has(assignment.teacher_details.id)) {
            teacherIds.add(assignment.teacher_details.id);
            uniqueTeachers.push(assignment.teacher_details);
          }
        });
        setAllTeachers(uniqueTeachers);
        setTeachers(uniqueTeachers);
      }
      if (slotTypesRes && slotTypesRes.ok) {
        const data = await slotTypesRes.json();
        const types = data.data || data.results || [];
        setSlotTypes(types);
        // Set default slot type if available
        if (types.length > 0 && !formData.slot_type_id) {
          setFormData(prev => ({ ...prev, slot_type_id: types[0].id }));
        }
      }
      if (termsRes && termsRes.ok) {
        const data = await termsRes.json();
        const termsList = data.data || data.results || [];
        // Filter out closed terms - only show upcoming and current terms
        const activeTerms = termsList.filter(t => t.status !== 'closed');
        setTerms(activeTerms);
        // Auto-select current term if available and not editing
        if (activeTerms.length > 0 && !editingSchedule && !formData.term_id) {
          const currentTerm = activeTerms.find(t => t.status === 'current') || activeTerms[0];
          setFormData(prev => ({ ...prev, term_id: currentTerm.id }));
        }
      }
      if (branchesRes && branchesRes.ok) {
        const data = await branchesRes.json();
        setBranches(data.data || data.results || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  // Helper function to filter teachers by class and optional section
  const filterTeachersByClassSection = (classId, sectionId) => {
    const teacherIds = new Set();

    const filteredAssignments = teacherAssignments.filter(assignment => {
      const assignmentClassId = assignment.class_details?.id || assignment.class_fk;
      const assignmentSectionId = assignment.section_details?.id || assignment.section;

      // Match by class
      if (assignmentClassId !== classId) return false;

      // If section is specified, also match by section
      if (sectionId && assignmentSectionId && assignmentSectionId !== sectionId) {
        return false;
      }

      return true;
    });

    filteredAssignments.forEach(assignment => {
      if (assignment.teacher_details) {
        teacherIds.add(assignment.teacher_details.id);
      }
    });

    const filteredTeachers = allTeachers.filter(teacher =>
      teacherIds.has(teacher.id)
    );

    return { filteredTeachers, filteredAssignments };
  };

  // Helper function to filter subjects by teacher, class, and section
  const filterSubjectsByTeacherClassSection = (teacherId, classId, sectionId) => {
    const teacherClassSectionSubjects = teacherAssignments.filter(assignment => {
      const assignmentTeacherId = assignment.teacher_details?.id || assignment.teacher;
      const assignmentClassId = assignment.class_details?.id || assignment.class_fk;
      const assignmentSectionId = assignment.section_details?.id || assignment.section;

      return assignmentTeacherId === teacherId &&
        assignmentClassId === classId &&
        (!sectionId || !assignmentSectionId || assignmentSectionId === sectionId);
    });

    // Extract unique subjects
    const uniqueSubjectIds = new Set();
    const filteredSubjects = [];
    teacherClassSectionSubjects.forEach(assignment => {
      if (assignment.subject_details && !uniqueSubjectIds.has(assignment.subject_details.id)) {
        uniqueSubjectIds.add(assignment.subject_details.id);
        filteredSubjects.push(assignment.subject_details);
      }
    });

    return filteredSubjects;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear validation error when user changes fields
    setValidationError(null);

    // Handle class selection - filter sections and teachers
    if (name === 'class_id') {
      const selectedClassId = value;

      // Filter sections that belong to this class (using class_details since class_fk is write-only)
      const filteredSections = allSections.filter(section => {
        const sectionClassId = section.class_details?.id || section.class_fk;
        return sectionClassId === selectedClassId;
      });
      setSections(filteredSections);

      // Filter teachers for this class
      const { filteredTeachers } = filterTeachersByClassSection(selectedClassId, '');
      setTeachers(filteredTeachers);

      // Reset dependent fields
      setFormData(prev => ({
        ...prev,
        class_id: value,
        section_id: '',
        teacher_id: '',
        subject_id: ''
      }));
      return;
    }

    // Handle section selection - filter teachers by class AND section
    if (name === 'section_id') {
      const selectedSectionId = value;
      const selectedClassId = formData.class_id;

      // Filter teachers for this class and section combination
      const { filteredTeachers } = filterTeachersByClassSection(selectedClassId, selectedSectionId);
      setTeachers(filteredTeachers);

      // If a teacher is already selected, re-filter subjects
      if (formData.teacher_id) {
        const filteredSubjects = filterSubjectsByTeacherClassSection(
          formData.teacher_id,
          selectedClassId,
          selectedSectionId
        );
        setSubjects(filteredSubjects.length > 0 ? filteredSubjects : allSubjects);
      }

      setFormData(prev => ({
        ...prev,
        section_id: value,
        teacher_id: '',
        subject_id: ''
      }));
      return;
    }

    // Handle teacher selection - filter subjects based on teacher's assignments for selected class and section
    if (name === 'teacher_id') {
      const selectedTeacherId = value;
      const selectedClassId = formData.class_id;
      const selectedSectionId = formData.section_id;

      if (selectedClassId && selectedTeacherId) {
        const filteredSubjects = filterSubjectsByTeacherClassSection(
          selectedTeacherId,
          selectedClassId,
          selectedSectionId
        );

        // If no subjects found from assignments, show all subjects
        if (filteredSubjects.length === 0) {
          setSubjects(allSubjects);
        } else {
          setSubjects(filteredSubjects);
        }
      }

      setFormData(prev => ({
        ...prev,
        teacher_id: value,
        subject_id: ''
      }));
      return;
    }

    // Default case
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.term_id) {
      toast.error('Please select a term first');
      return;
    }
    if (!formData.start_time || !formData.end_time || !formData.class_id || !formData.section_id || !formData.teacher_id || !formData.slot_type_id) {
      toast.error('Please fill in all required fields including slot type');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();

      // Build payload - include branch_id only for super admin
      const payload = {
        class_id: formData.class_id,
        section_id: formData.section_id,
        subject_id: formData.subject_id,
        teacher_id: formData.teacher_id,
        slot_type: formData.slot_type_id,
        day_of_week: formData.day_of_week,
        period_number: parseInt(formData.period_number) || 1,
        start_time: formData.start_time,
        end_time: formData.end_time,
        term: formData.term_id
      };

      // Add branch_id for super admin if selected
      if (isSuperAdmin && formData.branch_id) {
        payload.branch_id = formData.branch_id;
      }

      // First validate for conflicts
      const validateResponse = await fetch(`${Backend.api}schedule_slots/validate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const validateData = await validateResponse.json();

      if (validateData.conflicts && validateData.conflicts.length > 0) {
        const conflictMessages = validateData.conflicts.join('\n');
        setValidationError(conflictMessages);
        setLoading(false);
        return;
      }

      // If no conflicts, proceed with creation or update
      const isEditing = !!editingSchedule;
      const url = isEditing
        ? `${Backend.api}schedule_slots/${editingSchedule.id}/`
        : `${Backend.api}${Backend.scheduleSlots}`;
      const method = isEditing ? 'PUT' : 'POST';

      console.log(`${isEditing ? 'Updating' : 'Creating'} schedule slot with payload:`, payload);
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        toast.success(isEditing ? 'Schedule updated successfully' : 'Schedule created successfully');
        // Small delay to ensure DB transaction completes
        setTimeout(() => {
          onSuccess();
        }, 300);
        handleClose();
      } else {
        const error = await response.json();
        console.error('Schedule save error:', error);
        let errorMsg = '';
        if (error.errors && typeof error.errors === 'object') {
          errorMsg = Object.entries(error.errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
        }
        if (!errorMsg && error.message) {
          errorMsg = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
        }
        if (!errorMsg && error.detail) {
          errorMsg = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
        }
        if (!errorMsg) {
          errorMsg = isEditing ? 'Failed to update schedule' : 'Failed to create schedule';
        }
        setValidationError(errorMsg);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      setValidationError(editingSchedule ? 'Failed to update schedule. Please try again.' : 'Failed to create schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      term_id: '',
      day_of_week: 'Monday',
      period_number: 1,
      start_time: '',
      end_time: '',
      branch_id: '',
      class_id: '',
      section_id: '',
      subject_id: '',
      teacher_id: '',
      slot_type_id: ''
    });
    setSections(allSections);
    setTeachers(allTeachers);
    setSubjects(allSubjects);
    setValidationError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editingSchedule ? 'Edit Schedule Slot' : 'Add Schedule Slot'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Term Selection - Must be selected first */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Term *"
                name="term_id"
                value={formData.term_id}
                onChange={handleChange}
                required
                error={!formData.term_id}
                helperText={!formData.term_id ? "Please select a term first" : ""}
              >
                <MenuItem value="">
                  <em>Select Term</em>
                </MenuItem>
                {terms.map(term => (
                  <MenuItem key={term.id} value={term.id}>
                    {term.name} {term.is_current && "(Current)"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Day of Week"
                name="day_of_week"
                value={formData.day_of_week}
                onChange={handleChange}
                required
                disabled={!formData.term_id}
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
                disabled={!formData.term_id}
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
                disabled={!formData.term_id}
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
                disabled={!formData.term_id}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Slot Type *"
                name="slot_type_id"
                value={formData.slot_type_id}
                onChange={handleChange}
                required
                disabled={!formData.term_id}
              >
                <MenuItem value="">
                  <em>Select Slot Type</em>
                </MenuItem>
                {slotTypes.map(type => (
                  <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {/* Branch selector - only for super admins */}
            {console.log('Branch selector check - isSuperAdmin:', isSuperAdmin)}
            {isSuperAdmin && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Branch *"
                  name="branch_id"
                  value={formData.branch_id || ''}
                  onChange={handleChange}
                  required
                  disabled={!formData.term_id}
                >
                  <MenuItem value="">
                    <em>Select Branch</em>
                  </MenuItem>
                  {branches.map(branch => (
                    <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Class *"
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                required
                disabled={!formData.term_id}
                helperText={!formData.term_id ? "Select term first" : !formData.class_id ? "Select class first to see available sections and teachers" : ""}
              >
                <MenuItem value="">
                  <em>Select Class</em>
                </MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.grade}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Section *"
                name="section_id"
                value={formData.section_id}
                onChange={handleChange}
                required
                disabled={!formData.term_id || !formData.class_id || sections.length === 0}
                helperText={!formData.term_id ? "Select term first" : !formData.class_id ? "Select class first" : sections.length === 0 ? "No sections available for this class" : ""}
              >
                <MenuItem value="">
                  <em>Select Section</em>
                </MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Teacher *"
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleChange}
                required
                disabled={!formData.term_id || !formData.class_id || teachers.length === 0}
                helperText={!formData.term_id ? "Select term first" : !formData.class_id ? "Select class first" : teachers.length === 0 ? "No teachers assigned to this class" : ""}
              >
                <MenuItem value="">
                  <em>Select Teacher</em>
                </MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name || teacher.user_details?.full_name || teacher.user?.full_name || 'Unknown'}
                  </MenuItem>
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
                disabled={!formData.term_id || !formData.teacher_id || subjects.length === 0}
                helperText={!formData.term_id ? "Select term first" : !formData.teacher_id ? "Select teacher first" : subjects.length === 0 ? "No subjects available" : ""}
              >
                <MenuItem value="">
                  <em>Select Subject</em>
                </MenuItem>
                {subjects.map(subject => (
                  <MenuItem key={subject.id} value={subject.id}>{subject.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {/* Validation Error Display */}
          {validationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <div style={{ whiteSpace: 'pre-line' }}>{validationError}</div>
            </Alert>
          )}
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
