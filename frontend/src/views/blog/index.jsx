import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Stack,
  Pagination,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import EventIcon from '@mui/icons-material/Event';
import axios from 'axios';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import BlogPostForm from './components/BlogPostForm';
import { hasPermission, PERMISSIONS } from 'config/rolePermissions';
import { useSelector } from 'react-redux';

// Predefined categories matching the form
const CATEGORIES = [
  { id: 'school', name: 'School', color: '#3b82f6' },
  { id: 'events', name: 'Events', color: '#8b5cf6' },
  { id: 'academics', name: 'Academics', color: '#10b981' },
  { id: 'sports', name: 'Sports', color: '#f59e0b' },
  { id: 'parent_resources', name: 'Parent Resources', color: '#ec4899' },
];

export default function BlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const postsPerPage = 9;
  const userRoles = useSelector((state) => state.user?.user?.roles || []);
  const user = useSelector((state) => state.user?.user);
  const canCreateBlogPost = hasPermission(userRoles, PERMISSIONS.CREATE_BLOG_POST);
  const canDeleteBlogPost = hasPermission(userRoles, PERMISSIONS.DELETE_BLOG_POST);
  const canEditBlogPost = hasPermission(userRoles, PERMISSIONS.EDIT_BLOG_POST);

  useEffect(() => {
    fetchBlogData();
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchBlogData, 30000);
    return () => clearInterval(interval);
  }, [page, selectedCategory]);

  const fetchBlogData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = await GetToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch blog posts
      const postsUrl = `${Backend.api}${Backend.blogPosts}`;
      const postsRes = await axios.get(postsUrl, { headers });
      const postsData = postsRes.data?.data || postsRes.data?.results || [];

      setPosts(postsData);
      setTotalPages(Math.ceil(postsData.length / postsPerPage));

    } catch (err) {
      console.error('Error fetching blog data:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this post?')) return;
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.blogPosts}${postId}/`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) fetchBlogData();
      else toast.error('Failed to delete post');
    } catch { toast.error('Error deleting post'); }
  };

  const handleEditPost = (e, post) => {
    e.stopPropagation();
    setEditingPost(post);
    setFormOpen(true);
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setFormOpen(true);
  };

  const canManagePost = (post) =>
    canDeleteBlogPost || canEditBlogPost || post.author === user?.id || post.author_id === user?.id;

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handlePostClick = (postId) => {
    navigate(`/blog/${postId}`);
  };

  const getCategoryLabel = (categoryId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat?.name || categoryId;
  };

  const getCategoryColor = (categoryId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat?.color || '#6b7280';
  };

  // Filter posts based on search and category
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      post.category === selectedCategory ||
      post.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Paginate filtered posts
  const paginatedPosts = filteredPosts.slice(
    (page - 1) * postsPerPage,
    page * postsPerPage
  );

  if (loading && posts.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          School Blog
        </Typography>
        {canCreateBlogPost && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePost}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
            }}
          >
            New Post
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: '#f9fafb',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label="All"
                onClick={() => handleCategoryFilter('all')}
                sx={{
                  mb: 1,
                  borderRadius: 4,
                  px: 2,
                  fontWeight: 600,
                  bgcolor: selectedCategory === 'all' ? '#3b82f6' : 'transparent',
                  color: selectedCategory === 'all' ? 'white' : '#374151',
                  border: '2px solid #3b82f6',
                  '&:hover': {
                    bgcolor: selectedCategory === 'all' ? '#3b82f6' : '#dbeafe',
                  }
                }}
              />
              {CATEGORIES.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  onClick={() => handleCategoryFilter(category.id)}
                  sx={{
                    mb: 1,
                    borderRadius: 4,
                    px: 2,
                    fontWeight: 600,
                    bgcolor: selectedCategory === category.id ? category.color : 'transparent',
                    color: selectedCategory === category.id ? 'white' : '#374151',
                    border: `2px solid ${category.color}`,
                    '&:hover': {
                      bgcolor: selectedCategory === category.id ? category.color : `${category.color}20`,
                    }
                  }}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Blog Posts Grid */}
      {paginatedPosts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f9fafb', borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No blog posts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Check back later for new posts'}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedPosts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: post.post_type === 'urgent'
                      ? '0 4px 20px rgba(220, 38, 38, 0.15)'
                      : '0 4px 20px rgba(0,0,0,0.08)',
                    border: post.post_type === 'urgent'
                      ? '2px solid #fecaca'
                      : '1px solid #e5e7eb',
                    '&:hover': {
                      boxShadow: post.post_type === 'urgent'
                        ? '0 8px 30px rgba(220, 38, 38, 0.2)'
                        : '0 8px 30px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease',
                    },
                  }}
                  onClick={() => handlePostClick(post.id)}
                >
                  {post.image && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={post.image}
                      alt={post.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Category & Priority Badges */}
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip
                        label={getCategoryLabel(post.category)}
                        size="small"
                        sx={{
                          bgcolor: `${getCategoryColor(post.category)}15`,
                          color: getCategoryColor(post.category),
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          borderRadius: 2,
                        }}
                      />
                      {post.post_type === 'urgent' && (
                        <Chip
                          icon={<WarningIcon sx={{ fontSize: 14 }} />}
                          label="Urgent"
                          size="small"
                          sx={{
                            bgcolor: '#fee2e2',
                            color: '#dc2626',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            borderRadius: 2,
                          }}
                        />
                      )}
                      {post.event_date && (
                        <Chip
                          icon={<EventIcon sx={{ fontSize: 14 }} />}
                          label={dayjs(post.event_date).format('MMM DD')}
                          size="small"
                          sx={{
                            bgcolor: '#dbeafe',
                            color: '#2563eb',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      {post.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.6,
                      }}
                    >
                      {post.content}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon fontSize="small" sx={{ color: '#9ca3af' }} />
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(post.created_at).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                      {post.author_name && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon fontSize="small" sx={{ color: '#9ca3af' }} />
                          <Typography variant="caption" color="text.secondary">
                            {post.author_name}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 3, py: 2, pt: 0 }}>
                    <Button
                      size="small"
                      onClick={() => handlePostClick(post.id)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Read More
                    </Button>
                    {canManagePost(post) && (
                      <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
                        {canEditBlogPost && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleEditPost(e, post)}
                            sx={{ color: '#3b82f6' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {canDeleteBlogPost && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeletePost(e, post.id)}
                            sx={{ color: '#dc2626' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
          )}
        </>
      )}

      <BlogPostForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchBlogData}
        editingPost={editingPost}
      />
    </Container>
  );
}
