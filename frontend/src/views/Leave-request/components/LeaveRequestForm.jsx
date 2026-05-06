import React, { useState, useEffect, use } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import toast from 'react-hot-toast';

/**
 * LeaveRequestForm
 *
 * Modal to create a leave request for students or teachers.
 *
 * Requirements and behavior:
 * - For Students: Student ID is read from Redux
 * - For Teachers: Teacher ID is read from Redux
 * - Supports `leave_type` = 'full_day' | 'subject'
 * - POSTs to `${baseUrl}/api/leave_requests/` with the correct body.
 *
 * Props:
 * - open: boolean
 * - onClose: function
 * - onSuccess: function -> called after successful creation (optional)
 * - requestType: 'student' | 'teacher' -> type of leave request
 */

export default function LeaveRequestForm({ open, onClose, onSuccess, requestType: propRequestType }) {
  // Debug: log props
  console.log('LeaveRequestForm props:', { open, requestType: propRequestType });

  // Get studentId and userId from redux store
  const studentId = useSelector(
    (state) => state.student?.studentData?.student_details?.id,
  );
  const studentName = useSelector(
    (state) =>
      state.student?.studentData?.student_details?.user_details?.full_name,
  );

  const userId = useSelector((state) => state.user?.user?.id);
  const userRoles = useSelector((state) => state.user?.user?.roles);
  const userStudentData = useSelector((state) => state.user?.user?.student);
  const userTeacherData = useSelector((state) => state.user?.user?.teacher || state.user?.user?.teacher_profiles);
  const fullUserData = useSelector((state) => state.user?.user);

  // Check user roles
  const normalizedRoles = userRoles?.map((role) =>
    typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()
  ) || [];
  const isStudent = normalizedRoles.includes('student');
  const isTeacher = normalizedRoles.includes('teacher');

  // Determine request type (prop takes precedence, then auto-detect from role)
  const effectiveRequestType = propRequestType || (isTeacher ? 'teacher' : 'student');

  // Debug logging
  useEffect(() => {
    console.log('LeaveRequestForm MOUNTED/UPDATED:', {
      propRequestType,
      isTeacher,
      effectiveRequestType,
      isStudent,
      userRoles
    });
  }, [propRequestType, isTeacher, effectiveRequestType, isStudent, userRoles]);

  // For students, use their own student ID - try multiple paths (NOT fullUserData?.id - that's a user ID!)
  const effectiveStudentId = isStudent ? (userStudentData?.id || userStudentData?.student_id || fullUserData?.student_id || fullUserData?.student?.id) : studentId;
  const effectiveStudentName = isStudent ? (userStudentData?.user?.full_name || fullUserData?.full_name || fullUserData?.name) : studentName;

  // For teachers, use their own teacher ID - try multiple paths
  const effectiveTeacherId = userTeacherData?.id || userTeacherData?.teacher_id || fullUserData?.teacher_id || fullUserData?.teacher?.id;

  // Local form state
  const [leaveType, setLeaveType] = useState('full_day');
  const [subjectId, setSubjectId] = useState('');
  const [periodType, setPeriodType] = useState('all');
  const [periodNumber, setPeriodNumber] = useState('');
  const [date, setDate] = useState(null);
  const [reason, setReason] = useState('');
  const [subjects, setSubjects] = useState([]);

  // Teacher-specific state for Class → Section → Subject flow
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  // State to store fetched IDs if not in Redux
  const [fetchedTeacherId, setFetchedTeacherId] = useState(null);
  const [fetchedStudentId, setFetchedStudentId] = useState(null);

  // Use fetched IDs if Redux doesn't have them
  const finalTeacherId = effectiveTeacherId || fetchedTeacherId;
  const finalStudentId = effectiveStudentId || fetchedStudentId;

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Fetch teacher profile if not in Redux and user is a teacher
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      console.log('Teacher profile fetch check:', { open, isTeacher, effectiveTeacherId, userId });
      if (!open || !isTeacher || effectiveTeacherId) {
        console.log('Skipping teacher profile fetch:', { open, isTeacher, effectiveTeacherId });
        return;
      }

      try {
        const token = await GetToken();
        const url = `${Backend.api}teachers/?user_id=${userId}`;
        console.log('Fetching teacher profile from:', url);
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        const res = await axios.get(url, { headers });
        console.log('Teacher API response:', res.data);
        const data = Array.isArray(res.data.data)
          ? res.data.data
          : res.data?.results || [];

        console.log('Teacher data from API:', data);
        if (data.length > 0) {
          console.log('Setting fetchedTeacherId to:', data[0].id);
          setFetchedTeacherId(data[0].id);
        } else {
          console.log('No teacher data found in API response');
        }
      } catch (err) {
        console.error('Failed to fetch teacher profile:', err);
      }
    };

    fetchTeacherProfile();
  }, [open, isTeacher, effectiveTeacherId, userId]);

  // Fetch student profile if not in Redux and user is a student
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!open || !isStudent || effectiveStudentId) return;

      try {
        const token = await GetToken();
        const url = `${Backend.api}students/?user_id=${userId}`;
        console.log('Fetching student profile from:', url);
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        const res = await axios.get(url, { headers });
        console.log('Student API response:', res.data);
        const data = Array.isArray(res.data.data)
          ? res.data.data
          : res.data?.results || [];

        console.log('Student data from API:', data);
        if (data.length > 0) {
          console.log('Setting fetchedStudentId to:', data[0].id);
          setFetchedStudentId(data[0].id);
        } else {
          console.log('No student data found in API response');
        }
      } catch (err) {
        console.error('Failed to fetch student profile:', err);
      }
    };

    fetchStudentProfile();
  }, [open, isStudent, effectiveStudentId, finalStudentId, userId]);

  function resetForm() {
    setLeaveType('full_day');
    setSubjectId('');
    setPeriodType('all');
    setPeriodNumber('');
    setDate(null);
    setReason('');
    setError('');
    setLoading(false);

    // Reset teacher-specific state
    setSelectedClassId('');
    setSelectedSectionId('');
    setAvailableSections([]);
    setAvailableSubjects([]);
  }

  const validate = () => {
    // Validate based on request type
    if (effectiveRequestType === 'student') {
      if (!effectiveStudentId && !finalStudentId) {
        if (isStudent) {
          return 'Unable to resolve your student profile. Please contact support.';
        }
        return 'No student selected. Please select a student from the sidebar.';
      }
    } else if (effectiveRequestType === 'teacher') {
      if (!finalTeacherId) {
        console.log('Teacher data debug:', { userTeacherData, fullUserData, userId, fetchedTeacherId });
        return 'Unable to resolve your teacher profile. Please ensure your account is properly linked as a teacher. If the problem persists, contact support.';
      }
    }

    if (!userId) {
      return 'Unable to resolve your user ID. Please sign in again.';
    }
    if (!date) {
      return 'Please pick a date for the leave.';
    }
    if (!reason || reason.trim().length < 3) {
      return 'Please provide a short reason (at least 3 characters).';
    }
    if (leaveType === 'subject') {
      if (!subjectId) return 'Please select a subject for subject-level leave.';
      if (!periodType) return 'Please select a period type (all / specific).';
      if (
        periodType === 'specific' &&
        (!periodNumber || Number.isNaN(Number(periodNumber)))
      ) {
        return 'Please provide a valid period number for the specific period.';
      }
    }
    return null;
  };

  // Fetch subjects for students
  useEffect(() => {
    const fetchSubjects = async () => {
      console.log('Student subject fetch - effectiveStudentId:', effectiveStudentId, 'finalStudentId:', finalStudentId, 'effectiveRequestType:', effectiveRequestType);
      if ((!effectiveStudentId && !finalStudentId) || effectiveRequestType !== 'student') {
        console.log('Skipping subject fetch - no student ID or not student mode');
        return;
      }

      try {
        const token = await GetToken();
        const studentIdToUse = effectiveStudentId || finalStudentId;
        const url = `${Backend.api}student_subjects/?student_id=${studentIdToUse}`;
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        const res = await axios.get(url, { headers: headers });
        const data = Array.isArray(res.data.data)
          ? res.data.data
          : res.data?.results || [];

        // Since API already filters by student_id, use all returned data
        // The API returns student_subject records with subject_details nested object
        const subjectsList = data.map((s) => {
          // API returns subject_details with id, name, code fields
          const subjectDetails = s.subject_details;
          const subjectId = subjectDetails?.id || s.id;
          const subjectName = subjectDetails?.name || 'Unknown Subject';
          const subjectCode = subjectDetails?.code || '';
          return {
            id: subjectId,
            name: subjectName,
            code: subjectCode,
            raw: s  // keep original for reference
          };
        }).filter(s => s.id);  // Only keep items with valid IDs

        console.log('Processed subjects:', subjectsList.length, 'items');
        console.log('Subjects list:', subjectsList);
        setSubjects(subjectsList);
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };

    if (open && effectiveRequestType === 'student') {
      fetchSubjects();
    }
  }, [effectiveStudentId, finalStudentId, effectiveStudentName, isStudent, open, effectiveRequestType]);

  // Fetch teacher assignments for teachers
  useEffect(() => {
    const fetchTeacherAssignments = async () => {
      console.log('Teacher assignments fetch - finalTeacherId:', finalTeacherId, 'effectiveRequestType:', effectiveRequestType, 'open:', open);
      if (!finalTeacherId || effectiveRequestType !== 'teacher') {
        console.log('Skipping teacher assignments fetch - no teacher ID or not teacher mode');
        return;
      }

      try {
        const token = await GetToken();
        const url = `${Backend.api}teacher_assignments/?teacher_id=${finalTeacherId}`;
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        const res = await axios.get(url, { headers });
        console.log('Teacher assignments API response:', res.data);
        const data = Array.isArray(res.data.data)
          ? res.data.data
          : res.data?.results || [];
        console.log('Teacher assignments data:', data.length, 'items');
        console.log('First assignment:', data[0]);

        setTeacherAssignments(data);

        // Extract unique classes
        const classesMap = new Map();
        data.forEach(assignment => {
          // API returns class_details with grade field
          const classId = assignment.class_details?.id || assignment.class_fk?.id || assignment.class_id;
          const className = assignment.class_details?.grade || assignment.class_fk?.grade || `Grade ${assignment.class_details?.grade}`;
          console.log('Extracting class:', { classId, className, assignment });
          if (classId && !classesMap.has(classId)) {
            classesMap.set(classId, { id: classId, name: className || `Grade ${classId}` });
          }
        });
        console.log('Available classes:', Array.from(classesMap.values()));
        setAvailableClasses(Array.from(classesMap.values()));
      } catch (err) {
        console.error('Failed to fetch teacher assignments:', err);
      }
    };

    if (open && effectiveRequestType === 'teacher') {
      fetchTeacherAssignments();
    }
  }, [finalTeacherId, open, effectiveRequestType]);

  // Update sections when class is selected
  useEffect(() => {
    if (!selectedClassId || effectiveRequestType !== 'teacher') {
      setAvailableSections([]);
      return;
    }

    // Extract unique sections for the selected class
    const sectionsMap = new Map();
    teacherAssignments
      .filter(a => (a.class_details?.id || a.class_fk?.id || a.class_id) === selectedClassId)
      .forEach(assignment => {
        const sectionId = assignment.section_details?.id || assignment.section?.id || assignment.section_id;
        const sectionName = assignment.section_details?.name || assignment.section?.name || assignment.section_name;
        if (sectionId && !sectionsMap.has(sectionId)) {
          sectionsMap.set(sectionId, { id: sectionId, name: sectionName });
        }
      });
    setAvailableSections(Array.from(sectionsMap.values()));

    // Reset section and subject when class changes
    setSelectedSectionId('');
    setSubjectId('');
    setAvailableSubjects([]);
  }, [selectedClassId, teacherAssignments, effectiveRequestType]);

  // Update subjects when section is selected
  useEffect(() => {
    if (!selectedClassId || !selectedSectionId || effectiveRequestType !== 'teacher') {
      setAvailableSubjects([]);
      return;
    }

    // Extract subjects for the selected class and section
    const subjectsMap = new Map();
    teacherAssignments
      .filter(a =>
        (a.class_details?.id || a.class_fk?.id || a.class_id) === selectedClassId &&
        (a.section_details?.id || a.section?.id || a.section_id) === selectedSectionId
      )
      .forEach(assignment => {
        const subjectId = assignment.subject_details?.id || assignment.subject?.id || assignment.subject_id;
        const subjectName = assignment.subject_details?.name || assignment.subject?.name || assignment.subject_name;
        if (subjectId && !subjectsMap.has(subjectId)) {
          subjectsMap.set(subjectId, { id: subjectId, name: subjectName });
        }
      });
    setAvailableSubjects(Array.from(subjectsMap.values()));

    // Reset subject when section changes
    setSubjectId('');
  }, [selectedClassId, selectedSectionId, teacherAssignments, effectiveRequestType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      request_type: effectiveRequestType,
      requested_by: userId,
      date: dayjs(date).format('YYYY-MM-DD'),
      reason: reason.trim(),
    };

    // Add type-specific fields
    const studentIdToSend = effectiveStudentId || finalStudentId;
    console.log('Sending leave request with student_id:', studentIdToSend, 'effectiveStudentId:', effectiveStudentId, 'finalStudentId:', finalStudentId);
    if (effectiveRequestType === 'student') {
      payload.student_id = studentIdToSend;
    } else if (effectiveRequestType === 'teacher') {
      payload.teacher_id = finalTeacherId;
    }

    // Add subject info if applicable
    if (leaveType === 'subject') {
      payload.subject_id = subjectId;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const url = `${Backend.api}${Backend.leaveRequests}`;
      const res = await axios.post(url, payload, { headers: header });
      setLoading(false);
      setSuccessOpen(true);
      toast.success('Leave request created successfully');
      if (onSuccess) onSuccess(res.data);
      setTimeout(() => {
        setSuccessOpen(false);
        onClose();
      }, 800);
    } catch (err) {
      setLoading(false);
      const message =
        err?.response?.data?.detail ||
        err?.response?.data ||
        err.message ||
        'Failed to create leave request';
      setError(typeof message === 'string' ? message : JSON.stringify(message));
      toast.error('Failed to create leave request');
    }
  };
  console.log('Rendering LeaveRequestForm with state:', subjects);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Create Leave Request</DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={2}>
              {/* Leave Type */}
              <FormControl fullWidth>
                <InputLabel id="leave-type-label">Leave Type</InputLabel>
                <Select
                  labelId="leave-type-label"
                  value={leaveType}
                  label="Leave Type"
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <MenuItem value="full_day">Full day</MenuItem>
                  <MenuItem value="subject">Subject / Period</MenuItem>
                </Select>
              </FormControl>

              {/* Subject selection - different flows for students and teachers */}
              {leaveType === 'subject' && (
                <>
                  {effectiveRequestType === 'teacher' ? (
                    /* Teacher flow: Class → Section → Subject */
                    <>
                      <FormControl fullWidth>
                        <InputLabel id="class-label">Class</InputLabel>
                        <Select
                          labelId="class-label"
                          value={selectedClassId}
                          label="Class"
                          onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                          {availableClasses.map((cls) => (
                            <MenuItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth disabled={!selectedClassId || availableSections.length === 0}>
                        <InputLabel id="section-label">Section</InputLabel>
                        <Select
                          labelId="section-label"
                          value={selectedSectionId}
                          label="Section"
                          onChange={(e) => setSelectedSectionId(e.target.value)}
                        >
                          {availableSections.map((section) => (
                            <MenuItem key={section.id} value={section.id}>
                              {section.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth disabled={!selectedSectionId || availableSubjects.length === 0}>
                        <InputLabel id="subject-label">Subject</InputLabel>
                        <Select
                          labelId="subject-label"
                          value={subjectId}
                          label="Subject"
                          onChange={(e) => setSubjectId(e.target.value)}
                        >
                          {availableSubjects.map((subj) => (
                            <MenuItem key={subj.id} value={subj.id}>
                              {subj.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  ) : (
                    /* Student flow: Direct subject selection */
                    <FormControl fullWidth>
                      <InputLabel id="subject-label">Subject</InputLabel>
                      <Select
                        labelId="subject-label"
                        value={subjectId}
                        label="Subject"
                        onChange={(e) => setSubjectId(e.target.value)}
                      >
                        {subjects.map((subject) => (
                          <MenuItem key={subject?.id} value={subject?.id}>
                            {subject?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <FormControl fullWidth>
                    <InputLabel id="period-type-label">Period Type</InputLabel>
                    <Select
                      labelId="period-type-label"
                      value={periodType}
                      label="Period Type"
                      onChange={(e) => setPeriodType(e.target.value)}
                    >
                      <MenuItem value="all">All periods</MenuItem>
                      <MenuItem value="specific">Specific period</MenuItem>
                    </Select>
                  </FormControl>

                  {periodType === 'specific' && (
                    <TextField
                      label="Period Number"
                      type="number"
                      fullWidth
                      value={periodNumber}
                      onChange={(e) => setPeriodNumber(e.target.value)}
                      inputProps={{ min: 1 }}
                    />
                  )}
                </>
              )}

              {/* Date */}
              <DatePicker
                label="Date"
                value={date}
                onChange={(newVal) => setDate(newVal)}
                slotProps={{ textField: { fullWidth: true } }}
              />

              {/* Reason */}
              <TextField
                label="Reason"
                minRows={3}
                multiline
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Short explanation for the leave"
              />

              {/* Error if any */}
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" type="submit" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Send Request'}
            </Button>
          </DialogActions>
        </form>

        <Snackbar
          open={successOpen}
          autoHideDuration={2000}
          onClose={() => setSuccessOpen(false)}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            Leave request created successfully
          </Alert>
        </Snackbar>
      </Dialog>
    </LocalizationProvider>
  );
}

LeaveRequestForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  requestType: PropTypes.oneOf(['student', 'teacher']),
};
