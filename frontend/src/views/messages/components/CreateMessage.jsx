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
  Divider,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';

const CreateMessageForm = ({ open, onClose, onSubmit, fetchMessages }) => {
  const [messageDetails, setMessageDetails] = useState({
    message: '',
    receiver: '',
    branch_id: '',
  });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [branches, setBranches] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (open) {
      fetchBranches();
      fetchRoleBasedContacts();
    }
  }, [open]);

  const fetchBranches = async () => {
    setLoadingBranches(true);
    const token = await GetToken();
    const branchId = user?.branch_id;
    const Api = `${Backend.auth}${Backend.branches}?branch_id=${branchId || ''}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch branches');
      }

      if (responseData.success) {
        setBranches(responseData.data || []);
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchRoleBasedContacts = async () => {
    setLoadingUser(true);
    const token = await GetToken();
    const branchId = user?.branch_id;
    const Api = `${Backend.auth}${Backend.communicationChatsTeacherStudentsContacts}?branch_id=${branchId || ''}${selectedSubject ? `&subject_id=${selectedSubject}` : ''}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch contacts');
      }

      if (responseData.success) {
        const data = responseData.data;
        setStudents(data.students || []);
        setTeachers(data.teachers || []);
        setSubjects(data.subjects || []);
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setMessageDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (event) => {
    const value = event.target.value;
    setSelectedSubject(value);
    // Refetch contacts when subject changes
    fetchRoleBasedContacts();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!messageDetails.message || !messageDetails.receiver) {
      toast.error('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await GetToken();
      const formData = new FormData();

      // Append all message details
      formData.append('message', messageDetails.message);
      formData.append('receiver', messageDetails.receiver);
      if (messageDetails.branch_id) {
        formData.append('branch_id', messageDetails.branch_id);
      }

      // Append the file if it exists
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

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      if (data.success) {
        toast.success('Message sent successfully');

        if (onSubmit) onSubmit(data.data);
        onClose();

        // Reset form
        setMessageDetails({
          message: '',
          receiver: '',
          branch_id: '',
        });
        setFile(null);
        setFileName('');
        if (fetchMessages) await fetchMessages();
      } else {
        toast.error(data.message || 'Failed to send message');
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
        {/* Subject Filter (for teachers) */}
        {subjects && subjects.length > 0 && (
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="subject-select-label">Filter by Subject (Optional)</InputLabel>
              <Select
                labelId="subject-select-label"
                id="subject-select"
                value={selectedSubject}
                label="Filter by Subject"
                onChange={handleSubjectChange}
                disabled={loadingUser}
              >
                <MenuItem value="">
                  <em>All Subjects</em>
                </MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Students Section */}
        {students && students.length > 0 && (
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="student-select-label">Send to Student</InputLabel>
              <Select
                labelId="student-select-label"
                id="student-select"
                name="receiver"
                value={messageDetails.receiver}
                label="Send to Student"
                onChange={handleChange}
                disabled={loadingUser}
              >
                <MenuItem value="">
                  <em>Select a student</em>
                </MenuItem>
                {students.filter(s => !s.is_group).map((student) => (
                  <MenuItem key={student.user_id || student.id} value={student.user_id || student.id}>
                    {student.full_name} {student.student_code ? `(${student.student_code})` : ''} {student.class ? `- ${student.class}` : ''} {student.section ? student.section : ''}
                  </MenuItem>
                ))}
                {/* Bulk messaging option for teachers */}
                {selectedSubject && students.some(s => s.is_group) && (
                  <>
                    <Divider />
                    {students.filter(s => s.is_group).map((group) => (
                      <MenuItem key={group.id} value={group.id} sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>
                        📢 {group.student_details?.user_details?.full_name || group.full_name}
                      </MenuItem>
                    ))}
                  </>
                )}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Teachers Section */}
        {teachers && teachers.length > 0 && (
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="teacher-select-label">Send to Teacher</InputLabel>
              <Select
                labelId="teacher-select-label"
                id="teacher-select"
                name="receiver"
                value={messageDetails.receiver}
                label="Send to Teacher"
                onChange={handleChange}
                disabled={loadingUser}
              >
                <MenuItem value="">
                  <em>Select a teacher</em>
                </MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.user_id || teacher.id} value={teacher.user_id || teacher.id}>
                    {teacher.full_name} {teacher.branch_name ? `- ${teacher.branch_name}` : ''} {teacher.subjects && teacher.subjects.length > 0 ? `(${teacher.subjects.join(', ')})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="branch-select-label">Branch</InputLabel>
            <Select
              labelId="branch-select-label"
              id="branch-select"
              name="branch_id"
              value={messageDetails.branch_id}
              label="Branch"
              onChange={handleChange}
              disabled={loadingBranches}
            >
              <MenuItem value="">
                <em>Select a branch</em>
              </MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
            {loadingBranches && (
              <CircularProgress
                size={24}
                sx={{ position: 'absolute', right: 40, top: 20 }}
              />
            )}
          </FormControl>
        </Grid>

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
  fetchMessages: PropTypes.func.isRequired,
};

export default CreateMessageForm;
