// CreateMessageForm.jsx
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
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import { v4 as uuidv4 } from 'uuid';

const MULTI_DRAFT_KEY = 'draft-messages';

const CreateMessageForm = ({ open, onClose, onSubmit }) => {
  const [messageDetails, setMessageDetails] = useState({
    message: '',
    receiver: '',
    student_id: '',
    teacher_id: '',
    branch_id: '',
  });

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubjectList, setSelectedSubjectList] = useState('');
  const [subjectBody, setSubjectBody] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classSubjects, setClassSubjects] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    branch_id: '',
    subject_id: '',
    grade: '',
    section: '',
  });

  // Fetch classes on component mount
  useEffect(() => {
    if (open) {
      fetchClasses();
    }
  }, [open]);

  const [availableFilters, setAvailableFilters] = useState({
    branches: [],
    subjects: [],
    grades: [],
    sections: [],
    gradesWithSections: [],
  });

  // Load latest draft on open
  useEffect(() => {
    if (open) {
      const allDrafts = JSON.parse(localStorage.getItem(MULTI_DRAFT_KEY)) || [];
      const latestDraft = allDrafts[0];

      // Check for preselected subject from group click
      const preselectedSubject = localStorage.getItem('preselected_subject');
      if (preselectedSubject) {
        // Clear it after reading
        localStorage.removeItem('preselected_subject');
        // Will be set after classes load
        setTimeout(() => {
          setSelectedSubjectList(preselectedSubject);
        }, 500);
      }

      if (latestDraft) {
        setMessageDetails({
          message: latestDraft.message,
          receiver: latestDraft.receiver,
          student_id: latestDraft.student_id || '',
          branch_id: latestDraft.branch_id || '',
        });
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const debounce = setTimeout(() => {
      const allDrafts = JSON.parse(localStorage.getItem(MULTI_DRAFT_KEY)) || [];

      const selectedStudent = students.find(
        (student) => student.student_id === messageDetails.student_id,
      );
      const selectedName = selectedStudent?.student_name || '';

      const newDraft = {
        id: uuidv4(),
        message: messageDetails.message,
        receiver: messageDetails.receiver,
        student_id: messageDetails.student_id,
        recipientName: selectedName,
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

  const fetchStudents = async (overrideSubjectId = null, classId = null) => {
    setLoadingStudents(true);
    const token = await GetToken();

    // Build query parameters with filters
    const params = new URLSearchParams({
      page: (pagination.page + 1).toString(),
      per_page: pagination.per_page.toString(),
    });

    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    // Use overrideSubjectId if provided (from subject dropdown), otherwise use filter
    const subjectId = overrideSubjectId !== null ? overrideSubjectId : filters.subject_id;
    if (subjectId) params.append('subject_id', subjectId);
    // Use classId if provided, otherwise use filter
    const classIdValue = classId !== null ? classId : filters.grade;
    if (classIdValue) params.append('class_id', classIdValue);
    if (filters.section) params.append('section', filters.section);

    const Api = `${Backend.auth}${Backend.communicationChatsTeacherStudentsContacts}?${params.toString()}`;
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
        setStudents(responseData.data.students || []);

        // Set available filters from API response
        if (responseData.data.filters) {
          setAvailableFilters({
            branches: responseData.data.filters.available_branches || [],
            subjects: responseData.data.filters.available_subjects || [],
            grades: responseData.data.filters.available_grades || [],
            gradesWithSections:
              responseData.data.filters.available_grades_with_sections || [],
          });
        }

        setPagination({
          ...pagination,
          last_page: responseData.last_page || 1,
          total: responseData.total || responseData.data.students.length,
        });
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchTeachers = async () => {
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
        setTeachers(responseData.data.teachers || []);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page
    fetchStudents();
  };

  const clearFilters = () => {
    setFilters({
      branch_id: '',
      subject_id: '',
      grade: '',
      section: '',
    });
    setSearch('');
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMessageDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    const selectedStudent = students.find(
      (student) => (student.student_details?.id || student.id) === studentId,
    );

    if (selectedStudent) {
      // For group messages, receiver is the group identifier
      // For individual students, receiver is the student's user_id
      const receiverId = selectedStudent.is_group
        ? selectedStudent.user_id
        : (selectedStudent.student_details?.user_details?.id || selectedStudent.user_id);

      setMessageDetails((prev) => ({
        ...prev,
        student_id: studentId,
        teacher_id: '', // Clear teacher selection
        receiver: receiverId,
      }));
    } else {
      setMessageDetails((prev) => ({
        ...prev,
        student_id: studentId,
        teacher_id: '', // Clear teacher selection
        receiver: '',
      }));
    }
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


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!messageDetails.message || !messageDetails.receiver) {
      toast.error('Please fill all required fields.');
      return;
    }

    if (!messageDetails.student_id) {
      toast.error('Please select a student.');
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

      formData.append('student_id', messageDetails.student_id);

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

        const drafts = JSON.parse(localStorage.getItem(MULTI_DRAFT_KEY)) || [];
        const filtered = drafts.filter(
          (d) => d.message !== messageDetails.message,
        );
        localStorage.setItem(MULTI_DRAFT_KEY, JSON.stringify(filtered));

        setMessageDetails({
          message: '',
          receiver: '',
          student_id: '',
          branch_id: '',
        });
        setFile(null);
        setFileName('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available sections for selected grade
  const getSectionsForGrade = (grade) => {
    if (!availableFilters.gradesWithSections || !Array.isArray(availableFilters.gradesWithSections)) {
      return [];
    }
    const gradeData = availableFilters.gradesWithSections.find(
      (g) => g.grade === grade,
    );
    return gradeData?.sections || [];
  };

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.classes}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch classes');
      }

      if (responseData.success) {
        setClasses(responseData.data || []);
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch subjects for selected class
  const fetchSubjectsByClass = async (classId) => {
    if (!classId) {
      setClassSubjects([]);
      return;
    }
    setLoading(true);
    try {
      const token = await GetToken();
      // Use the class subjects endpoint or filter subjects by class
      const Api = `${Backend.auth}${Backend.subjects}?class_id=${classId}`;
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
        setClassSubjects(responseData.data || []);
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

  // Handle class selection change
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setSelectedSubjectList(''); // Reset subject when class changes
    setMessageDetails((prev) => ({
      ...prev,
      student_id: '',
      receiver: '',
    }));
    setStudents([]); // Clear students when class changes
    if (classId) {
      fetchSubjectsByClass(classId);
    } else {
      setClassSubjects([]);
    }
  };

  // Handle subject selection change
  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubjectList(subjectId);
    // Reset student selection when subject changes
    setMessageDetails((prev) => ({
      ...prev,
      student_id: '',
      receiver: '',
    }));
  };

  // Refetch students when selected subject changes (and class is selected)
  useEffect(() => {
    if (open && selectedClass && selectedSubjectList) {
      // Update filters state for UI consistency
      setFilters((prev) => ({
        ...prev,
        subject_id: selectedSubjectList,
        grade: classes.find(c => c.id === selectedClass)?.grade || '',
      }));
      // Fetch students immediately with the selected class and subject
      fetchStudents(selectedSubjectList, selectedClass);
    }
  }, [selectedSubjectList, selectedClass, open]);

  return (
    <DrogaFormModal
      open={open}
      title="Create New Message"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      maxWidth="md"
    >
      <Grid container spacing={2}>
        {/* Search and Filters Section */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button variant="outlined" onClick={applyFilters}>
              Apply
            </Button>
            <Button variant="outlined" onClick={clearFilters}>
              Clear
            </Button>
          </Box>

          {showFilters && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Branch</InputLabel>
                  <Select
                    value={filters.branch_id}
                    label="Branch"
                    onChange={(e) =>
                      handleFilterChange('branch_id', e.target.value)
                    }
                  >
                    <MenuItem value="">All Branches</MenuItem>
                    {availableFilters.branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={filters.subject_id}
                    label="Subject"
                    onChange={(e) =>
                      handleFilterChange('subject_id', e.target.value)
                    }
                  >
                    <MenuItem value="">All Subjects</MenuItem>
                    {availableFilters.subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Grade</InputLabel>
                  <Select
                    value={filters.grade}
                    label="Grade"
                    onChange={(e) =>
                      handleFilterChange('grade', e.target.value)
                    }
                  >
                    <MenuItem value="">All Grades</MenuItem>
                    {availableFilters.grades.map((grade) => (
                      <MenuItem key={grade} value={grade}>
                        {grade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" disabled={!filters.grade}>
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={filters.section}
                    label="Section"
                    onChange={(e) =>
                      handleFilterChange('section', e.target.value)
                    }
                  >
                    <MenuItem value="">All Sections</MenuItem>
                    {getSectionsForGrade(filters.grade).map((section) => (
                      <MenuItem
                        key={section.id || section}
                        value={section.id || section}
                      >
                        {section.name || section}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* Active filters display */}
          {Object.values(filters).some((filter) => filter) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Active Filters:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {filters.branch_id && (
                  <Chip
                    label={`Branch: ${availableFilters.branches.find((b) => b.id === filters.branch_id)?.name}`}
                    onDelete={() => handleFilterChange('branch_id', '')}
                    size="small"
                  />
                )}
                {filters.subject_id && (
                  <Chip
                    label={`Subject: ${availableFilters.subjects.find((s) => s.id === filters.subject_id)?.name}`}
                    onDelete={() => handleFilterChange('subject_id', '')}
                    size="small"
                  />
                )}
                {filters.grade && (
                  <Chip
                    label={`Grade: ${filters.grade}`}
                    onDelete={() => handleFilterChange('grade', '')}
                    size="small"
                  />
                )}
                {filters.section && (
                  <Chip
                    label={`Section: ${filters.section}`}
                    onDelete={() => handleFilterChange('section', '')}
                    size="small"
                  />
                )}
              </Box>
            </Box>
          )}
        </Grid>

        {/* Class Selection */}
        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="Class-select-label">Select Class</InputLabel>
            <Select
              labelId="Class-select-label"
              id="Class-select"
              value={selectedClass}
              label="Select Class"
              onChange={handleClassChange}
              disabled={loadingClasses}
            >
              <MenuItem value="">
                <em>Select a class</em>
              </MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.grade || cls.name}
                </MenuItem>
              ))}
            </Select>
            {loadingClasses && (
              <CircularProgress
                size={24}
                sx={{ position: 'absolute', right: 40, top: 20 }}
              />
            )}
          </FormControl>
        </Grid>

        {/* Subject Selection - Filtered by Class */}
        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="Subject-select-label">Select Subject</InputLabel>
            <Select
              labelId="Subject-select-label"
              id="Subject-select"
              name="subject_id"
              value={selectedSubjectList}
              label="Select Subject"
              onChange={handleSubjectChange}
              disabled={!selectedClass || loading}
            >
              <MenuItem value="">
                <em>{selectedClass ? 'Select a subject' : 'First select a class'}</em>
              </MenuItem>
              {classSubjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name || subject.global_subject_details?.name || subject.global_subject?.name || 'Unknown Subject'}
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
        </Grid>

        {/* Student Selection */}
        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="recipient-select-label">Select Student</InputLabel>
            <Select
              labelId="recipient-select-label"
              id="recipient-select"
              name="student_id"
              value={messageDetails.student_id}
              label="Select Student"
              onChange={handleStudentChange}
              disabled={!selectedClass || !selectedSubjectList || loadingStudents}
            >
              <MenuItem value="">
                <em>
                  {selectedClass && selectedSubjectList
                    ? 'Select a student'
                    : selectedClass
                      ? 'First select a subject'
                      : 'First select a class'}
                </em>
              </MenuItem>
              {students.map((student) => (
                <MenuItem
                  key={student.student_details?.id || student.id}
                  value={student.student_details?.id || student.id}
                >
                  {student.student_details?.user_details?.full_name || student.full_name || 'Unknown'}
                  {student.student_details?.section_details?.class_details?.grade &&
                    ` (${student.student_details.section_details.class_details.grade}`}
                  {student.student_details?.section_details?.name &&
                    student.student_details.section_details.name !== 'All' &&
                    ` - ${student.student_details.section_details.name})`}
                  {!student.student_details && student.student_code && ` - ${student.student_code}`}
                  {student.is_group && ' (Group Message)'}
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
        </Grid>

        {/* Message Input */}
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

        {/* File Attachment */}
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
