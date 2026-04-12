import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const EditMeeting = ({
  edit,
  isUpdating,
  meetingData = {},
  users = [],
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    // requested_to: meetingData.requested_to?.id || '',
    requested_date: meetingData.requested_date || '',
    requested_time: meetingData.requested_time || '',
    notes: meetingData.notes || '',
    // branch_id: meetingData.branch_id || '',
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');

  // EditMeeting.js
  useEffect(() => {
    if (meetingData && users.length > 0) {
      const requestedToId =
        meetingData.requested_to_details?.id || meetingData.requested_to;
      const userExists = users.some((user) => user.id === requestedToId);

      setFormData({
        // requested_to: userExists ? requestedToId : '',
        requested_date: meetingData.requested_date || '',
        requested_time: meetingData.requested_time || '',
        notes: meetingData.notes || '',
        // branch_id: meetingData.branch_id || '',
      });
    }
  }, [meetingData, users]); // Add users to dependency array

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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      //   !formData.requested_to ||
      !formData.requested_date ||
      !formData.requested_time
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    onSubmit(formData);
  };

  return (
    <DrogaFormModal
      open={edit}
      title="Edit Meeting"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isUpdating}
      maxWidth="md"
      fullWidth
      sx={{ overflowY: 'auto' }}
    >
      <Grid container spacing={2}>
        {/* <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Select User *</InputLabel>
            <Select
              labelId="user-select-label"
              id="user-select"
              name="requested_to"
              value={formData.requested_to}
              label="Receiver User"
              onChange={handleChange}
              disabled={loadingUsers}
              required
              displayEmpty
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.full_name}
                </MenuItem>
              ))}
            </Select>
            {loadingUsers && (
              <CircularProgress
                size={24}
                sx={{ position: 'absolute', right: 40, top: 20 }}
              />
            )}
          </FormControl>
        </Grid> */}
        <Grid item xs={12}>
          <DateTimePicker
            label="Meeting Date & Time *"
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

        {/* <Grid item xs={12}>
          <input
           
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
        </Grid> */}
      </Grid>
    </DrogaFormModal>
  );
};

EditMeeting.propTypes = {
  edit: PropTypes.bool.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  meetingData: PropTypes.object,
  users: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditMeeting;
