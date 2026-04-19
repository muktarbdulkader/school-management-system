import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
} from '@mui/material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';

export default function LessonFeedbackModal({
  open,
  onClose,
  onSucceed,
  planId, // <-- comes as prop
  classId, // <-- comes as prop
}) {
  const [section, setSection] = useState('');
  const [sections, setSections] = useState([]);
  const [workedWell, setWorkedWell] = useState('');
  const [toBeImproved, setToBeImproved] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  // Fetch sections for the class
  const fetchSections = async () => {
    if (!classId) {
      console.log('No classId provided');
      return;
    }

    try {
      const token = await GetToken();
      setLoading(true);

      // Fetch sections for this class
      const API = `${Backend.api}${Backend.sections}?class_id=${classId}`;

      const res = await fetch(API, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      console.log('Sections API response:', data);

      if (data.success && data.data) {
        const formattedSections = data.data.map((sec) => ({
          section_id: sec.id,
          section_name: sec.name || `Section ${sec.name}`,
        }));
        setSections(formattedSections);
      } else {
        // Fallback: try to use class_fk_details from plan if available
        console.log('No sections found in API, trying alternative...');
        setSections([]);
      }
    } catch (err) {
      toast.error('Failed to fetch sections');
      console.error('Failed to fetch sections', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    const API = `${Backend.api}${Backend.lessonPlanEvaluations}`;
    const token = await GetToken();
    try {
      setLoading(true);
      const res = await fetch(`${API}?lesson_plan_id=${planId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Response from feedback fetch:', res);
      const data = await res.json();
      if (data.success) {
        console.log('Fetched feedback data:', data);
        setSection(data.data.section_id);
        setWorkedWell(data.data.worked_well);
        setToBeImproved(data.data.to_be_improved);
      }
    } catch (err) {
      console.error('Failed to fetch feedback', err);
    } finally {
      setLoading(false);
    }
  };

  // fetchFeedback();

  useEffect(() => {
    if (!open) return;
    fetchSections();
  }, [open, classId]);



  const handleSubmit = async () => {
    const payload = {
      lesson_plan_id: planId,
      section,
      worked_well: workedWell,
      to_be_improved: toBeImproved,
    };
    const API = Backend.api + Backend.lessonPlanEvaluations;
    try {
      setPosting(true);
      const token = await GetToken();
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to submit feedback');
      console.log('Feedback submitted successfully', res);
      toast.success('Feedback submitted successfully');
      if (onSucceed) onSucceed(); // notify parent to refresh plans
      onClose(true); // success callback
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong!');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Lesson Feedback</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField
              select
              label="Class Section"
              fullWidth
              margin="normal"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              helperText="Select which class section this feedback is for (e.g., Section A, B, C)"
            >
              {sections.length === 0 && (
                <MenuItem disabled value="">
                  No sections available for this class
                </MenuItem>
              )}
              {sections.map((s) => (
                <MenuItem key={s.section_id} value={s.section_id}>
                  {s.section_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="What Worked Well"
              fullWidth
              margin="normal"
              multiline
              minRows={3}
              value={workedWell}
              onChange={(e) => setWorkedWell(e.target.value)}
            />

            <TextField
              label="To Be Improved"
              fullWidth
              margin="normal"
              multiline
              minRows={3}
              value={toBeImproved}
              onChange={(e) => setToBeImproved(e.target.value)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={posting || !workedWell || !toBeImproved}
          variant="contained"
        >
          {posting ? <CircularProgress size={20} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
