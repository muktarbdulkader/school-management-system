import React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  Divider,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AddIcon from '@mui/icons-material/Add';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GetToken from 'utils/auth-token';
import { toast, ToastContainer } from 'react-toastify';
import Backend from 'services/backend';
import CreateMessageForm from './CreateMessage';
import { useNavigate } from 'react-router-dom';
import GroupChats from './group-chats';
import { DraftItem } from './DraftItem';
import StudentDropdownMessg from './StudentDropdownMessg';
import { setRelationshipId, setStudentId } from 'store/slices/active-student';
import { useDispatch, useSelector } from 'react-redux';

function ConversationItem({
  name,
  message,
  timestamp,
  is_read,
  onClick,
  isSelected,
}) {
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ListItem
      button
      onClick={onClick}
      sx={{
        py: 1.5,
        px: 2,
        mb: 0.5,
        '&:hover': {
          bgcolor: 'primary.light',
          '& .MuiTypography-root': {
            color: 'text.primary',
          },
        },
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease',
        borderColor: 'primary.main',
      }}
    >
      <ListItemAvatar>
        <Avatar
          alt={name}
          sx={{
            width: 48,
            height: 48,
            bgcolor: isSelected ? 'primary.main' : 'grey.300',
            color: isSelected ? 'white' : 'grey.700',
            fontWeight: 600,
            fontSize: '1.1rem',
          }}
        >
          {name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              noWrap
              sx={{ maxWidth: '120px' }}
            >
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formattedTime}
            </Typography>
          </Box>
        }
        secondary={
          <>
            <Typography
              sx={{ display: 'block', mt: 0.5 }}
              component="span"
              variant="body2"
              color="text.secondary"
              noWrap
            >
              {message}
            </Typography>
          </>
        }
        sx={{ ml: 1, overflow: 'hidden' }}
      />
      {!is_read && (
        <FiberManualRecordIcon
          sx={{ fontSize: 12, color: 'primary.main', ml: 1, flexShrink: 0 }}
        />
      )}
    </ListItem>
  );
}

