import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  Button,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Skeleton
} from '@mui/material';
import {
  IconChartBar,
  IconUsers,
  IconSchool,
  IconTrendingUp,
  IconMessage,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconDownload,
  IconStar
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const AIAnalyticsDashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      console.log('Token:', token ? 'Found' : 'Missing');
      console.log('Backend URL:', Backend.baseUrl);

      const url = `${Backend.baseUrl}/api/ai/admin/dashboard/`;
      console.log('Fetching from:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Result:', result);

      if (result.success) {
        // Transform grade data if needed
        const transformedData = { ...result.data };

        // Combine grade data from multiple sources
        const graphGradeData = result.data?.graphs?.students_by_grade || [];
        const studentGradeData = result.data?.students?.grade_distribution || [];

        // Use whichever has data, preferring graph data
        let combinedGradeData = graphGradeData;
        if (graphGradeData.length === 0 && studentGradeData.length > 0) {
          // Transform student grade distribution to match expected format
          combinedGradeData = studentGradeData.map(g => ({
            grade__name: g.grade__name || `Grade ${g.grade__grade || g.grade}`,
            grade__grade: g.grade__grade || g.grade,
            students: g.count || g.students
          }));
        }

        transformedData.graphs = {
          ...transformedData.graphs,
          students_by_grade: combinedGradeData
        };

        setData(transformedData);
        setLastUpdated(new Date());
        console.log('[Dashboard] Data loaded:', transformedData);
        console.log('[Dashboard] Students by grade:', combinedGradeData);
      } else {
        toast.warning(result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load dashboard data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <DrogaCard>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div">
              {loading ? <Skeleton width={60} /> : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color + '20',
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon size={28} color={color} />
          </Box>
        </Box>
      </CardContent>
    </DrogaCard>
  );

  return (
    <PageContainer title="School Analytics Dashboard" description="Comprehensive School Management Overview">
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h2" component="h1">
            <IconSchool size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            School Analytics Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {lastUpdated && (
              <Typography variant="caption" color="textSecondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
            <Button
              variant="outlined"
              startIcon={<IconRefresh />}
              onClick={fetchDashboardData}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="textSecondary">
          Real-time insights into students, teachers, attendance, and school operations
        </Typography>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={data?.overview?.total_users}
            icon={IconUsers}
            color={theme.palette.primary.main}
            subtitle={`+${data?.overview?.new_this_month || 0} this month`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Students"
            value={data?.overview?.total_students}
            icon={IconSchool}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Teachers"
            value={data?.overview?.total_teachers}
            icon={IconUsers}
            color={theme.palette.warning.main}
            subtitle={`Avg Rating: ${data?.teachers?.average_rating || 0}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Today"
            value={data?.overview?.active_today}
            icon={IconTrendingUp}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* Charts Section - Professional SVG Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <DrogaCard title="User Growth Trend (12 Months)">
            <CardContent>
              {loading ? (
                <Skeleton variant="rectangular" height={280} />
              ) : data?.graphs?.user_growth?.data?.length > 0 ? (
                <Box sx={{ height: 280, position: 'relative' }}>
                  <svg width="100%" height="240" viewBox="0 0 500 240" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="userGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const maxVal = Math.max(...data.graphs.user_growth.data) || 1;
                      const points = data.graphs.user_growth.data.map((count, idx) => {
                        const x = (idx / (data.graphs.user_growth.data.length - 1)) * 480 + 10;
                        const y = 220 - ((count / maxVal) * 180);
                        return `${x},${y}`;
                      }).join(' ');
                      const areaPoints = `10,220 ${points} 490,220`;
                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#userGradient)" />
                          <polyline points={points} fill="none" stroke={theme.palette.primary.main} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {data.graphs.user_growth.data.map((count, idx) => {
                            const x = (idx / (data.graphs.user_growth.data.length - 1)) * 480 + 10;
                            const y = 220 - ((count / maxVal) * 180);
                            return (
                              <g key={idx}>
                                <circle cx={x} cy={y} r="5" fill={theme.palette.primary.main} stroke="white" strokeWidth="2" />
                                <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fill={theme.palette.text.primary}>{count}</text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, mt: 1 }}>
                    {data.graphs.user_growth.labels.map((label, idx) => (
                      <Typography key={idx} variant="caption" sx={{ fontSize: '9px', textAlign: 'center', flex: 1 }}>
                        {label}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
                  <IconTrendingUp size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <Typography variant="body1">No user growth data yet</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Data will appear as users join the system
                  </Typography>
                </Box>
              )}
            </CardContent>
          </DrogaCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <DrogaCard title="Daily Active Users (7 Days)">
            <CardContent>
              {loading ? (
                <Skeleton variant="rectangular" height={280} />
              ) : data?.graphs?.daily_active_users?.data?.length > 0 ? (
                <Box sx={{ height: 280, position: 'relative' }}>
                  <svg width="100%" height="240" viewBox="0 0 500 240">
                    <defs>
                      <linearGradient id="activeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const maxVal = Math.max(...data.graphs.daily_active_users.data) || 1;
                      const barWidth = 60;
                      const gap = 10;
                      return data.graphs.daily_active_users.data.map((count, idx) => {
                        const x = idx * (barWidth + gap) + 20;
                        const height = (count / maxVal) * 180;
                        const y = 220 - height;
                        return (
                          <g key={idx}>
                            <rect x={x} y={y} width={barWidth} height={height} fill="url(#activeGradient)" rx="8" />
                            <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="bold" fill={theme.palette.text.primary}>{count}</text>
                            <text x={x + barWidth / 2} y={235} textAnchor="middle" fontSize="10" fill={theme.palette.text.secondary}>{data.graphs.daily_active_users.labels[idx]}</text>
                          </g>
                        );
                      });
                    })()}
                  </svg>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
                  <IconUsers size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <Typography variant="body1">No active user data yet</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Activity data will appear when users log in
                  </Typography>
                </Box>
              )}
            </CardContent>
          </DrogaCard>
        </Grid>
      </Grid>

      {/* Circular Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <DrogaCard title={`Students by Grade (${data?.overview?.total_students || 0} total)`}>
            <CardContent>
              {loading ? (
                <Skeleton variant="rectangular" height={280} />
              ) : data?.graphs?.students_by_grade && data.graphs.students_by_grade.length > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                  {/* Circular Donut Chart */}
                  <svg width="240" height="240" viewBox="0 0 240 240">
                    {(() => {
                      const total = data.graphs.students_by_grade.reduce((sum, g) => sum + g.students, 0);
                      let currentAngle = 0;
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

                      return data.graphs.students_by_grade.map((item, idx) => {
                        const percentage = item.students / total;
                        const angle = percentage * 360;
                        const startAngle = currentAngle;
                        currentAngle += angle;
                        const endAngle = currentAngle;

                        // Convert angles to radians and calculate path
                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;
                        const x1 = 120 + 80 * Math.cos(startRad);
                        const y1 = 120 + 80 * Math.sin(startRad);
                        const x2 = 120 + 80 * Math.cos(endRad);
                        const y2 = 120 + 80 * Math.sin(endRad);
                        const x3 = 120 + 50 * Math.cos(endRad);
                        const y3 = 120 + 50 * Math.sin(endRad);
                        const x4 = 120 + 50 * Math.cos(startRad);
                        const y4 = 120 + 50 * Math.sin(startRad);

                        const largeArc = angle > 180 ? 1 : 0;
                        const path = `M ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A 50 50 0 ${largeArc} 0 ${x4} ${y4} Z`;
                        const color = colors[idx % colors.length];

                        return (
                          <g key={idx}>
                            <path d={path} fill={color} stroke="white" strokeWidth="2" />
                            {/* Label */}
                            <text
                              x={120 + 95 * Math.cos((startAngle + angle / 2 - 90) * Math.PI / 180)}
                              y={120 + 95 * Math.sin((startAngle + angle / 2 - 90) * Math.PI / 180)}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="bold"
                              fill={color}
                            >
                              {Math.round(percentage * 100)}%
                            </text>
                          </g>
                        );
                      });
                    })()}
                    {/* Center text */}
                    <text x="120" y="115" textAnchor="middle" fontSize="14" fontWeight="bold" fill={theme.palette.text.primary}>
                      {data.overview?.total_students || 0}
                    </text>
                    <text x="120" y="135" textAnchor="middle" fontSize="10" fill={theme.palette.text.secondary}>
                      Students
                    </text>
                  </svg>
                  {/* Legend */}
                  <Box sx={{ ml: 3 }}>
                    {data.graphs.students_by_grade.map((item, idx) => {
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                      return (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ width: 12, height: 12, bgcolor: colors[idx % colors.length], borderRadius: '50%', mr: 1 }} />
                          <Typography variant="caption">
                            {item.grade__name || `Grade ${item.grade__grade}`} ({item.students})
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <IconSchool size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <Typography variant="body1">No students enrolled yet</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Add students to see grade distribution
                  </Typography>
                </Box>
              )}
            </CardContent>
          </DrogaCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <DrogaCard title="💬 Chat Activity by Class">
            <CardContent>
              {loading ? (
                <Skeleton variant="rectangular" height={280} />
              ) : data?.communications?.chat_by_class && data.communications.chat_by_class.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  {/* Top Class Badge */}
                  <Box sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: 1.5,
                    borderRadius: 2,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>Most Active Class</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {data.communications.chat_by_class[0]?.grade__grade || 'Grade 1'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {data.communications.chat_by_class[0]?.count || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>messages</Typography>
                    </Box>
                  </Box>

                  {/* Chat Count by Class */}
                  {data.communications.chat_by_class.map((item, idx) => {
                    const maxVal = Math.max(...data.communications.chat_by_class.map(c => c.count)) || 1;
                    const width = (item.count / maxVal) * 100;
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    const color = colors[idx % colors.length];
                    return (
                      <Box key={idx}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {idx === 0 && '🏆 '}{item.grade__grade || `Class ${idx + 1}`}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: color }}>
                            {item.count} msgs
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 20,
                            width: '100%',
                            background: theme.palette.grey[100],
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: width + '%',
                              background: color,
                              borderRadius: 2,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <IconMessage size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <Typography variant="body1">No chat data yet</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Students haven't started chatting yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </DrogaCard>
        </Grid>
      </Grid>

      {/* Detailed Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <DrogaCard title="System Overview">
            <CardContent>
              {loading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : data?.overview ? (
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Total Schools"
                      secondary={data.overview.total_schools || 1}
                    />
                    <IconSchool size={20} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Parents Registered"
                      secondary={data.overview.total_parents || 0}
                    />
                    <IconUsers size={20} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="New This Month"
                      secondary={`+${data.overview.new_this_month || 0} users`}
                    />
                    <Chip
                      label="Active"
                      size="small"
                      color="success"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Active Sessions"
                      secondary={data.overview.active_today || 0}
                    />
                    <IconTrendingUp size={20} color="#10b981" />
                  </ListItem>
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body2">System data loading...</Typography>
                </Box>
              )}
            </CardContent>
          </DrogaCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <DrogaCard title="📢 Communication Hub">
            <CardContent>
              {loading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : data?.communications ? (
                <Box>
                  {/* Announcements */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1.5, bgcolor: 'info.50', borderRadius: 2 }}>
                    <Box sx={{
                      bgcolor: 'info.main',
                      color: 'white',
                      p: 1,
                      borderRadius: '50%',
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconMessage size={20} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="textSecondary">Announcements</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                        {data.communications.total_announcements || 0}
                      </Typography>
                    </Box>
                    <Chip
                      label={`+${data.communications.announcements_this_month || 0} this month`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </Box>

                  {/* Messages */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1.5, bgcolor: 'success.50', borderRadius: 2 }}>
                    <Box sx={{
                      bgcolor: 'success.main',
                      color: 'white',
                      p: 1,
                      borderRadius: '50%',
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconUsers size={20} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="textSecondary">Total Messages</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {data.communications.messages_last_30d || 0}
                      </Typography>
                    </Box>
                    <Chip label="30 days" size="small" color="success" variant="outlined" />
                  </Box>

                  {/* Feedback */}
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: 'warning.50', borderRadius: 2 }}>
                    <Box sx={{
                      bgcolor: 'warning.main',
                      color: 'white',
                      p: 1,
                      borderRadius: '50%',
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconStar size={20} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="textSecondary">Parent Feedback</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        {data.communications.feedback_count || 0}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<IconStar size={14} />}
                      label={`${data.communications.average_feedback_rating?.toFixed(1) || 0}/5`}
                      size="small"
                      color="warning"
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <IconMessage size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <Typography variant="body2">No communication data</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Create announcements to see stats
                  </Typography>
                </Box>
              )}
            </CardContent>
          </DrogaCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <DrogaCard title="Engagement Metrics">
            <CardContent>
              {loading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : data?.engagement ? (
                <>
                  <Box mb={2}>
                    <Typography variant="subtitle2">Attendance Rate</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography variant="h4" mr={1}>
                        {data.engagement.attendance_rate || 0}%
                      </Typography>
                      {(data.engagement.attendance_rate || 0) > 80 ? (
                        <IconCheck color="green" size={20} />
                      ) : (
                        <IconAlertCircle color="orange" size={20} />
                      )}
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Tasks Overview:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    <Chip
                      label={`Done: ${data.engagement.tasks?.completed || 0}`}
                      color="success"
                      size="small"
                    />
                    <Chip
                      label={`Pending: ${data.engagement.tasks?.pending || 0}`}
                      color="warning"
                      size="small"
                    />
                    <Chip
                      label={`Expired: ${data.engagement.tasks?.expired || 0}`}
                      color="error"
                      size="small"
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Blog Posts:</Typography>
                  <Typography variant="body2">
                    {data.engagement.blogs?.published || 0} published / {data.engagement.blogs?.draft || 0} draft
                  </Typography>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <IconChartBar size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <Typography variant="body2">No engagement data</Typography>
                  <Typography variant="caption" display="block">
                    Start using the system to see metrics
                  </Typography>
                </Box>
              )}
            </CardContent>
          </DrogaCard>
        </Grid>
      </Grid>
      {/* Future Improvements Section */}
      <DrogaCard title="🚀 Future Improvements" sx={{ mt: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Recommended enhancements based on current system usage:
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📊 Advanced Analytics
                </Typography>
                <Typography variant="caption" display="block">
                  • Student performance trends by grade<br />
                  • Teacher workload distribution<br />
                  • Parent engagement metrics<br />
                  • Attendance pattern analysis
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🔔 Smart Notifications
                </Typography>
                <Typography variant="caption" display="block">
                  • Low attendance alerts<br />
                  • Task deadline reminders<br />
                  • New enrollment notifications<br />
                  • Grade performance warnings
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📱 Mobile Features
                </Typography>
                <Typography variant="caption" display="block">
                  • Parent mobile app dashboard<br />
                  • Teacher quick stats widget<br />
                  • Push notifications<br />
                  • Offline data sync
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </DrogaCard>
    </PageContainer>
  );
};

export default AIAnalyticsDashboard;
