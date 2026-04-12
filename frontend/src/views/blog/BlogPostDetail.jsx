import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  IconButton,
  TextField,
  Card,
  CardContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';

export default function BlogPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState('');
  const user = useSelector((state) => state.user?.user);

  useEffect(() => {
    fetchPostDetail();
  }, [id]);

  const fetchPostDetail = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch post
      const postRes = await axios.get(`${Backend.api}${Backend.blogPosts}${id}/`, { headers });
      setPost(postRes.data?.data || postRes.data);

      // Fetch comments (filtered by post)
      // Note: Ideally the backend supports filtering comments by post_id
      const commentsRes = await axios.get(`${Backend.api}${Backend.blogComments}?post_id=${id}`, { headers });
      const allComments = commentsRes.data?.data || commentsRes.data?.results || [];
      // Client-side filter if backend didn't do it
      setComments(allComments.filter(c => c.post === id || c.post_id === id));
      
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load blog post. It may have been deleted or you may not have permission.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      const token = await GetToken();
      await axios.post(
        `${Backend.api}${Backend.blogComments}`,
        { post: id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      // Show success message or refresh
      alert('Comment submitted for approval!');
    } catch (err) {
      alert('Failed to submit comment');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/blog')} sx={{ mb: 2 }}>
          Back to Blog
        </Button>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/blog')} 
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        Back to blog
      </Button>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        {post.image && (
          <Box 
            component="img" 
            src={post.image} 
            alt={post.title}
            sx={{ 
              width: '100%', 
              height: { xs: 200, md: 400 }, 
              objectFit: 'cover', 
              borderRadius: 3,
              mb: 4
            }}
          />
        )}

        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
          {post.title}
        </Typography>

        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4, color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {post.author_name?.[0] || <PersonIcon />}
            </Avatar>
            <Typography variant="subtitle2">
              {post.author_name || 'Anonymous Staff'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon fontSize="small" />
            <Typography variant="caption">
              {dayjs(post.created_at).format('MMMM DD, YYYY')}
            </Typography>
          </Box>
          {post.category_name && (
            <Chip label={post.category_name} size="small" color="primary" variant="outlined" />
          )}
        </Stack>

        <Divider sx={{ mb: 4 }} />

        <Typography 
          variant="body1" 
          sx={{ 
            lineHeight: 1.8, 
            fontSize: '1.1rem',
            whiteSpace: 'pre-wrap',
            color: 'text.primary'
          }}
        >
          {post.content}
        </Typography>

        <Box sx={{ mt: 8 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            Comments ({comments.length})
          </Typography>
          
          <Stack spacing={2} sx={{ mb: 4 }}>
            {comments.map((comment) => (
              <Card key={comment.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {comment.author_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(comment.created_at).fromNow ? dayjs(comment.created_at).format('MMM DD') : 'Recently'}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">
                    {comment.content}
                  </Typography>
                </CardContent>
              </Card>
            ))}
            {comments.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No comments yet. Be the first to share your thoughts!
              </Typography>
            )}
          </Stack>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 40, height: 40 }}>{user?.full_name?.[0]}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                endIcon={commentLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                disabled={commentLoading || !newComment.trim()}
                onClick={handleAddComment}
              >
                Post Comment
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