export function Sidebar({
  onSelectConversation,
  onSelectGroup,
  selectedConversation,
  selectedGroup,
  onTabChange,
}) {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [groupConversations, setGroupConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [add, setAdd] = useState(false);
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ last_page: 1, total: 0 });
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [students, setStudents] = useState([]);
  // const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentConversations, setStudentConversations] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [studentContext, setStudentContext] = useState(null);
  const dispatch = useDispatch();
  const studentId = useSelector((state) => state.student.studentId);
  // const relationshipId = useSelector((state) => state.student.relationshipId);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Get student data from Redux
  // const studentState = useSelector((state) => state.student);
  // const relationshipId = studentState.relationshipId;
  // const actualStudentId = studentState.studentId;
  const { studentId: actualStudentId, relationshipId } = useSelector(
    (state) => state.student,
  );

  // useEffect(() => {
  //   if (selectedSubjectId) {
  //     const filtered = studentConversations.filter(
  //       (conversation) => conversation.subject_id === selectedSubjectId,
  //     );
  //     setFilteredConversations(filtered);
  //   } else {
  //     setFilteredConversations(studentConversations);
  //   }
  // }, [selectedSubjectId, studentConversations]);

  // useEffect(() => {
  //   if (studentId && students.length > 0) {
  //     const selectedStudent = students.find((s) => s.id === studentId);
  //     if (selectedStudent) {
  //       fetchStudentConversations(selectedStudent.student_details.id);
  //     }
  //   }
  // }, [studentId, students]);

  // useEffect(() => {
  //   if (studentId && students.length > 0) {
  //     // Find the student by relationship ID (which is stored as studentId in Redux)
  //     const selectedStudentRelationship = students.find(
  //       (s) => s.id === studentId,
  //     );
  //     if (selectedStudentRelationship) {
  //       fetchStudentConversations(
  //         selectedStudentRelationship.student_details.id,
  //       );
  //     }
  //   }
  // }, [studentId, students]);

  const fetchStudents = async () => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.parentStudents}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok)
        throw new Error(responseData.message || 'Failed to fetch students');

      if (responseData.success) {
        setStudents(responseData.data);

        // Set the first student as default if no student is selected
        if (responseData.data.length > 0 && !actualStudentId) {
          const firstStudent = responseData.data[0];
          dispatch(setStudentId(firstStudent.id)); // Use relationship ID
          dispatch(setRelationshipId(firstStudent.id));
        }
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (actualStudentId) {
      fetchAvailableTeachers(actualStudentId);
    }
  }, [actualStudentId]);

  useEffect(() => {
    if (actualStudentId) {
      fetchStudentConversations(
        actualStudentId,
        selectedSubjectId,
        selectedTeacherId,
      );
    }
  }, [actualStudentId, selectedSubjectId, selectedTeacherId]);

  useEffect(() => {
    if (selectedTeacherId && actualStudentId) {
      fetchSubjects(selectedTeacherId, actualStudentId);
    } else {
      // Clear subjects when no teacher is selected
      setStudentSubjects([]);
      setSelectedSubjectId('');
    }
  }, [selectedTeacherId, actualStudentId]);

  // const handleSubjectChange = (event) => {
  //   const subjectId = event.target.value;
  //   setSelectedSubjectId(subjectId);

  //   // Reset filtered conversations when changing subject
  //   setFilteredConversations([]);

  //   // Fetch conversations with the selected subject filter
  //   if (studentId && students.length > 0) {
  //     const selectedStudentRelationship = students.find(
  //       (s) => s.id === studentId,
  //     );
  //     if (selectedStudentRelationship) {
  //       fetchStudentConversations(
  //         selectedStudentRelationship.student_details.id,
  //         subjectId, // This should be passed correctly
  //       );
  //     }
  //   }
  // };

  const handleSubjectChange = (event) => {
    const subjectId = event.target.value;
    setSelectedSubjectId(subjectId);
  };

  const handleTeacherChange = (event) => {
    const teacherId = event.target.value;
    setSelectedTeacherId(teacherId);
  };

  useEffect(() => {
    if (studentId && students.length > 0) {
      const selectedStudentRelationship = students.find(
        (s) => s.id === studentId,
      );
      if (selectedStudentRelationship) {
        fetchStudentConversations(
          selectedStudentRelationship.student_details.id,
        );
        // Fetch available teachers for this student
        fetchAvailableTeachers(selectedStudentRelationship.student_details.id);
      }
    }
  }, [studentId, students]);

  // const handleStudentSelect = (studentData) => {
  //   setSelectedStudentId(studentData.id);
  //   if (studentData.conversations) {
  //     setStudentConversations(studentData.conversations);
  //   }
  //   if (studentData.student_context) {
  //     setStudentContext(studentData.student_context);
  //   }
  // };

  // const handleTabChange = (event, newValue) => {
  //   setTabValue(newValue);
  //   if (onTabChange) {
  //     onTabChange(newValue);
  //   }

  //   if (newValue === 0) {
  //     if (studentConversations.length === 0 && selectedStudentId) {
  //       const selectedStudent = students.find(
  //         (s) => s.id === selectedStudentId,
  //       );
  //       if (selectedStudent) {
  //         fetchStudentConversations(selectedStudent.student_details.id);
  //       }
  //     }
  //   } else if (newValue === 2) {
  //     getGroupConversations();
  //   }
  // };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (onTabChange) {
      onTabChange(newValue);
    }

    if (newValue === 0) {
      if (studentConversations.length === 0 && studentId) {
        fetchStudentConversations(studentId);
      }
    } else if (newValue === 2) {
      getGroupConversations();
    }
  };

  const fetchAvailableTeachers = async (studentId) => {
    setLoadingTeachers(true);
    const token = await GetToken();

    // Find the actual student details ID from the relationship
    const student = students.find((s) => s.id === relationshipId);
    const studentDetailsId = student?.student_details?.id;

    if (!studentDetailsId) {
      setLoadingTeachers(false);
      return;
    }

    const Api = `${Backend.auth}${Backend.parentAvailableTeachers}${studentDetailsId}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) throw new Error(responseData.message);
      if (responseData.success) {
        setAvailableTeachers(responseData.data.teachers || []);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchSubjects = async (teacherId, studentId) => {
    setSubjectLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.communicationChatsAvailableSubjectsForStudent}/${actualStudentId}/teacher/${selectedTeacherId}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch subjects');
      }

      if (responseData.success) {
        setStudentSubjects(responseData.data || []);
        setError(false);
      } else {
        toast.warning(responseData.message);
        setStudentSubjects([]);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
      setStudentSubjects([]);
    } finally {
      setSubjectLoading(false);
    }
  };

  const fetchStudentConversations = async (
    studentDetailsId,
    subjectId = null,
  ) => {
    setLoading(true);
    try {
      const token = await GetToken();
      const student = students.find((s) => s.id === relationshipId);
      if (!student) {
        console.error('Student not found in local list');
        return;
      }
      const studentDetailsId = student.student_details.id;

      let Api = `${Backend.auth}${Backend.chatsConversations}${studentDetailsId}/`;

      // Add subject filter if provided
      if (subjectId) {
        Api += `?subject_id=${subjectId}`;
      }

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to fetch conversations',
        );
      }

      if (responseData.success) {
        // If we're filtering by subject, update filteredConversations
        if (subjectId) {
          setFilteredConversations(responseData.data);
        } else {
          // If no subject filter, update the main studentConversations
          setStudentConversations(responseData.data);
        }

        if (responseData.student_context) {
          setStudentContext(responseData.student_context);
        }
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    const conversationWithContext = {
      ...conversation,
      student_context: studentContext,
    };
    onSelectConversation(conversationWithContext);
  };

  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        // Determine which conversations to display
        // const conversationsToDisplay =
        //   selectedSubjectId || selectedTeacherId
        //     ? filteredConversations
        //     : studentConversations;

        return (
          <>
            {availableTeachers.length > 0 && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="teacher-filter-label">
                  Filter by Teacher
                </InputLabel>
                <Select
                  labelId="teacher-filter-label"
                  value={selectedTeacherId}
                  label="Filter by Teacher"
                  onChange={handleTeacherChange}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="">
                    <em>All Teachers</em>
                  </MenuItem>
                  {availableTeachers.map((teacher) => (
                    <MenuItem key={teacher.user_id} value={teacher.user_id}>
                      {teacher.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedTeacherId && (
              <FormControl
                fullWidth
                sx={{ mb: 2 }}
                disabled={subjectLoading || studentSubjects.length === 0}
              >
                <InputLabel id="subject-filter-label">
                  Filter by Subject
                </InputLabel>
                <Select
                  labelId="subject-filter-label"
                  value={selectedSubjectId}
                  label="Filter by Subject"
                  onChange={handleSubjectChange}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="">
                    <em>All Subjects</em>
                  </MenuItem>
                  {studentSubjects.map((subject) => (
                    <MenuItem
                      key={subject.subject_id}
                      value={subject.subject_id}
                    >
                      {subject.subject_name}
                    </MenuItem>
                  ))}
                </Select>
                {subjectLoading && (
                  <CircularProgress
                    size={24}
                    sx={{ position: 'absolute', right: 40, top: '50%' }}
                  />
                )}
              </FormControl>
            )}

            <List disablePadding sx={{ py: 1 }}>
              {studentConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  name={conversation.other_user.full_name}
                  message={conversation.latest_message}
                  timestamp={conversation.last_timestamp}
                  is_read={conversation.unread_count === 0}
                  onClick={() => handleSelectConversation(conversation)}
                  isSelected={selectedConversation?.id === conversation.id}
                />
              ))}
            </List>
          </>
        );

      case 1:
        const allDrafts =
          JSON.parse(localStorage.getItem('draft-messages')) || [];
        return (
          <List disablePadding sx={{ py: 1 }}>
            {allDrafts.map((draft) => (
              <DraftItem
                key={draft.id}
                receiverName={
                  draft.receiverName || `User (${draft.receiverId})`
                }
                message={draft.message}
                timestamp={draft.created_at}
                onClick={() => {
                  setSelectedDraft({
                    ...draft,
                    receiver: draft.receiverId,
                  });
                  setAdd(true);
                }}
              />
            ))}
          </List>
        );

      case 2:
        return (
          <List disablePadding sx={{ py: 1 }}>
            {groupConversations.map((group) => (
              <GroupChats
                key={group.id}
                name={group.name}
                message={group.latest_message || 'No messages yet'}
                timestamp={group.created_at}
                onClick={() => onSelectGroup(group)}
                isSelected={selectedGroup?.id === group.id}
              />
            ))}
          </List>
        );

      default:
        return null;
    }
  };

  const handleMessageModalClose = () => {
    setAdd(false);
  };

  const getGroupConversations = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.groupChats}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to fetch conversations',
        );
      }

      if (responseData.success) {
        setGroupConversations(responseData.data);
        setPagination({
          last_page: responseData.last_page || 1,
          total: responseData.total || responseData.data.length,
        });
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageAddition = async (newMessageData) => {
    if (newMessageData) {
      try {
        if (studentId && students.length > 0) {
          const selectedStudentRelationship = students.find(
            (s) => s.id === studentId,
          );
          if (selectedStudentRelationship) {
            await fetchStudentConversations(
              selectedStudentRelationship.student_details.id,
              selectedSubjectId,
            );
          }
        }
      } catch (error) {
        console.error('Error refreshing conversations:', error);
        toast.error('Failed to refresh conversations');
      }
    }
  };

  const handleAddMessageClick = () => {
    setAdd(true);
  };

  // useEffect(() => {
  //   fetchStudents();
  // }, []);

  useEffect(() => {
    if (tabValue === 2) {
      getGroupConversations();
    }
  }, [tabValue]);

  return (
    <Paper
      elevation={0}
      sx={{
        width: { xs: '100%', md: 390 },
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        borderRadius: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          // bgcolor: alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <TextField
          fullWidth
          placeholder="Search teachers, admins, or messages..."
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 3 },
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              flexGrow: 1,
              borderRadius: 3,
              py: 1,
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                bgcolor: 'primary.dark',
              },
            }}
            onClick={handleAddMessageClick}
          >
            New Message
          </Button>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            sx={{
              flexGrow: 1,
              borderRadius: 3,
              py: 1,
              borderColor: 'primary.main',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'primary.dark',
                borderColor: 'primary.dark',
              },
            }}
            onClick={() => navigate('/meeting-history')}
          >
            Meeting
          </Button>
        </Box>

        {students.length > 0 && relationshipId && (
          <Typography
            variant="body2"
            sx={{ mt: 2, color: 'text.secondary', fontWeight: 'bold' }}
          >
            Student:{' '}
            {students.find((s) => s.id === relationshipId)?.student_details
              ?.user_details?.full_name || 'Not selected'}
          </Typography>
        )}

        {/* <StudentDropdownMessg
          key={students.length}
          students={students}
          selectedStudentId={selectedStudentId}
          handleStudentChange={handleStudentChange}
          onStudentSelect={handleStudentSelect}
          sx={{ mt: 2 }}
        /> */}
      </Box>

      {/* Tabs Section */}
      <Box
        sx={{
          px: 2,
          pt: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="conversation filters"
          sx={{
            minHeight: 'unset',
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 3,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>All</span>
                {/* {studentConversations.length > 0 && (
                  <Chip
                    label={studentConversations.length}
                    size="small"
                    sx={{
                      ml: 1,
                      height: 20,
                      minWidth: 20,
                      fontSize: '0.7rem',
                      bgcolor: tabValue === 0 ? 'primary.main' : 'grey.300',
                      color: tabValue === 0 ? 'white' : 'grey.700',
                    }}
                  />
                )} */}
              </Box>
            }
            sx={{
              minHeight: 'unset',
              p: '6px 12px',
              fontSize: '0.875rem',
              textTransform: 'none',
              fontWeight: tabValue === 0 ? 600 : 400,
              color: tabValue === 0 ? 'primary.main' : 'text.secondary',
              '&:hover': { color: 'primary.dark' },
            }}
          />
          <Tab
            label="Drafts"
            sx={{
              minHeight: 'unset',
              p: '6px 12px',
              fontSize: '0.875rem',
              textTransform: 'none',
              fontWeight: tabValue === 1 ? 600 : 400,
              color: tabValue === 1 ? 'primary.main' : 'text.secondary',
              '&:hover': { color: 'primary.dark' },
            }}
          />
          <Tab
            label="Groups"
            sx={{
              minHeight: 'unset',
              p: '6px 12px',
              fontSize: '0.875rem',
              textTransform: 'none',
              fontWeight: tabValue === 2 ? 600 : 400,
              color: tabValue === 2 ? 'primary.main' : 'text.secondary',
              '&:hover': { color: 'primary.dark' },
            }}
          />
        </Tabs>
      </Box>

      {/* Content Section */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>
            <Typography>
              Failed to load conversations. Please try again.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                if (studentId) {
                  fetchStudentConversations(studentId);
                }
              }}
              sx={{ mt: 1, borderRadius: 3 }}
            >
              Retry
            </Button>
          </Box>
        ) : (selectedSubjectId ? filteredConversations : studentConversations)
            .length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              {selectedSubjectId
                ? `No conversations found for this subject`
                : `No conversations found`}
            </Typography>
            <Button
              variant="contained"
              onClick={handleAddMessageClick}
              sx={{ borderRadius: 3, mt: 1 }}
            >
              Start a conversation
            </Button>
          </Box>
        ) : (
          renderTabContent()
        )}
      </Box>

      <ToastContainer />
      <CreateMessageForm
        open={add}
        onClose={() => {
          setSelectedDraft(null);
          handleMessageModalClose();
        }}
        onSubmit={handleMessageAddition}
        draft={selectedDraft}
      />
    </Paper>
  );
}
