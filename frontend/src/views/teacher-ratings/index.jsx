import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Card, CardContent, Grid, Rating,
  TextField, Button, CircularProgress, Avatar, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  InputAdornment, LinearProgress, Paper, IconButton, Tooltip,
  Divider, Fade, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
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

// Dynamic criteria will be loaded from backend
const DEFAULT_CATEGORIES = [];

export default function TeacherRatingsPage() {
  const [teachers, setTeachers] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingDialog, setRatingDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRatingData, setMyRatingData] = useState(null);
  const [criteriaLoading, setCriteriaLoading] = useState(true);
  const [myRatings, setMyRatings] = useState([]);
  const [myRatingsLoading, setMyRatingsLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  const user = useSelector((state) => state.user?.user);
  const userRoles = (user?.roles || []).map(r =>
    (typeof r === 'string' ? r : r?.name || '').toLowerCase()
  );
  const isParent = userRoles.includes('parent');
  const isStudent = userRoles.includes('student');
  const isTeacher = userRoles.includes('teacher');
  const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin') || userRoles.includes('head_admin') || userRoles.includes('ceo');
  const canViewAllTeachers = isAdmin; // Only admins see all teachers
  const canRateTeachers = isStudent || isParent || isAdmin; // Students, parents, and admins can rate

  // Evaluation period settings from backend
  const [evaluationSettings, setEvaluationSettings] = useState({
    is_evaluation_period_open: true,
    message: 'Evaluation period is open'
  });
  const isEvaluationPeriod = evaluationSettings.is_evaluation_period_open;

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Also refresh data when window becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch evaluation settings and criteria first
      await Promise.all([fetchCriteria(), fetchEvaluationSettings()]);

      if (isTeacher && !isAdmin) {
        await fetchMyOwnProfile();
      } else if (isStudent || isParent) {
        await fetchMyTeachers(); // Students/Parents only see their teachers
        await fetchMyRatingsHistory(); // Also load their rating history
      } else {
        await fetchTeachersList(); // Admins see all teachers
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluationSettings = async () => {
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.performanceEvaluationSettings}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEvaluationSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching evaluation settings:', error);
      // Keep default open state on error
    }
  };

  const fetchMyRatingsHistory = async () => {
    if (!isStudent && !isParent) return;
    setMyRatingsLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.teacherRatingsMy}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyRatings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching my ratings:', error);
    } finally {
      setMyRatingsLoading(false);
    }
  };

  const fetchCriteria = async () => {
    setCriteriaLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.performanceCriteriaActive}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const activeCriteria = data.data || [];
        setCriteria(activeCriteria);
        // Set default category to first criteria if available
        if (activeCriteria.length > 0 && !category) {
          setCategory(activeCriteria[0].code);
        }
      } else {
        // Fallback to empty if API fails
        setCriteria([]);
      }
    } catch (error) {
      console.error('Error fetching criteria:', error);
      setCriteria([]);
    } finally {
      setCriteriaLoading(false);
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
            if (kids.length > 0) {
              sId = kids[0].student_details?.id || kids[0].student?.id || kids[0].student_id || kids[0].id;
            }
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

  const fetchMyTeachers = async () => {
    try {
      const token = await GetToken();
      // Get student ID first
      let studentId = null;
      let studentRes;

      if (isStudent) {
        studentRes = await fetch(`${Backend.api}${Backend.studentMe}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (isParent) {
        studentRes = await fetch(`${Backend.api}${Backend.parentChildren}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (studentRes?.ok) {
        const data = await studentRes.json();
        console.log('[TeacherRatings] Student/Children data:', data);
        if (isStudent) {
          studentId = data.data?.id || data.id;
        } else {
          const kids = data.data || data.results || [];
          console.log('[TeacherRatings] Children found:', kids.length, kids);
          setChildren(kids);
          if (kids.length > 0) {
            const firstChild = kids[0];
            setSelectedChild(firstChild);
            // Try multiple possible ID locations in the data structure
            studentId = firstChild.student_details?.id || firstChild.student?.id || firstChild.student_id || firstChild.id;
            console.log('[TeacherRatings] First child ID:', studentId, firstChild);
          }
        }
      }

      if (!studentId) {
        setTeachers([]);
        toast.warning('No student profile found');
        return;
      }

      // Fetch available teachers for this student
      const res = await fetch(`${Backend.api}${Backend.parentAvailableTeachers}${studentId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const list = data.data?.teachers || data.data || [];
        setTeachers(list);
      } else {
        setTeachers([]);
        toast.error('Failed to load your teachers');
      }
    } catch (error) {
      console.error('Error fetching my teachers:', error);
      setTeachers([]);
      toast.error('Failed to load your teachers');
    }
  };

  // Handle child selection for parents
  const handleChildSelect = async (child) => {
    setSelectedChild(child);
    const studentId = child.student_details?.id || child.student?.id || child.student_id || child.id;
    if (!studentId) {
      toast.error('Invalid student ID');
      return;
    }

    try {
      setLoading(true);
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.parentAvailableTeachers}${studentId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const list = data.data?.teachers || data.data || [];
        setTeachers(list);
      } else {
        setTeachers([]);
        toast.error('Failed to load teachers for selected child');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
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
    // Validate criteria exist
    if (criteria.length === 0) {
      toast.error('No criteria available. Please contact admin.');
      return;
    }

    // Validate all criteria have ratings - all 14 must be filled
    const unratedCriteria = criteria.filter(c => !multiRatings[c.code]);
    if (unratedCriteria.length > 0) {
      toast.error('Please fill all measurements');
      return;
    }

    // Build ratings array from multiRatings using criteria codes
    const ratingsArray = Object.entries(multiRatings)
      .filter(([catCode, value]) => value > 0) // Only include rated items
      .map(([catCode, value]) => ({
        teacher: selectedTeacher.teacher_id || selectedTeacher.id,
        rating: value,
        category: catCode,
        comment: comment || ""
      }));

    if (ratingsArray.length === 0) {
      toast.warning('Please select at least one rating');
      return;
    }

    setSubmitting(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.teacherRatingsSubmit}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher: selectedTeacher.teacher_id || selectedTeacher.id,
          ratings: ratingsArray
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Successfully submitted ${ratingsArray.length} ratings!`);
        setRatingDialog(false);
        setMultiRatings({});
        // Refresh teacher list and ratings history based on user role
        if (isStudent || isParent) {
          fetchMyTeachers();
          fetchMyRatingsHistory(); // Refresh ratings history
        } else {
          fetchTeachersList();
        }
      } else {
        toast.error(data.message || data.errors?.join(', ') || 'Submission failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Network error - please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const TeacherCard = ({ teacher }) => {
    // Find this student's personal rating for this teacher (not the average from all students)
    const myRatingForThisTeacher = myRatings.find(r =>
      r.teacher === teacher.id || r.teacher_id === teacher.id ||
      r.teacher === teacher.teacher_id || r.teacher_id === teacher.teacher_id
    );

    // Use student's personal rating, not the overall average
    const myRatingValue = myRatingForThisTeacher?.rating || 0;
    const hasRated = !!myRatingForThisTeacher;

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

            {/* Show STUDENT'S PERSONAL RATING only (not other students' reviews) */}
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h3" fontWeight={800} color={hasRated ? 'primary' : 'text.disabled'}>
                {hasRated ? myRatingValue.toFixed(1) : '--'}
              </Typography>
              <Box sx={{ textAlign: 'left' }}>
                <Rating value={myRatingValue} readOnly precision={0.5} size="small" />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {hasRated ? 'Your Rating' : 'Not Rated'}
                </Typography>
              </Box>
            </Stack>

            {/* Show criteria breakdown from student's personal rating only */}
            <Grid container spacing={1} sx={{ mb: 3 }}>
              {criteria.slice(0, 3).map(c => {
                // Get student's rating for this specific criteria from their personal rating
                const criteriaRatings = myRatingForThisTeacher?.criteria_ratings || {};
                const myCriteriaRating = criteriaRatings[c.code] || (myRatingForThisTeacher?.category === c.code ? myRatingValue : 0);
                const percentage = myCriteriaRating ? Math.round((myCriteriaRating / 5) * 100) : 0;
                return (
                  <Grid item xs={4} key={c.code}>
                    <Tooltip title={`${c.name}: ${hasRated ? percentage + '%' : 'Not rated'}`}>
                      <Box sx={{
                        p: 0.5,
                        borderRadius: 2,
                        bgcolor: hasRated ? 'primary.light' : 'action.hover',
                        color: hasRated ? 'white' : 'inherit'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>
                          {hasRated ? `${percentage}%` : '--'}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Grid>
                );
              })}
            </Grid>

            {canRateTeachers && isEvaluationPeriod && criteria.length > 0 && (
              <Button
                variant={teacher.has_rated ? "outlined" : "contained"}
                color={teacher.has_rated ? "success" : "primary"}
                fullWidth
                disabled={teacher.has_rated}
                onClick={() => {
                  if (!teacher.has_rated) {
                    setSelectedTeacher(teacher);
                    setRatingDialog(true);
                  }
                }}
                sx={{ borderRadius: 10, py: 1, fontWeight: 700 }}
                startIcon={teacher.has_rated ? <Verified /> : null}
              >
                {teacher.has_rated ? "Already Rated ✓" : "Rate Now"}
              </Button>
            )}
            {!isEvaluationPeriod && canRateTeachers && (
              <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
                {evaluationSettings.message || 'Evaluation period closed'}
              </Alert>
            )}
            {isEvaluationPeriod && criteria.length === 0 && canRateTeachers && (
              <Alert severity="warning" sx={{ mt: 2, fontSize: '0.75rem' }}>
                No criteria set by admin
              </Alert>
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

  const getPageTitle = () => {
    if (isAdmin) return 'Teacher Ratings - Admin View';
    if (isStudent) return 'My Teachers - Rate Your Instructors';
    if (isParent) return 'My Children\'s Teachers - Rate Instructors';
    if (isTeacher) return 'My Performance - Teacher View';
    return 'Teacher Ratings';
  };

  return (
    <PageContainer title={getPageTitle()}>
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

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Performance by Criteria (Admin Defined)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Each criteria is calculated as percentage out of 100%.
                    </Typography>
                    <Stack spacing={2}>
                      {criteriaLoading ? (
                        <CircularProgress size={20} />
                      ) : criteria.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No active criteria defined by admin.
                        </Typography>
                      ) : (
                        criteria.map(c => {
                          const ratingValue = myRatingData.rating_stats?.categories?.[c.code] || 0;
                          // Calculate percentage: (rating / 5) * 100
                          const percentage = Math.round((ratingValue / 5) * 100);
                          return (
                            <Box key={c.code}>
                              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {c.name} {c.weight !== 1 && `(Weight: ${c.weight})`}
                                </Typography>
                                <Typography variant="caption" fontWeight={700}>
                                  {percentage}% {ratingValue > 0 && `(${ratingValue}/5)`}
                                </Typography>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                  height: 8,
                                  borderRadius: 3,
                                  bgcolor: '#f0f0f0',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: percentage >= 80 ? 'success.main' :
                                      percentage >= 60 ? 'warning.main' : 'error.main'
                                  }
                                }}
                              />
                            </Box>
                          );
                        })
                      )}
                    </Stack>
                    {/* Overall Score Summary */}
                    {myRatingData.rating_stats?.overall_avg > 0 && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" fontWeight={700}>
                            Overall Performance Score
                          </Typography>
                          <Typography variant="h6" fontWeight={900} color="primary">
                            {Math.round((myRatingData.rating_stats.overall_avg / 5) * 100)}%
                          </Typography>
                        </Stack>
                      </Box>
                    )}
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
              <Typography variant="h2" fontWeight={900} sx={{ letterSpacing: -1 }}>
                {isAdmin ? 'Teacher Directory (Admin View)' : isStudent ? 'My Teachers' : 'My Children\'s Teachers'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isAdmin
                  ? 'View and evaluate all teachers in the system. End of term evaluation period.'
                  : isStudent
                    ? 'Rate your subject teachers based on your learning experience'
                    : 'Rate the teachers who instruct your children'}
              </Typography>
              {!isEvaluationPeriod && (
                <Alert severity="info" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
                  {evaluationSettings.message || 'Teacher evaluation is currently closed. Please check back during the end-of-term evaluation period.'}
                </Alert>
              )}

              {/* Child Selector for Parents */}
              {isParent && children.length > 0 && (
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Child:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {children.map((child) => {
                      const childName = child.student_details?.name || child.student_name || 'Child';
                      const isSelected = selectedChild?.id === child.id;
                      return (
                        <Chip
                          key={child.id}
                          label={childName}
                          onClick={() => handleChildSelect(child)}
                          color={isSelected ? 'primary' : 'default'}
                          variant={isSelected ? 'filled' : 'outlined'}
                          sx={{
                            cursor: 'pointer',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            px: 2
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

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

            {/* My Ratings History - Only for Students/Parents */}
            {(isStudent || isParent) && (
              <Box sx={{ mt: 6 }}>
                <Typography variant="h4" fontWeight={900} sx={{ mb: 3 }}>
                  📜 My Ratings History
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  All the ratings you have submitted for your teachers.
                </Typography>

                {myRatingsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : myRatings.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    You haven't submitted any ratings yet. Rate your teachers above!
                  </Alert>
                ) : (
                  <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.light' }}>
                          <TableCell sx={{ fontWeight: 700, color: 'white' }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white' }}>Teacher</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white' }}>Criteria</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white' }} align="center">Rating</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white' }}>Comment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {myRatings.map((rating, idx) => (
                          <TableRow key={rating.id} sx={{ bgcolor: idx % 2 === 0 ? 'white' : 'grey.50' }}>
                            <TableCell>
                              {new Date(rating.rating_date).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {rating.teacher_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {rating.teacher_code}
                              </Typography>
                            </TableCell>
                            <TableCell>{rating.category}</TableCell>
                            <TableCell align="center">
                              <Rating value={rating.rating} readOnly size="small" />
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                {rating.rating}/5
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                                {rating.comment || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </>
        )}

        <Dialog
          open={ratingDialog}
          onClose={() => setRatingDialog(false)}
          maxWidth="sm"
          fullWidth
          scroll="paper"
          PaperProps={{ sx: { borderRadius: 6, maxHeight: '90vh' } }}
        >
          <DialogTitle sx={{ pb: 0 }}>
            <Typography variant="h4" fontWeight={900} align="center">
              Rate Teacher Performance
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Rate {selectedTeacher?.full_name || selectedTeacher?.user_details?.full_name} across criteria
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 0.5, mb: 2 }}>
              Each rating out of 5 stars is calculated as percentage (out of 100%).
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4 }}>

            {criteriaLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : criteria.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No active criteria available for rating. Please contact admin.
              </Alert>
            ) : (
              <>
                <Box sx={{ mb: 2, px: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Progress: {Object.keys(multiRatings).filter(k => multiRatings[k] > 0).length} of {criteria.length} rated
                    </Typography>
                    <Typography variant="caption" color="primary" fontWeight={600}>
                      {Math.round((Object.keys(multiRatings).filter(k => multiRatings[k] > 0).length / criteria.length) * 100)}% complete
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(Object.keys(multiRatings).filter(k => multiRatings[k] > 0).length / criteria.length) * 100}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
                <Grid container spacing={2}>
                  {criteria.map(c => (
                    <Grid item xs={12} sm={6} key={c.code}>
                      <Paper sx={{
                        p: 2,
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: multiRatings[c.code] ? 'primary.main' : '#eee',
                        bgcolor: multiRatings[c.code] ? 'primary.light' : 'white',
                        color: multiRatings[c.code] ? 'white' : 'inherit',
                        transition: 'all 0.2s'
                      }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight={800}>{c.name}</Typography>
                          {multiRatings[c.code] ? (
                            <Typography variant="caption" fontWeight={900}>
                              {multiRatings[c.code]}/5 ({Math.round((multiRatings[c.code] / 5) * 100)}%)
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="error" fontWeight={600}>
                              Required *
                            </Typography>
                          )}
                        </Stack>
                        <Rating
                          value={multiRatings[c.code] || 0}
                          onChange={(_, v) => toggleCategoryRating(c.code, v)}
                          sx={{ color: multiRatings[c.code] ? 'white' : 'primary.main' }}
                        />
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                          {c.description}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            <TextField
              sx={{ mt: 4 }}
              label="Share a specific comment"
              multiline rows={2} fullWidth
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="What makes this teacher unique?"
              variant="outlined"
            />
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 3 }}>
            <Button onClick={() => setRatingDialog(false)} sx={{ borderRadius: 10 }} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || criteriaLoading || criteria.length === 0 || Object.keys(multiRatings).length === 0}
              sx={{ borderRadius: 10, py: 1.5, fontWeight: 900 }}
            >
              {submitting ? 'Submitting...' : `Submit Reviews (${Object.keys(multiRatings).length}/${criteria.length})`}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PageContainer>
  );
}
