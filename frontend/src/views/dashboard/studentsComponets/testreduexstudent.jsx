import React, { useEffect, useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Select,
  MenuItem,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { useSelector } from 'react-redux';

const StudentDropdown = ({
  selectedStudentId,
  handleStudentChange,
  onStudentSelect,
  sx = {},
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { students } = useSelector((state) => state.student);

  const handleChange = (event) => {
    const studentId = event.target.value;
    handleStudentChange(event);

    // Find the selected student and pass to callback
    const selectedStudent = students.find(
      (student) => student.id === studentId,
    );
    if (selectedStudent && onStudentSelect) {
      onStudentSelect(selectedStudent);
    }
  };

  const fetchStudentData = async (studentId) => {
    try {
      setLoading(true);
      const token = await GetToken();
      const apiUrl = `${Backend.auth}${Backend.parentStudentsDashboard}${studentId}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student data');
      }

      const data = await response.json();
      if (data.success) {
        // Return the data needed by the parent (e.g., upcoming_assignments)
        return data.data;
      } else {
        throw new Error(data.message || 'No data available');
      }
    } catch (err) {
      console.error('Error loading child profile:', err);
      // Optionally, you can show a toast or set error state here
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemClick = (studentId) => {
    const selectedStudent = students.find((s) => s.id === studentId);
    // Determine the correct student ID to navigate to
    const targetId = selectedStudent?.student_details?.id || selectedStudent?.id;
    if (targetId) {
      navigate(`/child-profile/${targetId}`);
    }
  };
  const handleStudentSelectClick = async (studentId) => {
    const selectedStudent = students.find((s) => s.id === studentId);
    if (!selectedStudent) return;

    handleStudentChange({ target: { value: studentId } }); // update selected ID in parent

    const targetId = selectedStudent?.student_details?.id || selectedStudent?.id;
    if (!targetId) return;

    try {
      setLoading(true);
      const response = await fetchStudentData(targetId);

      if (onStudentSelect && response.upcoming_assignments) {
        onStudentSelect({
          ...selectedStudent,
          upcoming_assignments: response.upcoming_assignments,
        });
      }
      if (onStudentSelect && response.schedule) {
        onStudentSelect({
          ...selectedStudent,
          schedule: response.schedule,
        });
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClick = (studentId, event) => {
    event.stopPropagation();
    handleMenuItemClick(studentId);
  };

  useEffect(() => {
    const loadInitialStudentData = async () => {
      if (!selectedStudentId || !students.length) return;

      const targetId = selectedStudent?.student_details?.id || selectedStudent?.id;
      if (!selectedStudent || !targetId) return;

      try {
        setLoading(true);
        const response = await fetchStudentData(targetId);

        if (onStudentSelect) {
          onStudentSelect({
            ...selectedStudent,
            upcoming_assignments: response.upcoming_assignments || [],
            behavior_ratings: response.behavior_ratings || null,
            attendance: response.attendance || null,
            health: response.health || null,
            schedule: response.schedule || [],
          });
        }
      } catch (error) {
        console.error('Initial student fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialStudentData();
  }, [selectedStudentId, students]);
  return (
    <Box sx={{ mb: 3, position: 'relative', ...sx }}>
      {loading && (
        <CircularProgress
          size={24}
          sx={{
            position: 'absolute',
            top: '50%',
            right: 40,
            transform: 'translateY(-50%)',
            zIndex: 1,
          }}
        />
      )}
      <Select
        value={selectedStudentId}
        onChange={handleChange}
        displayEmpty
        // fullWidth={fullWidth}
        disabled={loading}
        sx={{
          bgcolor: 'white',
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            padding: '8px 32px 8px 14px',
          },
        }}
        renderValue={(selected) => {
          if (!selected) {
            return <Typography color="textSecondary">{label}</Typography>;
          }
          const student = students.find((s) => s.id === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 36, height: 36 }}>
                <Person />
              </Avatar>
              <Box>
                <Typography fontWeight="bold">
                  {student?.student_details?.user_details?.full_name ||
                    'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[
                    (student?.student_details?.grade_details?.grade || student?.student_details?.section_details?.class_details?.grade) 
                      ? `Grade ${student?.student_details?.grade_details?.grade || student?.student_details?.section_details?.class_details?.grade}` 
                      : null,
                    student?.student_details?.section_details?.name 
                      ? `Section ${student?.student_details?.section_details?.name}` 
                      : null
                  ].filter(Boolean).join(' • ')}
                </Typography>
              </Box>
            </Box>
          );
        }}
      >
        {students.map((student) => (
          <MenuItem
            key={student.id}
            value={student.id}
            sx={{ py: 1.5 }}
            onClick={() => handleStudentSelectClick(student.id)} // <- Trigger fetch even if same ID
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexGrow: 1,
                }}
              >
                <Avatar sx={{ width: 36, height: 36 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography fontWeight="bold">
                    {student.student_details?.user_details?.full_name ||
                      'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[
                      (student?.student_details?.grade_details?.grade || student?.student_details?.section_details?.class_details?.grade) 
                        ? `Grade ${student?.student_details?.grade_details?.grade || student?.student_details?.section_details?.class_details?.grade}` 
                        : null,
                      student?.student_details?.section_details?.name 
                        ? `Section ${student?.student_details?.section_details?.name}` 
                        : null
                    ].filter(Boolean).join(' • ')}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => handleOpenClick(student.id, e)}
                sx={{ ml: 2 }}
              >
                Open
              </Button>
            </Stack>
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

export default StudentDropdown;
