import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Card, CardContent, Grid, Rating,
  TextField, Button, CircularProgress, Avatar, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  InputAdornment, LinearProgress, Paper, IconButton, Tooltip,
  Divider, Fade
} from '@mui/material';
import { 
  Star, Person, Search, InfoOutlined, 
  Timeline, Assessment, Verified, 
  FormatQuote, FilterList
} from '@mui/icons-material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import PageContainer from 'ui-component/MainPage';

const CATEGORIES = [
  { value: 'teaching_quality',     label: 'Teaching Quality', icon: '🎓' },
  { value: 'punctuality',          label: 'Punctuality', icon: '⏰' },
  { value: 'communication',        label: 'Communication', icon: '💬' },
  { value: 'classroom_management', label: 'Classroom Mgmt', icon: '🏫' },
  { value: 'student_engagement',   label: 'Engagement', icon: '🤝' },
  { value: 'professionalism',      label: 'Professionalism', icon: '👔' },
];

export default function TeacherRatingsPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingDialog, setRatingDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [category, setCategory] = useState('teaching_quality');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRatingData, setMyRatingData] = useState(null);

  const user = useSelector((state) => state.user?.user);
  const userRoles = (user?.roles || []).map(r =>
    (typeof r === 'string' ? r : r?.name || '').toLowerCase()
  );
  const isParent  = userRoles.includes('parent');
  const isStudent = userRoles.includes('student');
  const isTeacher = userRoles.includes('teacher');
  const isAdmin   = userRoles.includes('admin') || userRoles.includes('super_admin');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isTeacher && !isAdmin) {
        await fetchMyOwnProfile();
      } else {
        await fetchTeachersList();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOwnProfile = async () => {
    try {
      const token = await GetToken();
      // Use teacher overview to get their profile with ratings
      const res = await fetch(`${Backend.api}${Backend.teachersOverviewDashboard}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Find teacher profile info - we might need to hit specific teacher detail
        // Let's also fetch all ratings for this teacher
        const myId = data.data?.teacher_id; // Internal teacher ID
        if (myId) {
          const detailRes = await fetch(`${Backend.api}${Backend.teachers}${myId}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const detailData = await detailRes.json();
          if (detailRes.ok) setMyRatingData(detailData.data || detailData);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeachersList = async () => {
    try {
      const token = await GetToken();
      let apiUrl = `${Backend.api}${Backend.teachers}`;
      
      if (isStudent || isParent) {
        const profileUrl = isStudent ? `${Backend.api}${Backend.studentMe}` : `${Backend.api}${Backend.parentChildren}`;
        const profileRes = await fetch(profileUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          let sId = null;
          if (isStudent) sId = profileData.data?.id || profileData.id;
          else {
            const kids = profileData.data || profileData.results || [];
            if (kids.length > 0) sId = kids[0].student?.id || kids[0].student_id;
          }
          if (sId) apiUrl = `${Backend.api}${Backend.parentAvailableTeachers}${sId}/`;
        }
      }
      
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = data.data?.teachers || data.data || data.results || [];
      setTeachers(list);
    } catch (error) {
      toast.error('Failed to load teachers');
    }
  };

  // State for multi-category ratings
  const [multiRatings, setMultiRatings] = useState({});

  useEffect(() => {
    // Reset multi-ratings when modal opens
    if (ratingDialog) {
      setMultiRatings({});
      setComment('');
    }
  }, [ratingDialog]);

  const toggleCategoryRating = (catValue, value) => {
    setMultiRatings(prev => ({
      ...prev,
      [catValue]: value
    }));
  };

  const handleSubmit = async () => {
    const ratingsArray = Object.entries(multiRatings).map(([catValue, value]) => ({
      teacher: selectedTeacher.teacher_id || selectedTeacher.id,
      rating: value,
      category: catValue,
      comment: comment || ""
    }));

    if (ratingsArray.length === 0) {
      toast.warning('Please select at least one rating');
      return;
    }

    setSubmitting(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.teacherRatings}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teacher: selectedTeacher.teacher_id || selectedTeacher.id,
          ratings: ratingsArray 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Submitted ${ratingsArray.length} ratings!`);
        setRatingDialog(false);
        fetchTeachersList();
      } else {
        toast.error(data.message || 'Submission failed');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const TeacherCard = ({ teacher }) => {
    const stats = teacher.rating_stats || { overall_avg: 0, total_count: 0, categories: {} };
    
    return (
      <Card sx={{ 
        height: '100%', 
        borderRadius: 4, 
        overflow: 'visible',
        position: 'relative',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
      }}>
        <CardContent sx={{ pt: 4 }}>
          <Box sx={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)' }}>
            <Avatar 
              sx={{ 
                width: 70, height: 70, 
                border: '4px solid #fff',
                boxShadow: 2,
                bgcolor: 'primary.main',
                fontSize: 28
              }}
            >
              {(teacher.full_name || teacher.user_details?.full_name || 'T')[0]}
            </Avatar>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              {teacher.full_name || teacher.user_details?.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              {teacher.subject_details?.map(s => s.name).join(', ') || 'Department Teacher'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h3" fontWeight={800} color="primary">
                {stats.overall_avg > 0 ? stats.overall_avg.toFixed(1) : '--'}
              </Typography>
              <Box sx={{ textAlign: 'left' }}>
                <Rating value={stats.overall_avg || 0} readOnly precision={0.5} size="small" />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {stats.total_count} Reviews
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={1} sx={{ mb: 3 }}>
              {CATEGORIES.slice(0, 3).map(cat => (
                <Grid item xs={4} key={cat.value}>
                  <Tooltip title={cat.label}>
                  <Box sx={{ 
                    p: 0.5, 
                    borderRadius: 2, 
                    bgcolor: stats.categories[cat.value] ? 'primary.light' : 'action.hover',
                    color: stats.categories[cat.value] ? 'white' : 'inherit'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {stats.categories[cat.value] || '--'}
                    </Typography>
                  </Box>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>

            {(isStudent || isParent) && (
              <Button 
                variant={teacher.has_rated ? "outlined" : "contained"}
                color={teacher.has_rated ? "success" : "primary"}
                fullWidth 
                onClick={() => {
                  setSelectedTeacher(teacher);
                  setRatingDialog(true);
                }}
                sx={{ borderRadius: 10, py: 1, fontWeight: 700 }}
                startIcon={teacher.has_rated ? <Verified /> : null}
              >
                {teacher.has_rated ? "Rated" : "Rate Now"}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress thickness={5} />
    </Box>
  );

  return (
    <PageContainer title="Teacher Ratings">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        
        {isTeacher && myRatingData && (
          <Fade in timeout={800}>
            <Box sx={{ mb: 6 }}>
              <Typography variant="h3" fontWeight={900} sx={{ mb: 3 }}>My Performance Index</Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid #eee' }}>
                    <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 4 }}>
                      <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', fontSize: 32 }}>
                        {myRatingData.full_name?.[0] || user?.full_name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight={900}>{myRatingData.full_name || user?.full_name}</Typography>
                        <Rating value={myRatingData.rating_stats?.overall_avg || 0} readOnly size="large" />
                        <Typography variant="body2" color="text.secondary">Verified Educator Profile</Typography>
                      </Box>
                    </Stack>
                    
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Rating Distribution</Typography>
                    <Stack spacing={2}>
                      {CATEGORIES.map(cat => (
                        <Box key={cat.value}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{cat.label}</Typography>
                            <Typography variant="caption" fontWeight={700}>{myRatingData.rating_stats?.categories[cat.value] || 0} / 5</Typography>
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={(myRatingData.rating_stats?.categories[cat.value] || 0) * 20} 
                            sx={{ height: 6, borderRadius: 3, bgcolor: '#f0f0f0' }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Stack spacing={2} height="100%">
                    <Paper sx={{ p: 4, borderRadius: 6, flex: 1, bgcolor: 'primary.main', color: 'white' }}>
                      <Verified fontSize="large" sx={{ mb: 2 }} />
                      <Typography variant="h5" fontWeight={800} gutterBottom>Top Tier!</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Your student engagement is consistently above the campus average.
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 3, borderRadius: 6, border: '1px solid #eee' }}>
                      <Typography variant="caption" color="text.secondary">Total Feedbacks</Typography>
                      <Typography variant="h2" fontWeight={900}>{myRatingData.rating_stats?.total_count || 0}</Typography>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {(!isTeacher || isAdmin) && (
          <>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h2" fontWeight={900} sx={{ letterSpacing: -1 }}>Teacher Directory</Typography>
              <Typography variant="body1" color="text.secondary">Discover and rate the performance of your instructors</Typography>
              
              <Box sx={{ mt: 3, maxWidth: 450, mx: 'auto' }}>
                <TextField
                  fullWidth placeholder="Search by name or subject..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <Search color="action" />,
                    sx: { borderRadius: 10, bgcolor: 'background.paper' }
                  }}
                />
              </Box>
            </Box>

            <Grid container spacing={4}>
              {teachers.filter(t => (t.full_name || t.user_details?.full_name || '').toLowerCase().includes(search.toLowerCase())).map(t => (
                <Grid item xs={12} sm={6} md={4} key={t.id}>
                  <TeacherCard teacher={t} />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Dialog 
          open={ratingDialog} 
          onClose={() => setRatingDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 6, overflow: 'hidden' } }}
        >
          <Box sx={{ p: 4, position: 'relative' }}>
            <Typography variant="h4" fontWeight={900} gutterBottom align="center">
              Multiple Evaluation
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
              Rate {selectedTeacher?.full_name || selectedTeacher?.user_details?.full_name} across categories
            </Typography>

            <Grid container spacing={2}>
              {CATEGORIES.map(cat => (
                <Grid item xs={12} sm={6} key={cat.value}>
                  <Paper sx={{ 
                    p: 2, 
                    borderRadius: 4, 
                    border: '1px solid',
                    borderColor: multiRatings[cat.value] ? 'primary.main' : '#eee',
                    bgcolor: multiRatings[cat.value] ? 'primary.light' : 'white',
                    color: multiRatings[cat.value] ? 'white' : 'inherit',
                    transition: 'all 0.2s'
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={800}>{cat.icon} {cat.label}</Typography>
                      {multiRatings[cat.value] && <Typography variant="caption" fontWeight={900}>{multiRatings[cat.value]}/5</Typography>}
                    </Stack>
                    <Rating 
                      value={multiRatings[cat.value] || 0} 
                      onChange={(_, v) => toggleCategoryRating(cat.value, v)} 
                      sx={{ color: multiRatings[cat.value] ? 'white' : 'primary.main' }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <TextField
              sx={{ mt: 4 }}
              label="Share a specific comment"
              multiline rows={2} fullWidth
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="What makes this teacher unique?"
              variant="outlined"
            />

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button onClick={() => setRatingDialog(false)} fullWidth sx={{ borderRadius: 10 }} color="inherit">
                Cancel
              </Button>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleSubmit} 
                disabled={submitting}
                sx={{ borderRadius: 10, py: 1.5, fontWeight: 900 }}
              >
                Submit All Reviews
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Container>
    </PageContainer>
  );
}
