import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
} from '@mui/material';
import PropTypes from 'prop-types';

const AttachmentModal = ({
  open,
  task,
  onClose,
  onSubmit,
  uploading,
  onFileChange,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Upload Attachment for {task?.title}</DialogTitle>
      <DialogContent>
        {uploading && <LinearProgress />}
        <input
          type="file"
          onChange={onFileChange}
          disabled={uploading}
          style={{ marginTop: '16px' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={uploading || !task}
          variant="contained"
          color="primary"
        >
          {uploading ? 'Uploading...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AttachmentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  task: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  uploading: PropTypes.bool.isRequired,
  onFileChange: PropTypes.func.isRequired,
};

export default AttachmentModal;
