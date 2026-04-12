import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  CircularProgress
} from '@mui/material';
import { IconBook } from '@tabler/icons-react';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-hot-toast';

const EnrollSubjectDialog = ({ open, onClose, studentId, classId, className, onEnrollmentSuccess }) => {
  const [subjects, setSubjects] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classId || '');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [bulkEnrolling, setBulkEnrolling] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableClasses();
      if (selectedClass) {
        fetchSubjectsByClass(selectedClass);
      } else {
        fetchSubjects();
      }
    }
  }, [open, selectedClass]);

  const fetchAvailableClasses = async () => {
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}classes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableClasses(data.data || data.results || []);
      }
    } catch (e) {
      console.error('Error fetching classes:', e);
    }
  };

  const fetchSubjectsByClass = async (classIdToFetch) => {
    setLoading(true);
    try {
      const token = await GetToken();
      // First try to get class_subjects for this class
      const res = await fetch(`${Backend.api}class_subjects/?class_fk=${classIdToFetch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const classSubjects = data.data || data.results || [];
        // Extract subjects from class_subjects
        const subjectsList = classSubjects.map(cs => cs.subject_details || cs.subject).filter(Boolean);
        setSubjects(subjectsList);
        if (subjectsList.length === 0) {
          toast.info('No subjects found for this class');
        }
      } else {
        // Fallback: fetch all subjects
        fetchSubjects();
      }
    } catch (e) {
      console.error('Error fetching subjects by class:', e);
      fetchSubjects();
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.subjects}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.data || data.results || []);
      }
    } catch (e) {
      console.error('Error fetching subjects:', e);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEnroll = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    if (!studentId) {
      toast.error('Student ID is required');
      return;
    }

    setBulkEnrolling(true);
    try {
      const token = await GetToken();
      // Use the single-student bulk enrollment endpoint
      const res = await fetch(`${Backend.api}classes/enroll_student_all_subjects/${selectedClass}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_id: studentId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Bulk enrollment successful');
        onEnrollmentSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Bulk enrollment failed');
      }
    } catch (e) {
      toast.error('Error during bulk enrollment: ' + e.message);
    } finally {
      setBulkEnrolling(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    setEnrolling(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.studentSubjects}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          subject_id: selectedSubject
        })
      });

      if (res.ok) {
        toast.success('Student enrolled in subject successfully');
        onEnrollmentSuccess();
        onClose();
        setSelectedSubject('');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to enroll student');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    } finally {
      setEnrolling(false);
    }
  };

  const selectedClassName = availableClasses.find(c => c.id === selectedClass)?.grade ||
    availableClasses.find(c => c.id === selectedClass)?.name ||
    className || 'Selected Class';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconBook size={20} />
          <Typography variant="h6">Enroll In Subject</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {/* Class Selector */}
          <FormControl fullWidth>
            <InputLabel>Select Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubject(''); // Reset subject when class changes
              }}
              label="Select Class"
            >
              <MenuItem value="">
                <em>Choose a class</em>
              </MenuItem>
              {availableClasses.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  Grade {cls.grade} {cls.branch_details?.name ? `- ${cls.branch_details.name}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Bulk Enroll Button */}
          {selectedClass && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleBulkEnroll}
              disabled={bulkEnrolling || subjects.length === 0}
              fullWidth
            >
              {bulkEnrolling ? <CircularProgress size={18} /> : `Enroll All Subjects for Grade ${selectedClassName}`}
            </Button>
          )}

          <Typography variant="caption" color="text.secondary">
            Or select individual subjects below:
          </Typography>

          {/* Subject Selector - Filtered by Class */}
          {loading ? (
            <Stack alignItems="center" py={3}>
              <CircularProgress size={24} />
            </Stack>
          ) : (
            <FormControl fullWidth>
              <InputLabel>
                {selectedClass ? `Subjects for Grade ${selectedClassName} (${subjects.length})` : 'Select a class first'}
              </InputLabel>
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Select Subject"
                disabled={!selectedClass || subjects.length === 0}
              >
                {subjects.length === 0 ? (
                  <MenuItem disabled>
                    <em>No subjects available for this class</em>
                  </MenuItem>
                ) : (
                  subjects.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>{sub.name}</Typography>
                        {sub.code && (
                          <Typography variant="caption" color="text.secondary">
                            ({sub.code})
                          </Typography>
                        )}
                      </Stack>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}

          {selectedClass && subjects.length === 0 && !loading && (
            <Typography variant="body2" color="error">
              No subjects found for Grade {selectedClassName}. Please add subjects to this class first.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={enrolling || bulkEnrolling}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleEnroll}
          disabled={enrolling || !selectedSubject || bulkEnrolling}
        >
          {enrolling ? <CircularProgress size={18} /> : 'Enroll Selected Subject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnrollSubjectDialog;
