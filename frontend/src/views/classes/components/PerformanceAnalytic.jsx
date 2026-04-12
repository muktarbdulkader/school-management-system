import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Link,
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
} from 'recharts';

const gradeData = [
  { name: 'A', value: 8, color: '#4285F4' },
  { name: 'B', value: 15, color: '#34A853' },
  { name: 'C', value: 12, color: '#FBBC04' },
  { name: 'D', value: 5, color: '#EA4335' },
  { name: 'F', value: 2, color: '#9AA0A6' },
];

const topicData = [
  { name: 'Quadratic eq.', coverage: 100 },
  { name: 'Derivative', coverage: 85 },
  { name: 'Addition', coverage: 55 },
  { name: 'Subtraction', coverage: 30 },
  { name: 'Division', coverage: 25 },
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
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
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PerformanceDashboard() {
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
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Performance Overview
        </Typography>
        <Link
          href="#"
          sx={{
            color: '#4285F4',
            textDecoration: 'none',
            fontSize: '14px',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          View Detailed Analytics →
        </Link>
      </Box>

      <Grid container spacing={3}>
        {/* Grade Distribution Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Grade Distribution
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ width: 200, height: 200, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gradeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {gradeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <Typography
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '24px',
                      fontWeight: 'bold',
                    }}
                  >
                    42
                  </Typography>
                </Box>

                <Box sx={{ ml: 3 }}>
                  {gradeData.map((grade) => (
                    <Box
                      key={grade.name}
                      sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: grade.color,
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2">
                        {grade.name}: {grade.value} students
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}
              >
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Highest Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    95%
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Lowest Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    45%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Topic Coverage Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ mb: 3, fontWeight: 600, color: '#1a1a1a' }}
              >
                Topic Coverage
              </Typography>

              <Box sx={{ height: 250, mb: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topicData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                      domain={[0, 100]}
                    />
                    <Bar
                      dataKey="coverage"
                      fill="#4285F4"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#4285F4',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    % of curriculum covered
                  </Typography>
                </Box>
                <Chip
                  label="Overall progress: 70%"
                  sx={{
                    backgroundColor: '#f5f5f5',
                    color: '#1a1a1a',
                    fontWeight: 600,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
