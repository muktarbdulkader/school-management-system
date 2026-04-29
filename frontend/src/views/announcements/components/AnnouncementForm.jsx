import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  MenuItem,
  Box,
  Alert,
  Chip,
  Typography
} from '@mui/material';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const AnnouncementForm = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    is_urgent: false,
    target_audience: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [grammarResult, setGrammarResult] = useState(null);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear grammar result when message changes
    if (name === 'message') {
      setGrammarResult(null);
    }
  };

  // Auto-check grammar after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.message.trim().length > 10 && !grammarResult) {
        handleCheckGrammar(true); // silent mode
      }
    }, 2000); // Check after 2 seconds of no typing

    return () => clearTimeout(timer);
  }, [formData.message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.announcements}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Announcement created successfully');
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      message: '',
      is_urgent: false,
      target_audience: 'all'
    });
    setGrammarResult(null);
    onClose();
  };

  const handleCheckGrammar = async (silent = false) => {
    if (!formData.message.trim()) {
      if (!silent) toast.error('Please enter a message first');
      return;
    }

    setCheckingGrammar(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.baseUrl}/api/ai/grammar-check/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: formData.message,
          language: 'en'
        })
      });

      const data = await response.json();
      if (data.success) {
        setGrammarResult(data.data);
        if (data.data.corrected_text !== formData.message) {
          if (!silent) {
            toast.success(`Found ${data.data.errors_found || 0} issue(s). Review and click 'Apply All Corrections'.`);
          }
        } else {
          if (!silent) toast.success('No grammar issues found!');
        }
      } else {
        if (!silent) toast.error(data.message || 'Grammar check failed');
      }
    } catch (error) {
      console.error('Grammar check error:', error);
      if (!silent) toast.error('Failed to check grammar');
    } finally {
      setCheckingGrammar(false);
    }
  };

  const applyCorrections = () => {
    if (grammarResult?.corrected_text) {
      setFormData(prev => ({
        ...prev,
        message: grammarResult.corrected_text
      }));
      setGrammarResult(null);
      toast.success('Corrections applied!');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Announcement</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              multiline
              rows={4}
              required
              helperText={grammarResult && grammarResult.errors_found > 0 ? `${grammarResult.errors_found} grammar issues found` : ''}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SpellcheckIcon />}
                onClick={handleCheckGrammar}
                disabled={checkingGrammar || !formData.message.trim()}
              >
                {checkingGrammar ? 'Checking...' : 'Check Grammar'}
              </Button>
              {grammarResult && grammarResult.corrected_text !== formData.message && (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  onClick={applyCorrections}
                  startIcon={<SpellcheckIcon />}
                >
                  Apply All ({grammarResult.errors_found || 0})
                </Button>
              )}
              {grammarResult && grammarResult.errors_found === 0 && (
                <Chip size="small" color="success" icon={<SpellcheckIcon />} label="Grammar OK" />
              )}
            </Box>

            {/* Grammar Issues Display */}
            {grammarResult && grammarResult.suggestions && grammarResult.suggestions.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Found {grammarResult.errors_found} issue(s) to fix:
                  </Typography>
                </Alert>

                {grammarResult.suggestions.map((suggestion, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      bgcolor: 'error.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'error.200'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'error.main',
                          textDecoration: 'line-through',
                          fontWeight: 500
                        }}
                      >
                        "{suggestion.original}"
                      </Typography>
                      <Typography variant="body2" color="text.secondary">→</Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'success.main',
                          fontWeight: 600,
                          bgcolor: 'success.50',
                          px: 0.5,
                          borderRadius: 0.5
                        }}
                      >
                        "{suggestion.correction}"
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {suggestion.explanation}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            <TextField
              fullWidth
              select
              label="Target Audience"
              name="target_audience"
              value={formData.target_audience}
              onChange={handleChange}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="students">Students</MenuItem>
              <MenuItem value="teachers">Teachers</MenuItem>
              <MenuItem value="parents">Parents</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  name="is_urgent"
                  checked={formData.is_urgent}
                  onChange={handleChange}
                />
              }
              label="Mark as Urgent"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AnnouncementForm;
