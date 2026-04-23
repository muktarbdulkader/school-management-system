import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import PropTypes from 'prop-types';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="11"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const GRADE_COLORS = {
  A: '#4285F4',
  B: '#34A853',
  C: '#FBBC04',
  D: '#EA4335',
  F: '#9AA0A6',
};

function calculateGradeDistribution(assessments, studentsCount) {
  if (!assessments || assessments.length === 0 || studentsCount === 0) {
    return [];
  }

  const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let totalStudents = 0;

  assessments.forEach(assessment => {
    if (assessment.submitted && assessment.average_score !== null) {
      const avg = (assessment.average_score / assessment.max_score) * 100;
      totalStudents += assessment.submitted;

      assessment.submitted_students?.forEach(student => {
        const score = (student.score / assessment.max_score) * 100;
        if (score >= 90) gradeCounts.A++;
        else if (score >= 80) gradeCounts.B++;
        else if (score >= 70) gradeCounts.C++;
        else if (score >= 60) gradeCounts.D++;
        else gradeCounts.F++;
      });
    }
  });

  if (totalStudents === 0) {
    return [];
  }

  return Object.entries(gradeCounts)
    .filter(([, count]) => count > 0)
    .map(([grade, count]) => ({
      name: grade,
      value: count,
      color: GRADE_COLORS[grade],
    }));
}

function calculateScoreStats(assessments) {
  if (!assessments || assessments.length === 0) {
    return { highest: 0, lowest: 0, average: 0 };
  }

  let highest = 0;
  let lowest = 100;
  let totalAverage = 0;
  let count = 0;

  assessments.forEach(assessment => {
    if (assessment.average_score !== null) {
      const avg = (assessment.average_score / assessment.max_score) * 100;
      highest = Math.max(highest, avg);
      lowest = Math.min(lowest, avg);
      totalAverage += avg;
      count++;
    }
  });

  return {
    highest: count > 0 ? highest.toFixed(0) : 0,
    lowest: count > 0 ? lowest.toFixed(0) : 0,
    average: count > 0 ? (totalAverage / count).toFixed(0) : 0,
  };
}

function calculateTopicCoverage(assessments) {
  if (!assessments || assessments.length === 0) {
    return [];
  }

  return assessments.slice(0, 5).map(assessment => ({
    name: assessment.name.length > 15 ? assessment.name.substring(0, 15) + '...' : assessment.name,
    coverage: assessment.submitted && assessment.total_students
      ? Math.round((assessment.submitted / assessment.total_students) * 100)
      : 0,
  }));
}

export default function PerformanceDashboard({
  assessments = [],
  studentsCount = 0,
  assessmentsSummary = null
}) {
  const gradeDistribution = calculateGradeDistribution(assessments, studentsCount);
  const scoreStats = calculateScoreStats(assessments);
  const topicCoverage = calculateTopicCoverage(assessments);

  const totalStudents = gradeDistribution.reduce((sum, g) => sum + g.value, 0);
  const overallProgress = assessmentsSummary?.overall_progress ||
    (assessments.length > 0
      ? Math.round((assessments.filter(a => a.status === 'completed').length / assessments.length) * 100)
      : 0);

  const hasData = assessments.length > 0 && totalStudents > 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Performance Overview
        </Typography>
        {hasData && (
          <Chip
            label={`${assessments.length} Assessment${assessments.length !== 1 ? 's' : ''}`}
            sx={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          />
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Grade Distribution Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              background: hasData
                ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
              color: 'white',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Grade Distribution
              </Typography>

              {hasData ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ width: 200, height: 200, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gradeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={80}
                            innerRadius={45}
                            dataKey="value"
                          >
                            {gradeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                          }}
                        >
                          {totalStudents}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '12px',
                            opacity: 0.8,
                          }}
                        >
                          Students
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ ml: 3 }}>
                      {gradeDistribution.map((grade) => (
                        <Box
                          key={grade.name}
                          sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}
                        >
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '4px',
                              backgroundColor: grade.color,
                              mr: 1.5,
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {grade.name}: {grade.value} students
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mt: 3,
                      pt: 2,
                      borderTop: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Highest Score
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {scoreStats.highest}%
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Average
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {scoreStats.average}%
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Lowest Score
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {scoreStats.lowest}%
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                    No assessment data available
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Create assessments to see grade distribution
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Topic Coverage Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: '20px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'white',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}
              >
                Assessment Submission Rates
              </Typography>

              {topicCoverage.length > 0 ? (
                <>
                  <Box sx={{ height: 250, mb: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topicCoverage}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          angle={-15}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [`${value}%`, 'Submission Rate']}
                        />
                        <Bar
                          dataKey="coverage"
                          fill="url(#colorGradient)"
                          radius={[6, 6, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pt: 2,
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          mr: 1.5,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        % of students submitted
                      </Typography>
                    </Box>
                    <Chip
                      label={`Overall progress: ${overallProgress}%`}
                      sx={{
                        backgroundColor: overallProgress >= 70 ? '#dcfce7' : overallProgress >= 50 ? '#fef3c7' : '#fee2e2',
                        color: overallProgress >= 70 ? '#166534' : overallProgress >= 50 ? '#92400e' : '#991b1b',
                        fontWeight: 600,
                        borderRadius: '8px',
                      }}
                    />
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
                    No submission data available
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Student submissions will appear here
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

PerformanceDashboard.propTypes = {
  assessments: PropTypes.array,
  studentsCount: PropTypes.number,
  assessmentsSummary: PropTypes.object,
};
