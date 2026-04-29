import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import dayjs from 'dayjs';

const CATEGORIES = [
  { id: 'school', name: 'School' },
  { id: 'events', name: 'Events' },
  { id: 'academics', name: 'Academics' },
  { id: 'sports', name: 'Sports' },
  { id: 'parent_resources', name: 'Parent Resources' },
];

const BlogPostForm = ({ open, onClose, onSuccess, editingPost = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    category_id: '',
    post_type: 'normal',
    event_date: '',
    image: '',
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [grammarResult, setGrammarResult] = useState(null);

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (editingPost) {
        setFormData({
          title: editingPost.title || '',
          content: editingPost.content || '',
          category: editingPost.category || '',
          category_id: editingPost.category || '',
          post_type: editingPost.post_type || 'normal',
          event_date: editingPost.event_date || '',
          image: editingPost.image || '',
        });
      } else {
        setFormData({
          title: '',
          content: '',
          category: '',
          category_id: '',
          post_type: 'normal',
          event_date: '',
          image: '',
        });
      }
    }
  }, [open, editingPost]);

  const fetchCategories = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.blogCategories}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || data.results || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear grammar result when content changes
    if (name === 'content') {
      setGrammarResult(null);
    }
  };

  // Auto-check grammar after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.content.trim().length > 10 && !grammarResult) {
        handleCheckGrammar(true); // silent mode
      }
    }, 2000); // Check after 2 seconds of no typing

    return () => clearTimeout(timer);
  }, [formData.content]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id) {
      toast.error('Please fill in all required fields including category');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const url = editingPost
        ? `${Backend.api}${Backend.blogPosts}${editingPost.id}/`
        : `${Backend.api}${Backend.blogPosts}`;
      const method = editingPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category_id,
          post_type: formData.post_type,
          event_date: formData.event_date || null,
          image: formData.image || null,
        })
      });

      if (response.ok) {
        toast.success(editingPost ? 'Blog post updated successfully' : 'Blog post created successfully');
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save blog post');
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast.error('Failed to save blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      category_id: '',
      post_type: 'normal',
      event_date: '',
      image: '',
    });
    setGrammarResult(null);
    onClose();
  };

  const handleCheckGrammar = async (silent = false) => {
    if (!formData.content.trim()) {
      if (!silent) toast.error('Please enter content first');
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
          text: formData.content,
          language: 'en'
        })
      });

      const data = await response.json();
      if (data.success) {
        setGrammarResult(data.data);
        if (data.data.corrected_text !== formData.content) {
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
        content: grammarResult.corrected_text
      }));
      setGrammarResult(null);
      toast.success('Corrections applied!');
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      school: '#3b82f6',
      events: '#8b5cf6',
      academics: '#10b981',
      sports: '#f59e0b',
      parent_resources: '#ec4899',
    };
    return colors[cat] || '#6b7280';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Title */}
            <TextField
              fullWidth
              label="Post Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter post title..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Content */}
            <TextField
              fullWidth
              label="Content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              multiline
              rows={6}
              required
              placeholder="Write your post content here..."
              helperText={grammarResult && grammarResult.errors_found > 0 ? `${grammarResult.errors_found} grammar issues found` : ''}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Grammar Check */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SpellcheckIcon />}
                onClick={handleCheckGrammar}
                disabled={checkingGrammar || !formData.content.trim()}
              >
                {checkingGrammar ? 'Checking...' : 'Check Grammar'}
              </Button>
              {grammarResult && grammarResult.corrected_text !== formData.content && (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  onClick={applyCorrections}
                  startIcon={<SpellcheckIcon />}
                >
                  Apply All Corrections ({grammarResult.errors_found || 0})
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
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

            <Divider />

            {/* Category Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}>
                Post Category *
              </Typography>
              {categories.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Loading categories...</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {categories.map((cat) => (
                    <Chip
                      key={cat.id}
                      label={cat.name}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.name, category_id: cat.id }))}
                      sx={{
                        bgcolor: formData.category_id === cat.id ? getCategoryColor(cat.name.toLowerCase()) : 'transparent',
                        color: formData.category_id === cat.id ? 'white' : '#374151',
                        border: `2px solid ${getCategoryColor(cat.name.toLowerCase())}`,
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: formData.category_id === cat.id ? getCategoryColor(cat.name.toLowerCase()) : `${getCategoryColor(cat.name.toLowerCase())}20`,
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
              {!formData.category_id && (
                <Typography variant="caption" sx={{ color: '#dc2626', mt: 1, display: 'block' }}>
                  Please select a category
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Post Type & Priority */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}>
                Post Priority
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  label="Normal"
                  onClick={() => setFormData(prev => ({ ...prev, post_type: 'normal' }))}
                  icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', mr: 0.5 }} />}
                  sx={{
                    bgcolor: formData.post_type === 'normal' ? '#d1fae5' : 'transparent',
                    border: '2px solid #10b981',
                    color: '#065f46',
                    fontWeight: 600,
                    px: 2,
                    py: 1.5,
                    '& .MuiChip-icon': { ml: 0.5 },
                  }}
                />
                <Chip
                  label="Urgent"
                  onClick={() => setFormData(prev => ({ ...prev, post_type: 'urgent' }))}
                  icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626', mr: 0.5 }} />}
                  sx={{
                    bgcolor: formData.post_type === 'urgent' ? '#fee2e2' : 'transparent',
                    border: '2px solid #dc2626',
                    color: '#991b1b',
                    fontWeight: 600,
                    px: 2,
                    py: 1.5,
                    '& .MuiChip-icon': { ml: 0.5 },
                  }}
                />
              </Box>
              {formData.post_type === 'urgent' && (
                <Typography variant="caption" sx={{ color: '#dc2626', mt: 1, display: 'block' }}>
                  Urgent posts will appear as high-visibility alerts on the Parent Dashboard
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Event Date */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}>
                Event Date (Optional)
              </Typography>
              <TextField
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                fullWidth
                helperText="Select a date to highlight this post on the calendar"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Divider />

            {/* Image URL */}
            <TextField
              fullWidth
              label="Image URL (optional)"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={loading} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 4,
              bgcolor: formData.post_type === 'urgent' ? '#dc2626' : '#3b82f6',
              '&:hover': {
                bgcolor: formData.post_type === 'urgent' ? '#b91c1c' : '#2563eb',
              }
            }}
          >
            {loading ? 'Saving...' : (editingPost ? 'Update' : 'Publish')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BlogPostForm;
