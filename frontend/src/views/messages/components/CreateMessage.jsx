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
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (open) {
      fetchBranches();
      fetchUsers();
    }
  }, [open]);

  const fetchBranches = async () => {
    setLoadingBranches(true);
    const token = await GetToken();
    const branchId = user?.branch_id;
    const Api = `${Backend.auth || '/api/'}${Backend.branches || 'branches/'}?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}${branchId ? `&branch_id=${branchId}` : ''}`;
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
        setBranches(responseData.data);
        setPagination({
          ...pagination,
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
      setLoadingBranches(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUser(true);
    const token = await GetToken();
    const branchId = user?.branch_id;
    const Api = `${Backend.auth || '/api/'}${Backend.users || 'users/'}?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}${branchId ? `&branch_id=${branchId}` : ''}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch users');
      }

      if (responseData.success) {
        setUsers(responseData.data);
        setPagination({
          ...pagination,
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
      setLoadingUser(false);
    }
  };

  const handleFetchingMessages = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationChats}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch messages');
      }

      if (responseData.success) {
        setMessage(responseData.data);
        setPagination({
          ...pagination,
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setMessageDetails((prev) => ({ ...prev, [name]: value }));
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
    // handleFetchingMessages(); // REMOVED - why fetch BEFORE submitting?

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

        if (onSubmit) onSubmit(data.data); // Notify parent with data
        onClose();

        console.log('fetchMessages called after submission');
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
        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="user-select-label">Receiver User</InputLabel>
            <Select
              labelId="user-select-label"
              id="user-select"
              name="receiver"
              value={messageDetails.receiver}
              label="Receiver User"
              onChange={handleChange}
              disabled={loadingUser}
            >
              <MenuItem value="">
                <em>Select a user</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.full_name}
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
