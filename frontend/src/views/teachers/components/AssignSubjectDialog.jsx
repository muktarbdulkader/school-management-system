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
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

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
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = await GetToken();

      const [subjectsRes, classesRes] = await Promise.all([
        fetch(`${Backend.api}${Backend.subjects}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${Backend.api}${Backend.classes}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(data.data || data.results || []);
      }

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.data || data.results || []);
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
          section: selectedSection
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
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
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

            <FormControl fullWidth>
              <InputLabel>Select Subject</InputLabel>
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Select Subject"
              >
                {subjects.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.name} {sub.code ? `(${sub.code})` : ''}
                  </MenuItem>
                ))}
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
