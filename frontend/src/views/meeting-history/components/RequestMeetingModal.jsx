import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import { useSelector } from 'react-redux';

const RequestMeetingModal = ({ open, onClose, onSuccess }) => {
  const { user } = useSelector((state) => state.user);
  const userRole = user?.role?.toLowerCase() || '';
  const isSuperAdmin = user?.is_superuser || user?.is_staff || userRole.includes('super');
  const isAdmin = userRole.includes('admin');
  const isTeacher = userRole.includes('teacher');
  const isParent = userRole.includes('parent');

  console.log('DEBUG RequestMeetingModal INIT: user=', user);
  console.log('DEBUG RequestMeetingModal INIT: userRole=', userRole);
  console.log('DEBUG RequestMeetingModal INIT: isSuperAdmin=', isSuperAdmin, 'isAdmin=', isAdmin);

  const [formData, setFormData] = useState({
    requested_to: '',
    requested_date: '',
    requested_time: '',
    notes: '',
    branch_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactType, setContactType] = useState('teachers'); // teachers, admins, parents, students
  const [branches, setBranches] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [error, setError] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (open) {
      fetchContacts();
      fetchBranches();
    }
  }, [open, contactType]);

  const fetchContacts = async () => {
    setLoadingUser(true);
    const token = await GetToken();
    const branchId = user?.branch_id;

    // For Super Admin/Admin, fetch all users based on selected contact type
    let Api;
    if (isSuperAdmin || isAdmin) {
      Api = `${Backend.auth}${Backend.users}?branch_id=${branchId || ''}`;
    } else {
      // For others, use the existing endpoint
      Api = `${Backend.auth}${Backend.communicationChatsTeacherStudentsContacts}?branch_id=${branchId || ''}${selectedSubject ? `&subject_id=${selectedSubject}` : ''}`;
    }

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
        console.log('DEBUG RequestMeetingModal: API Response data:', data);
        console.log('DEBUG RequestMeetingModal: isSuperAdmin=', isSuperAdmin, 'isAdmin=', isAdmin);
        console.log('DEBUG RequestMeetingModal: contactType=', contactType);

        if (isSuperAdmin || isAdmin) {
          // Filter users by role based on contactType
          const allUsers = data || [];
          console.log('DEBUG RequestMeetingModal: allUsers count=', allUsers.length);
          console.log('DEBUG RequestMeetingModal: allUsers sample:', allUsers.slice(0, 3));

          const filtered = allUsers.filter(u => {
            const role = u.role?.toLowerCase() || '';
            const match = contactType === 'teachers' ? role.includes('teacher') :
              contactType === 'admins' ? role.includes('admin') :
                contactType === 'parents' ? role.includes('parent') :
                  contactType === 'students' ? role.includes('student') : true;
            console.log(`DEBUG: User ${u.full_name}, role=${role}, match=${match}`);
            return match;
          });
          console.log('DEBUG RequestMeetingModal: filtered count=', filtered.length);
          setContacts(filtered);
          setSubjects([]);
        } else {
          // For teachers/parents/students
          setContacts(data.teachers || []);
          setSubjects(data.subjects || []);
        }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (e) => {
    const value = e.target.value;
    setSelectedSubject(value);
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

  const handleDateTimeChange = (date) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const formattedTime = format(date, 'HH:mm:ss');
      setFormData((prev) => ({
        ...prev,
        requested_date: formattedDate,
        requested_time: formattedTime,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await GetToken();
      const formDataToSend = new FormData();

      // Append all form data
      formDataToSend.append('requested_to', formData.requested_to);
      formDataToSend.append('requested_date', formData.requested_date);
      formDataToSend.append('requested_time', formData.requested_time);
      formDataToSend.append('notes', formData.notes);
      formDataToSend.append('requested_by', user.id);
      if (formData.branch_id) {
        formDataToSend.append('branch_id', formData.branch_id);
      }

      // Append file if exists
      if (file) {
        formDataToSend.append('attachment', file);
      }

      const response = await fetch(
        `${Backend.auth}${Backend.communicationMeetings}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Meeting requested successfully!');
        if (onSuccess) await onSuccess();
        onClose();
      } else {
        throw new Error(data.message || 'Failed to request meeting');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrogaFormModal
      onSubmit={handleSubmit}
      open={open}
      handleClose={onClose}
      onCancel={onClose}
      title={'Request New Meeting'}
      maxWidth="md"
      fullWidth
      sx={{ overflowY: 'auto' }}
    >
      <Grid container spacing={2}>
        {/* Contact Type Selector (for Super Admin/Admin) */}
        {(isSuperAdmin || isAdmin) && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select User Type</InputLabel>
              <Select
                value={contactType}
                label="Select User Type"
                onChange={(e) => setContactType(e.target.value)}
                disabled={loadingUser}
              >
                <MenuItem value="teachers">Teachers</MenuItem>
                <MenuItem value="admins">Admins</MenuItem>
                <MenuItem value="parents">Parents</MenuItem>
                <MenuItem value="students">Students</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Subject Filter (for teachers) */}
        {!isSuperAdmin && !isAdmin && subjects && subjects.length > 0 && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Filter by Subject (Optional)</InputLabel>
              <Select
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

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>
              {isSuperAdmin || isAdmin
                ? `Select ${contactType.charAt(0).toUpperCase() + contactType.slice(1)}`
                : 'Select Teacher'}
            </InputLabel>
            <Select
              labelId="contact-select-label"
              id="contact-select"
              name="requested_to"
              value={formData.requested_to}
              label={isSuperAdmin || isAdmin ? `Select ${contactType}` : 'Select Teacher'}
              onChange={handleChange}
              disabled={loadingUser}
            >
              <MenuItem value="">
                <em>{isSuperAdmin || isAdmin ? `Select a ${contactType.slice(0, -1)}` : 'Select a teacher'}</em>
              </MenuItem>
              {contacts.map((contact) => (
                <MenuItem key={contact.user_id || contact.id} value={contact.user_id || contact.id}>
                  {contact.full_name || contact.name}
                  {contact.branch_name && ` - ${contact.branch_name}`}
                  {contact.subjects && contact.subjects.length > 0 && ` (${contact.subjects.join(', ')})`}
                </MenuItem>
              ))}
            </Select>
            {loadingUser && (
              <CircularProgress
                size={24}
                sx={{ position: 'absolute', right: 40, top: 20 }}
              />
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <DateTimePicker
            label="Meeting Date & Time"
            value={
              formData.requested_date && formData.requested_time
                ? new Date(
                  `${formData.requested_date}T${formData.requested_time}`,
                )
                : null
            }
            onChange={handleDateTimeChange}
            renderInput={(params) => (
              <TextField {...params} fullWidth required />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Branch</InputLabel>
            <Select
              labelId="branch-select-label"
              id="branch-select"
              name="branch_id"
              value={formData.branch_id}
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
            rows={3}
            label="Reason for Meeting"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <input
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
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
              Attach File (PDF, DOC, Images)
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

export default RequestMeetingModal;
