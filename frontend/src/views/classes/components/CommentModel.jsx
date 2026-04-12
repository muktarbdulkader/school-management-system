import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

/**
 * Reusable CommentDialog component (MUI)
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSave: ({ studentId, comment, attendance }) => void
 * - studentId: string|number | null
 * - initialText: string (initial comment text)
 * - pendingAttendance: string | null (e.g. 'permission', 'noPermission')
 * - requireComment: boolean (default true) - when true and pendingAttendance is set, Save is disabled for empty comment
 * - title: string (optional)
 *
 * Usage (integration example included at bottom of this file in comments):
 * - manage dialog open state in parent, pass studentId + pendingAttendance + initialText
 * - onSave should update your students state, then close the dialog
 */

export default function CommentDialog({
  open,
  onClose,
  onSave,
  studentId = null,
  initialText = '',
  pendingAttendance = null,
  requireComment = true,
  title = null,
}) {
  const [commentText, setCommentText] = useState(initialText || '');

  useEffect(() => {
    // reset when dialog opens or initialText changes
    if (open) setCommentText(initialText || '');
  }, [open, initialText]);

  const handleSave = () => {
    // trim comment
    const trimmed = commentText.trim();
    onSave({ studentId, comment: trimmed, attendance: pendingAttendance });
  };

  const dialogTitle = title
    || (pendingAttendance ? `Add comment for ${pendingAttendance}` : 'Edit comment');

  const saveDisabled = requireComment && pendingAttendance && commentText.trim() === '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Comment / Reason"
            type="text"
            fullWidth
            multiline
            minRows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter reason or comment for this attendance..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saveDisabled}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CommentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  studentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialText: PropTypes.string,
  pendingAttendance: PropTypes.string,
  requireComment: PropTypes.bool,
  title: PropTypes.string,
};


