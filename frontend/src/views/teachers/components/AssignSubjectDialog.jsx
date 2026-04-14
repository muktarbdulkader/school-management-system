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

const AssignSubjectDialog = ({ open, onClose, teacherId, onAssignmentSuccess }) => {
  const [allSubjects, setAllSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classSubjectsMap, setClassSubjectsMap] = useState({});

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open]);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
      // Filter subjects for selected class
      const classSubjects = classSubjectsMap[selectedClass] || [];
      setFilteredSubjects(classSubjects);
      setSelectedSubject('');
    } else {
      setSections([]);
      setFilteredSubjects([]);
      setSelectedSection('');
      setSelectedSubject('');
    }
  }, [selectedClass, classSubjectsMap]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = await GetToken();

      const [subjectsRes, classesRes, classSubjectsRes, termsRes] = await Promise.all([
        fetch(`${Backend.api}${Backend.subjects}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${Backend.api}${Backend.classes}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${Backend.api}${Backend.classSubjects}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${Backend.api}${Backend.terms}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setAllSubjects(data.data || data.results || []);
      }

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.data || data.results || []);
      }

      if (termsRes.ok) {
        const data = await termsRes.json();
        const termsData = data.data || data.results || [];
        // Filter only active terms
        const activeTerms = termsData.filter(t => t.is_active !== false);
        setTerms(activeTerms);
        // Auto-select first active term
        if (activeTerms.length > 0 && !selectedTerm) {
          setSelectedTerm(activeTerms[0].id);
        }
      }

      // Build class-subjects mapping from class_subjects API
      if (classSubjectsRes.ok) {
        const data = await classSubjectsRes.json();
        const classSubjectsData = data.data || data.results || [];
        const classSubjects = {};
        classSubjectsData.forEach(mapping => {
          // class_fk is write_only in serializer, use class_details instead
          const classId = mapping.class_fk || mapping.class_id || mapping.class_details?.id;
          if (classId) {
            if (!classSubjects[classId]) {
              classSubjects[classId] = [];
            }
            // Use subject_details or subject from the mapping
            const subject = mapping.subject_details || mapping.subject;
            if (subject && !classSubjects[classId].find(s => s.id === subject.id)) {
              classSubjects[classId].push(subject);
            }
          }
        });
        setClassSubjectsMap(classSubjects);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (classId) => {
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.sections}?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSections(data.data || data.results || []);
      }
    } catch (e) {
      console.error('Error fetching sections:', e);
    }
  };

  const handleAssign = async () => {
    if (!selectedSubject || !selectedClass || !selectedSection) {
      toast.error('Please select class, section and subject');
      return;
    }

    setAssigning(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.teacherAssignments}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacher: teacherId,
          subject: selectedSubject,
          class_fk: selectedClass,
          section: selectedSection,
          term: selectedTerm || null,
          is_primary: isPrimary,
          is_active: true
        })
      });

      if (res.ok) {
        toast.success('Teacher assigned to subject successfully');
        if (onAssignmentSuccess) onAssignmentSuccess();
        onClose();
        resetFields();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to assign teacher');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    } finally {
      setAssigning(false);
    }
  };

  const resetFields = () => {
    setSelectedSubject('');
    setSelectedClass('');
    setSelectedSection('');
    setSelectedTerm('');
    setIsPrimary(false);
  };

  const handleClose = () => {
    setSelectedSubject('');
    setSelectedClass('');
    setSelectedSection('');
    setSelectedTerm('');
    setIsPrimary(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconBook size={20} />
          <Typography variant="h4">Assign Subject to Teacher</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Stack alignItems="center" py={3}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Select Class"
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.grade} ({cls.branch_details?.name || 'Main Branch'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!selectedClass}>
              <InputLabel>Select Section *</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                label="Select Section *"
              >
                <MenuItem value="">Select Section</MenuItem>
                {sections.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!selectedClass || filteredSubjects.length === 0}>
              <InputLabel>
                {filteredSubjects.length === 0 && selectedClass
                  ? 'No subjects available for this class'
                  : 'Select Subject'}
              </InputLabel>
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Select Subject"
              >
                {filteredSubjects.length === 0 && selectedClass && (
                  <MenuItem disabled>No subjects assigned to this class</MenuItem>
                )}
                {filteredSubjects.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.name} {sub.code ? `(${sub.code})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={terms.length === 0}>
              <InputLabel>Term</InputLabel>
              <Select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                label="Term"
              >
                {terms.map((term) => (
                  <MenuItem key={term.id} value={term.id}>
                    {term.name} {term.academic_year ? `(${term.academic_year})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Assignment Type</InputLabel>
              <Select
                value={isPrimary ? 'primary' : 'secondary'}
                onChange={(e) => setIsPrimary(e.target.value === 'primary')}
                label="Assignment Type"
              >
                <MenuItem value="primary">Primary Assignment</MenuItem>
                <MenuItem value="secondary">Secondary Assignment</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={assigning}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={assigning || !selectedSubject || !selectedClass || !selectedSection}
        >
          {assigning ? <CircularProgress size={18} /> : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignSubjectDialog;
