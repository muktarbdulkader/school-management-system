import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import { useDispatch, useSelector } from 'react-redux';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const RequestMeetingModal = ({ open, onClose, onSuccess }) => {
  const { user } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    requested_to: '',
    requested_date: '',
    requested_time: '',
    notes: '',
    branch_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [availableParents, setAvailableParents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [error, setError] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const fetchUsers = async () => {
    setLoadingUser(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.users}?page=${pagination.page + 1}&per_page=${pagination.per_page}`;
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

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    const formattedDate = format(date, 'yyyy-MM-dd');
    const formattedTime = format(date, 'HH:mm:ss');
    setFormData((prev) => ({
      ...prev,
      requested_date: formattedDate,
      requested_time: formattedTime,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.auth}${Backend.communicationMeetings}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            requested_by: user.id,
          }),
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
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Select User</InputLabel>
            <Select
              labelId="user-select-label"
              id="user-select"
              name="requested_to"
              value={formData.requested_to}
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

export default RequestMeetingModal;
