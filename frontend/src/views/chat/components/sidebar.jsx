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
  tabValue: externalTabValue,
}) {
  const theme = useTheme();
  const [internalTabValue, setInternalTabValue] = useState(0);
  const tabValue = externalTabValue !== undefined ? externalTabValue : internalTabValue;
  const [conversations, setConversations] = useState([]);
  const [groupConversations, setGroupConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [add, setAdd] = useState(false);
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ last_page: 1, total: 0 });
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentConversations, setStudentConversations] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [studentContext, setStudentContext] = useState(null);
  const dispatch = useDispatch();
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Get student data from Redux
  const { studentId: actualStudentId, relationshipId } = useSelector(
    (state) => state.student,
  );

  // Get user role from Redux (same as CreateMessage.jsx)
  const reduxUser = useSelector((state) => state?.user?.user);
  const userRoles = reduxUser?.roles || [];
  const role = userRoles[0] || reduxUser?.role || null;

  // Debug user from Redux
  console.log('DEBUG Redux user:', reduxUser, 'role:', role);

  // Retry counter for role loading
  const [retryCount, setRetryCount] = useState(0);

  // Initialize data with proper order
  useEffect(() => {
    const initializeData = async () => {
      setIsInitializing(true);
      console.log('DEBUG SIDEBAR INIT: Role from Redux =', role, 'retryCount=', retryCount);

      // Wait for role to be loaded from Redux
      if (!role) {
        console.log('DEBUG SIDEBAR INIT: Waiting for role to load...');
        setIsInitializing(false);

        // Retry up to 5 times with 500ms delay
        if (retryCount < 5) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 500);
        }
        return;
      }

      if (role === 'student' || role === 'teacher' || role === 'super_admin' || role === 'Super_Admin' || reduxUser?.is_superuser) {
        // For students, teachers, and super admins, skip student selection and fetch conversations directly
        setStudents([]);

        setIsInitializing(false);
        // Fetch conversations after initialization
        console.log('DEBUG SIDEBAR INIT: Calling fetchStudentConversationsForCurrentUser for', role);
        fetchStudentConversationsForCurrentUser();
      } else {
        // For parents, fetch their children
        await fetchStudents();
        setIsInitializing(false);
      }
    };

    initializeData();
  }, [role, retryCount]);

  // For students, teachers, and super_admins - fetch conversations once initialization is complete
  useEffect(() => {
    if (!isInitializing && (role === 'student' || role === 'teacher' || role === 'super_admin' || role === 'Super_Admin' || reduxUser?.is_superuser) && tabValue === 0) {
      fetchStudentConversationsForCurrentUser();

      getGroupConversations(); // Also fetch group conversations for All tab
    }
  }, [isInitializing, role, tabValue, reduxUser?.is_superuser]);

  // For parents - fetch conversations when student is selected
  useEffect(() => {
    if (!isInitializing && actualStudentId && role !== 'student' && role !== 'teacher' && role !== 'super_admin' && role !== 'Super_Admin' && !reduxUser?.is_superuser) {
      console.log('DEBUG: Parent - fetching conversations for student:', actualStudentId);
      fetchStudentConversations(actualStudentId);
      getGroupConversations(); // Also fetch group conversations
    }
  }, [isInitializing, actualStudentId, role, reduxUser?.is_superuser]);

  // Fetch available teachers when student ID changes (only for parents)
  // DISABLED: This endpoint causes 404 errors and is not needed for messaging
  useEffect(() => {
    if (role === 'student') return;
    if (!isInitializing && actualStudentId) {
      // fetchAvailableTeachers(actualStudentId);
    }
  }, [isInitializing, actualStudentId, role]);

  // Fetch student conversations when filters change
  useEffect(() => {
    if (!isInitializing && actualStudentId) {
      fetchStudentConversations(
        actualStudentId,
        selectedSubjectId,
        selectedTeacherId,
      );
    }
  }, [isInitializing, actualStudentId, selectedSubjectId, selectedTeacherId]);

  // For direct student login - fetch conversations when no actualStudentId (student is logged in directly)
  useEffect(() => {
    if (!isInitializing && !actualStudentId && (role === 'student' || role === 'super_admin' || role === 'Super_Admin') && tabValue === 0) {
      fetchStudentConversationsForCurrentUser();
    }
  }, [isInitializing, actualStudentId, tabValue]);

  // Fetch subjects when teacher changes
  useEffect(() => {
    if (selectedTeacherId && actualStudentId) {
      fetchSubjects(selectedTeacherId, actualStudentId);
    } else {
      setStudentSubjects([]);
      setSelectedSubjectId('');
    }
  }, [selectedTeacherId, actualStudentId]);

  const handleSubjectChange = (event) => {
    const subjectId = event.target.value;
    setSelectedSubjectId(subjectId);
  };

  const handleTeacherChange = (event) => {
    const teacherId = event.target.value;
    setSelectedTeacherId(teacherId);
  };

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
          dispatch(setStudentId(firstStudent.id));
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

  const fetchAvailableTeachers = async (studentRelationshipId) => {
    setLoadingTeachers(true);
    const token = await GetToken();

    // Find the actual student details ID from the relationship
    const student = students.find((s) => s.id === studentRelationshipId);
    if (!student || !student.student_details?.id) {
      setLoadingTeachers(false);
      return;
    }

    const studentDetailsId = student.student_details.id;
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

  const fetchSubjects = async (teacherId, studentRelationshipId) => {
    setSubjectLoading(true);
    try {
      const student = students.find((s) => s.id === studentRelationshipId);
      if (!student || !student.student_details?.id) {
        setSubjectLoading(false);
        return;
      }

      const studentDetailsId = student.student_details.id;
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.communicationChatsAvailableSubjectsForStudent}/${studentDetailsId}/teacher/${teacherId}`;
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
    studentRelationshipId,
    subjectId = null,
    teacherId = null,
  ) => {
    // Check if student exists in our list
    const student = students.find((s) => s.id === studentRelationshipId);
    if (!student || !student.student_details?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      // The conversations endpoint returns chats for the authenticated user
      let Api = `${Backend.auth}${Backend.chatsConversations}`;

      // Add query parameters if provided
      const params = new URLSearchParams();
      if (subjectId) params.append('subject_id', subjectId);
      // Only pass student_id if this is a parent viewing their child's messages
      // If student is logged in directly, backend will detect from request.user
      if (role !== 'student' && student?.student_details?.id) {
        params.append('student_id', student.student_details.id);
      }
      // if (teacherId) params.append('teacher_id', teacherId);

      const queryString = params.toString();
      if (queryString) Api += `?${queryString}`;

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
        // Handle nested data structure (same as fetchStudentConversationsForCurrentUser)
        const conversationsData = responseData.data?.data || responseData.data || [];
        console.log('DEBUG fetchStudentConversations: conversationsData:', conversationsData, 'length:', conversationsData.length);
        setStudentConversations(conversationsData);
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

  // Fetch conversations for the currently logged-in student/teacher (direct login, not parent view)
  const fetchStudentConversationsForCurrentUser = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      // For direct student/teacher login, call conversations endpoint without student_id
      // Backend will detect the user from the authentication token
      const Api = `${Backend.auth}${Backend.chatsConversations}`;

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      console.log('DEBUG: fetchStudentConversationsForCurrentUser calling:', Api);

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      console.log('DEBUG: fetchStudentConversationsForCurrentUser response:', responseData);
      console.log('DEBUG: responseData.data:', responseData.data);
      console.log('DEBUG: responseData.data?.data:', responseData.data?.data);

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to fetch conversations',
        );
      }

      if (responseData.success) {
        // Handle nested data structure
        const conversationsData = responseData.data?.data || responseData.data || [];
        console.log('DEBUG: conversationsData:', conversationsData, 'length:', conversationsData.length);
        setStudentConversations(conversationsData);
        if (responseData.student_context) {
          setStudentContext(responseData.student_context);
        }
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      console.error('DEBUG: fetchStudentConversationsForCurrentUser error:', error);
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

  const handleTabChange = (event, newValue) => {
    setInternalTabValue(newValue);
    if (onTabChange) {
      onTabChange(newValue);
    }

    if (newValue === 0) {
      // For 'All' tab, fetch both individual and group conversations
      if (studentConversations.length === 0) {
        if (role === 'student' || role === 'teacher' || role === 'super_admin' || role === 'Super_Admin' || reduxUser?.is_superuser) {
          fetchStudentConversationsForCurrentUser();
        } else if (actualStudentId) {
          fetchStudentConversations(actualStudentId);
        }
      }
      // Always fetch group conversations for 'All' tab
      getGroupConversations();
    } else if (newValue === 2) {
      getGroupConversations();
    }
  };

  const getGroupConversations = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.groupChats}`;
      console.log('DEBUG: Fetching group chats from:', Api);
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('DEBUG: Group chats response:', responseData);

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to fetch conversations',
        );
      }

      if (responseData.success) {
        setGroupConversations(responseData.data);
        console.log('DEBUG: Group conversations set:', responseData.data);
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
        if (role === 'student' || role === 'teacher' || role === 'super_admin' || role === 'Super_Admin' || reduxUser?.is_superuser) {
          await fetchStudentConversationsForCurrentUser();
          // Also refresh group conversations if on All or Groups tab
          if (tabValue === 0 || tabValue === 2) {
            await getGroupConversations();
          }
        } else if (actualStudentId) {
          // Fetch without filters to show all conversations including the new one
          await fetchStudentConversations(actualStudentId);
          // Also refresh group conversations if on All or Groups tab
          if (tabValue === 0 || tabValue === 2) {
            await getGroupConversations();
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

  useEffect(() => {
    if (tabValue === 2) {
      getGroupConversations();
    }
  }, [tabValue]);

  // Filter conversations and groups based on search query
  const filterBySearch = (items, fields) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      fields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(query);
      })
    );
  };

  const renderTabContent = () => {
    console.log('DEBUG renderTabContent: tabValue=', tabValue, 'studentConversations.length=', studentConversations.length, 'groupConversations.length=', groupConversations.length);
    switch (tabValue) {
      case 0:
        return (
          <Box sx={{ p: 0 }}>
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
              {/* Combine individual and group conversations for 'All' tab */}
              {filterBySearch(studentConversations, ['display_name', 'latest_message', 'other_user.full_name', 'other_user.email']).map((conversation) => (
                <ConversationItem
                  key={`individual-${conversation.id}`}
                  name={conversation.display_name}
                  message={conversation.latest_message}
                  timestamp={conversation.last_timestamp}
                  is_read={conversation.unread_count === 0}
                  onClick={() => handleSelectConversation(conversation)}
                  isSelected={selectedConversation?.id === conversation.id}
                />
              ))}
              {/* Also show group chats in 'All' tab */}
              {filterBySearch(groupConversations, ['name', 'latest_message']).map((group) => (
                <GroupChats
                  key={`group-${group.id}`}
                  name={group.name}
                  message={group.latest_message || 'No messages yet'}
                  timestamp={group.created_at}
                  onClick={() => onSelectGroup(group)}
                  isSelected={selectedGroup?.id === group.id}
                />
              ))}
            </List>
          </Box>
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
            {filterBySearch(groupConversations, ['name', 'latest_message']).map((group) => (
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
        }}
      >
        <TextField
          fullWidth
          placeholder="Search teachers, admins, groups, or messages..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Only show student name for parents (not admin/teacher) */}
        {role === 'parent' && students.length > 0 && relationshipId && (
          <Typography
            variant="body2"
            sx={{ mt: 2, color: 'text.secondary', fontWeight: 'bold' }}
          >
            Student:{' '}
            {students.find((s) => s.id === relationshipId)?.student_details
              ?.user_details?.full_name || 'Not selected'}
          </Typography>
        )}
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
            label="All"
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
          height: 0,
        }}
      >
        {loading || isInitializing ? (
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
                if (role === 'student' || role === 'teacher' || role === 'super_admin' || role === 'Super_Admin' || reduxUser?.is_superuser) {
                  fetchStudentConversationsForCurrentUser();
                  getGroupConversations();
                } else if (actualStudentId) {
                  fetchStudentConversations(actualStudentId);
                }
              }}
              sx={{ mt: 1, borderRadius: 3 }}
            >
              Retry
            </Button>
          </Box>
        ) : tabValue === 2 ? (
          // Groups tab empty state
          groupConversations.length === 0 ? (
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
                No group chats found
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Create a group from Super Admin Portal to get started
              </Typography>
            </Box>
          ) : (
            renderTabContent()
          )
        ) : (studentConversations.length === 0 && groupConversations.length === 0) ? (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              boxShadow: 1,
              mx: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No conversations found
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                if (role === 'student' || role === 'teacher' || role === 'super_admin' || role === 'Super_Admin' || reduxUser?.is_superuser) {
                  fetchStudentConversationsForCurrentUser();
                  getGroupConversations();
                } else if (actualStudentId) {
                  fetchStudentConversations(actualStudentId);
                }
              }}
              sx={{ mt: 1, borderRadius: 3 }}
            >
              Start A Conversation
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
