import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Button,
  Grid,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Typography,
  IconButton,
  Chip,
  Pagination,
  ListSubheader,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from 'react-redux';

const MULTI_DRAFT_KEY = 'draft-messages';

const CreateMessageForm = ({ open, onClose, onSubmit }) => {
  // Get user data from Redux store
  const user = useSelector((state) => state?.user?.user);
  const userRoles = user?.roles || [];

  // Determine user role
  const isStudent = userRoles.some(role =>
    typeof role === 'string'
      ? role.toLowerCase() === 'student'
      : role?.name?.toLowerCase() === 'student'
  );
  const isAdmin = userRoles.some(role =>
    typeof role === 'string'
      ? role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin'
      : role?.name?.toLowerCase() === 'admin' || role?.name?.toLowerCase() === 'superadmin'
  ) || user?.is_superuser || user?.is_staff;

  // For students, try to get their student_id from user data
  const studentId = isStudent ? (user?.student_id || user?.id) : null;

  const [messageDetails, setMessageDetails] = useState({
    message: '',
    receiver: '',
    student_id: '',
    branch_id: '',
  });

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubjectList, setSelectedSubjectList] = useState('');
  const [subjectBody, setSubjectBody] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const [filters, setFilters] = useState({
    subject_id: '',
  });

  // Load latest draft on open
  useEffect(() => {
    if (open) {
      const allDrafts = JSON.parse(localStorage.getItem(MULTI_DRAFT_KEY)) || [];
      const latestDraft = allDrafts[0];
      if (latestDraft) {
        setMessageDetails({
          message: latestDraft.message,
          receiver: latestDraft.receiver || '',
          student_id: latestDraft.student_id || '',
          branch_id: latestDraft.branch_id || '',
          subject_id: latestDraft.subject_id || '',
        });
      }
    }
  }, [open]);

  // Fetch contacts when modal opens
  useEffect(() => {
    if (open && !isStudent) {
      if (isAdmin) {
        // Admin fetches all students and teachers
        fetchRoleBasedContacts();
      } else {
        // Parents fetch their children
        fetchStudents();
      }
    }
  }, [open, isStudent, isAdmin]);

  useEffect(() => {
    if (!open) return;
    const debounce = setTimeout(() => {
      const allDrafts = JSON.parse(localStorage.getItem(MULTI_DRAFT_KEY)) || [];

      // Find the selected student to get their name
      const selectedStudent = students.find(
        (student) => student.student_details.id === messageDetails.student_id,
      );

      const newDraft = {
        id: uuidv4(),
        message: messageDetails.message,
        receiver: messageDetails.receiver,
        student_id: messageDetails.student_id,
        studentName:
          selectedStudent?.student_details.user_details.full_name || '',
        branch_id: messageDetails.branch_id,
        created_at: new Date().toISOString(),
      };

      const updatedDrafts = [
        newDraft,
        ...allDrafts.filter((d) => d.message !== messageDetails.message),
      ].slice(0, 10);
      localStorage.setItem(MULTI_DRAFT_KEY, JSON.stringify(updatedDrafts));
    }, 1000);

    return () => clearTimeout(debounce);
  }, [messageDetails, students]);

  // Fetch available teachers when a student is selected
  useEffect(() => {
    // Use role from Redux instead of localStorage
    const userRole = userRoles[0];
    const userId = localStorage.getItem('user_id');
    console.log('DEBUG CreateMessage: userRole from Redux:', userRole, 'userId:', userId);

    // Wait for role to be loaded
    if (!userRole) {
      console.log('DEBUG CreateMessage: Waiting for role to load...');
      return;
    }

    // For students, use user_id if student_id is not set
    const effectiveStudentId = messageDetails.student_id || (userRole === 'student' ? userId : null);

    if (effectiveStudentId) {
      fetchAvailableTeachers(effectiveStudentId);
    } else {
      setAvailableTeachers([]);
      setAvailableSubjects([]);
      setSelectedSubject('');
      setMessageDetails((prev) => ({ ...prev, receiver: '' }));
    }
  }, [messageDetails.student_id, userRoles]);

  // Set student_id in messageDetails when studentId from Redux changes
  useEffect(() => {
    if (studentId) {
      setMessageDetails((prev) => ({
        ...prev,
        student_id: studentId,
      }));
    }
  }, [studentId]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    const token = await GetToken();

    const params = new URLSearchParams({
      page: pagination.page.toString(),
      per_page: pagination.per_page.toString(),
    });

    if (filters.subject_id) {
      params.append('subject_id', filters.subject_id);
    }

    const Api = `${Backend.auth}${Backend.parentStudents}?${params.toString()}`;
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
        setStudents(responseData.data);
        setPagination({
          ...pagination,
          last_page: responseData.last_page || 1,
          total: responseData.total || responseData.data.length,
        });
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchRoleBasedContacts = async () => {
    setLoadingStudents(true);
    setLoadingTeachers(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationChatsTeacherStudentsContacts}`;
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
        const data = responseData.data;
        setStudents(data.students || []);
        setAvailableTeachers(data.teachers || []);
        setFilteredTeachers(data.teachers || []);
        toast.success('Contacts loaded successfully');
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingStudents(false);
      setLoadingTeachers(false);
    }
  };

  const fetchAvailableTeachers = async (studentId) => {
    setLoadingTeachers(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.parentAvailableTeachers}${studentId}`;
    console.log('DEBUG: Fetching teachers from:', Api);
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    };
    try {
      const response = await fetch(Api, {
        method: 'GET',
        headers: header,
      });
      const responseData = await response.json();
      console.log('DEBUG: Teachers response:', responseData);

      if (!response.ok) throw new Error(responseData.message);
      if (responseData.success) {
        const teachers = responseData.data?.teachers || [];
        console.log('DEBUG: Setting teachers:', teachers);
        console.log('DEBUG: First teacher sample:', teachers[0]);
        console.log('DEBUG: Teacher data structure:', teachers[0] && Object.keys(teachers[0]));
        setAvailableTeachers(teachers);
        // Extract available subjects from filters
        const subjects = responseData.data?.filters?.available_subjects || [];
        setAvailableSubjects(subjects);
      }
    } catch (error) {
      console.error('DEBUG: Error fetching teachers:', error);
      toast.error(error.message);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Filter teachers based on selected subject
  useEffect(() => {
    if (!filters.subject_id) {
      setFilteredTeachers(availableTeachers);
    } else {
      console.log('Filtering teachers for subject ID:', filters.subject_name, "and the teachers: ", availableTeachers);
      setFilteredTeachers(
        availableTeachers.filter((teacher) =>
          teacher.subject_details?.some(
            (subject) => subject.id === filters.subject_id,
          ),
        ),
      );
    }

    // Reset selected teacher if it's no longer in filtered list
    setMessageDetails((prev) => {
      if (!availableTeachers.some((t) => t.user_id === prev.receiver)) {
        return { ...prev, receiver: '' };
      }
      return prev;
    });
  }, [availableTeachers, filters.subject_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMessageDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setMessageDetails((prev) => ({
      ...prev,
      student_id: studentId,
      receiver: '', // Reset receiver when student changes
    }));
    setSelectedSubject(''); // Reset subject filter when student changes
  };

  const handleTeacherSelect = (e) => {
    const teacherId = e.target.value;
    setMessageDetails((prev) => ({
      ...prev,
      receiver: teacherId,
    }));
  };

  const handleSubjectFilter = (subjectId) => {
    setSelectedSubject(subjectId === selectedSubject ? '' : subjectId);
    setMessageDetails((prev) => ({ ...prev, receiver: '' })); // Reset teacher selection when filter changes
  };

  const handleStudentSubjectFilter = (subjectId) => {
    setFilters((prev) => ({ ...prev, subject_id: subjectId }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page when filter changes
  };

  const handlePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, page: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName('');
  };

  const fetchSubject = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const userRole = userRoles[0]; // Use Redux role
      let Api = `${Backend.auth}${Backend.subjects}`;

      // For students, fetch only their enrolled subjects by passing user_id as student_id
      if (userRole === 'student') {
        const userId = localStorage.getItem('user_id');
        if (userId) {
          Api += `?student_id=${userId}`;
        }
      }
      console.log('DEBUG: Fetching subjects from:', Api, 'Role:', userRole);

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('DEBUG: Subjects response:', responseData);

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to fetch conversations',
        );
      }

      if (responseData.success) {
        setSubjectBody(responseData.data);

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

  useEffect(() => {
    fetchSubject();
  }, []);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (
  //     !messageDetails.message ||
  //     !messageDetails.receiver ||
  //     !messageDetails.student_id
  //   ) {
  //     toast.error('Please fill all required fields.');
  //     return;
  //   }

  //   setIsSubmitting(true);
  //   try {
  //     const token = await GetToken();
  //     const formData = new FormData();

  //     formData.append('message', messageDetails.message);
  //     formData.append('receiver', messageDetails.receiver);
  //     formData.append('student_id', messageDetails.student_id);

  //     if (messageDetails.branch_id) {
  //       formData.append('branch_id', messageDetails.branch_id);
  //     }
  //     if (file) {
  //       formData.append('attachment', file);
  //     }

  //     const response = await fetch(
  //       `${Backend.auth}${Backend.communicationChats}`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: formData,
  //       },
  //     );

  //     const data = await response.json();

  //     if (!response.ok)
  //       throw new Error(data.message || 'Failed to send message');

  //     if (data.success) {
  //       toast.success('Message sent successfully');
  //       onSubmit(data.data);
  //       onClose();

  //       // Clear the draft with matching message
  //       const drafts = JSON.parse(localStorage.getItem(MULTI_DRAFT_KEY)) || [];
  //       const filtered = drafts.filter(
  //         (d) => d.message !== messageDetails.message,
  //       );
  //       localStorage.setItem(MULTI_DRAFT_KEY, JSON.stringify(filtered));

  //       // Reset form
  //       setMessageDetails({
  //         message: '',
  //         receiver: '',
  //         student_id: '',
  //         branch_id: '',
  //       });
  //       setFile(null);
  //       setFileName('');
  //       setSelectedSubject('');
  //       setFilters({ subject_id: '' });
  //     } else {
  //       toast.error(data.message);
  //     }
  //   } catch (error) {
  //     toast.error(error.message);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Admin only needs message and receiver; students/teachers need student_id
    if (
      !messageDetails.message ||
      !messageDetails.receiver ||
      (!isAdmin && !messageDetails.student_id)
    ) {
      toast.error('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await GetToken();
      const formData = new FormData();

      if (selectedSubjectList) {
        formData.append('subject_id', selectedSubjectList);
      }

      formData.append('message', messageDetails.message);
      formData.append('receiver', messageDetails.receiver);
      // Only append student_id for non-admin users
      if (!isAdmin && messageDetails.student_id) {
        formData.append('student_id', messageDetails.student_id);
      }

      if (messageDetails.branch_id) {
        formData.append('branch_id', messageDetails.branch_id);
      }
      if (file) {
        formData.append('attachment', file);
      }

      const response = await fetch(
        `${Backend.auth}${Backend.communicationChats}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || 'Failed to send message');

      if (data.success) {
        toast.success('Message sent successfully');
        onSubmit(data.data);
        onClose();

        // Clear the draft with matching message
        const drafts = JSON.parse(localStorage.getItem(MULTI_DRAFT_KEY)) || [];
        const filtered = drafts.filter(
          (d) => d.message !== messageDetails.message,
        );
        localStorage.setItem(MULTI_DRAFT_KEY, JSON.stringify(filtered));

        // Reset form
        setMessageDetails({
          message: '',
          receiver: '',
          student_id: '',
          branch_id: '',
        });
        setFile(null);
        setFileName('');
        setSelectedSubject('');
        setSelectedSubjectList('');
        setFilters({ subject_id: '' });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DrogaFormModal
      open={open}
      title="Create New Message"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
    >
      <Grid container spacing={2}>
        {/* Student Subject Filter */}
        {availableSubjects.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Filter Students by Subject:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="All Subjects"
                clickable
                color={!filters.subject_id ? 'primary' : 'default'}
                onClick={() => handleStudentSubjectFilter('')}
              />
              {availableSubjects.map((subject) => (
                <Chip
                  key={subject.id}
                  label={subject.name}
                  clickable
                  color={
                    filters.subject_id === subject.id ? 'primary' : 'default'
                  }
                  onClick={() => handleStudentSubjectFilter(subject.id)}
                />
              ))}
            </Box>
          </Grid>
        )}

        {<Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="Subject-select-label">Select Subject</InputLabel>
            <Select
              labelId="Subject-select-label"
              id="Subject-select"
              name="subject_id"
              value={selectedSubjectList}
              label="Select Subject"
              onChange={(e) => setSelectedSubjectList(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">
                <em>Select a subject</em>
              </MenuItem>
              {subjectBody.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
            </Select>
            {loading && (
              <CircularProgress
                size={24}
                sx={{ position: 'absolute', right: 40, top: 20 }}
              />
            )}
          </FormControl>
        </Grid>}

        {/* Admin sees unified recipient dropdown with students and teachers */}
        {isAdmin && (
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="recipient-select-label">Select Recipient</InputLabel>
              <Select
                labelId="recipient-select-label"
                id="recipient-select"
                name="receiver"
                value={messageDetails.receiver}
                label="Select Recipient"
                onChange={handleChange}
                disabled={loadingStudents || loadingTeachers}
              >
                <MenuItem value="">
                  <em>Select a recipient</em>
                </MenuItem>
                {/* Students group */}
                <ListSubheader>Students</ListSubheader>
                {students.map((student) => (
                  <MenuItem
                    key={student.user_id || student.id}
                    value={student.user_id || student.id}
                  >
                    {student.full_name || student.student_details?.user_details?.full_name || 'Unknown'}
                  </MenuItem>
                ))}
                {/* Teachers group */}
                <ListSubheader>Teachers</ListSubheader>
                {availableTeachers.map((teacher) => (
                  <MenuItem
                    key={teacher.user_id || teacher.id}
                    value={teacher.user_id || teacher.id}
                  >
                    {teacher.full_name || teacher.name || 'Unknown'}
                  </MenuItem>
                ))}
              </Select>
              {(loadingStudents || loadingTeachers) && (
                <CircularProgress
                  size={24}
                  sx={{ position: 'absolute', right: 40, top: 20 }}
                />
              )}
            </FormControl>
          </Grid>
        )}

        {/* Non-admin (parents) see student then teacher dropdown */}
        {!isStudent && !isAdmin && (
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="student-select-label">Select Student</InputLabel>
              <Select
                labelId="student-select-label"
                id="student-select"
                name="student_id"
                value={messageDetails.student_id}
                label="Select Student"
                onChange={handleStudentChange}
                disabled={loadingStudents}
              >
                <MenuItem value="">
                  <em>Select a student</em>
                </MenuItem>
                {students.map((student) => (
                  <MenuItem
                    key={student.student_details.id}
                    value={student.student_details.id}
                  >
                    {student.student_details.user_details.full_name}
                    {student.student_details.class && (
                      <Typography
                        variant="caption"
                        sx={{ ml: 1, color: 'text.secondary' }}
                      >
                        ({student.student_details.class})
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
              {loadingStudents && (
                <CircularProgress
                  size={24}
                  sx={{ position: 'absolute', right: 40, top: 20 }}
                />
              )}
            </FormControl>

            {pagination.total > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="caption" color="textSecondary">
                  Showing {students.length} of {pagination.total} students
                  {filters.subject_id && ` (filtered by subject)`}
                </Typography>
                {pagination.last_page > 1 && (
                  <Pagination
                    size="small"
                    count={pagination.last_page}
                    page={pagination.page}
                    onChange={handlePageChange}
                  />
                )}
              </Box>
            )}
          </Grid>
        )}

        {/* Display available teachers for selection */}
        {messageDetails.student_id && availableTeachers.length > 0 && (
          <>
            {/* Teacher Subject Filter Chips */}
            {availableSubjects.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Filter Teachers by Subject:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label="All Subjects"
                    clickable
                    color={!selectedSubject ? 'primary' : 'default'}
                    onClick={() => handleSubjectFilter('')}
                  />
                  {availableSubjects.map((subject) => (
                    <Chip
                      key={subject.id}
                      label={subject.name}
                      clickable
                      color={
                        selectedSubject === subject.id ? 'primary' : 'default'
                      }
                      onClick={() => handleSubjectFilter(subject.id)}
                    />
                  ))}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="teacher-select-label">
                  Select Teacher
                </InputLabel>
                <Select
                  labelId="teacher-select-label"
                  id="teacher-select"
                  value={messageDetails.receiver}
                  label="Select Teacher"
                  onChange={handleTeacherSelect}
                  disabled={loadingTeachers}
                >
                  <MenuItem value="">
                    <em>Select a teacher</em>
                  </MenuItem>
                  {filteredTeachers.map((teacher) => {
                    // TeacherSerializer returns 'name' (from user.full_name) and 'user_details'
                    const teacherName = teacher.name || teacher.user_details?.full_name || teacher.user?.full_name || 'Unknown Teacher';
                    const teacherEmail = teacher.user_details?.email || teacher.user?.email || '';
                    const teacherId = teacher.user || teacher.user_details?.id || teacher.id;
                    return (
                      <MenuItem key={teacherId} value={teacherId}>
                        {teacherName} {teacherEmail && `- ${teacherEmail}`}
                      </MenuItem>
                    );
                  })}
                </Select>
                {loadingTeachers && (
                  <CircularProgress
                    size={24}
                    sx={{ position: 'absolute', right: 40, top: 20 }}
                  />
                )}
              </FormControl>
              <Typography variant="caption" color="textSecondary">
                {filteredTeachers.length} teacher(s) found
                {selectedSubject && ` for selected subject`}
              </Typography>
            </Grid>
          </>
        )}

        {messageDetails.student_id &&
          availableTeachers.length === 0 &&
          !loadingTeachers && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                No teachers available for this student.
              </Typography>
            </Grid>
          )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            name="message"
            value={messageDetails.message}
            onChange={handleChange}
            margin="normal"
            required
          />
        </Grid>

        <Grid item xs={12}>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="attachment-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="attachment-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={<AttachFileIcon />}
            >
              Attach File
            </Button>
          </label>

          {fileName && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                {fileName}
              </Typography>
              <IconButton size="small" onClick={handleRemoveFile}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Grid>
      </Grid>
    </DrogaFormModal>
  );
};

CreateMessageForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default CreateMessageForm;
