import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { Paper, Typography, Box, Button, Chip, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/system';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

const CustomTooltip = ({ active, payload, label, attendanceRecords }) => {
  if (active && payload && payload.length) {
    const dayData = attendanceRecords.find((item) => item.day === label);
    const avgAttendance = payload[0].value;

    return (
      <Paper
        elevation={3}
        sx={{
          p: 2.5,
          minWidth: 220,
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
          {label}
        </Typography>
        <Box sx={{ mb: 1.5, p: 1, bgcolor: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600 }}>
            Average Attendance: {avgAttendance}%
          </Typography>
        </Box>
        {dayData?.students && dayData.students.length > 0 && (
          <Box>
            <Typography variant="caption" component="div" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
              Student Attendance:
            </Typography>
            <Box sx={{ maxHeight: 120, overflow: 'auto' }}>
              {dayData.students.slice(0, 10).map((student, index) => (
                <Typography
                  key={index}
                  variant="caption"
                  component="div"
                  sx={{
                    color: student.status === 'present' ? '#22c55e' :
                      student.status === 'late' ? '#f59e0b' : '#ef4444',
                    fontWeight: 500,
                    py: 0.3,
                  }}
                >
                  {student.name}: {student.status === 'present' ? 'Present' :
                    student.status === 'late' ? 'Late' : 'Absent'}
                </Typography>
              ))}
              {dayData.students.length > 10 && (
                <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  +{dayData.students.length - 10} more students
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    );
  }

  return null;
};

const AttendanceChart = ({
  studentsData,
  classData,
  headerData,
  subjectId,
}) => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRate, setAverageRate] = useState(0);

  useEffect(() => {
    fetchAttendanceData();
  }, [classData, subjectId]);

  const fetchAttendanceData = async () => {
    if (!classData?.class_id || !classData?.section_id || !subjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await GetToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Get last 7 days of attendance
      const endDate = new Date();
      const startDate = subDays(endDate, 6);

      // Use the attendance endpoint with date range filters
      const url = `${Backend.auth}${Backend.attendance}?class_id=${classData.class_id}&section_id=${classData.section_id}&subject_id=${subjectId}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`;

      const response = await fetch(url, { method: 'GET', headers });
      const data = await response.json();

      if (data.success && data.data) {
        const processedData = processAttendanceData(data.data, studentsData);
        setAttendanceRecords(processedData);

        // Calculate overall average
        const totalAvg = processedData.reduce((sum, day) => sum + day.averageAttendance, 0);
        setAverageRate(processedData.length > 0 ? Math.round(totalAvg / processedData.length) : 0);
      } else {
        // Generate empty week data if no records
        generateEmptyWeekData();
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      generateEmptyWeekData();
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyWeekData = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });

    const emptyData = days.map((day, index) => {
      const date = addDays(weekStart, index);
      return {
        day: day,
        date: format(date, 'yyyy-MM-dd'),
        averageAttendance: 0,
        students: [],
        isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      };
    });

    setAttendanceRecords(emptyData);
    setAverageRate(0);
  };

  const processAttendanceData = (attendanceData, students) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });

    // Initialize week data structure
    const weekData = days.map((day, index) => {
      const date = addDays(weekStart, index);
      return {
        day: day,
        date: format(date, 'yyyy-MM-dd'),
        averageAttendance: 0,
        students: [],
        isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      };
    });

    // Group attendance by day
    if (Array.isArray(attendanceData)) {
      attendanceData.forEach(record => {
        const recordDate = new Date(record.date);
        const dayIndex = recordDate.getDay();
        // Adjust for Monday start (0 = Monday in our array)
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;

        if (adjustedIndex >= 0 && adjustedIndex < 7) {
          // Get student name from student_details or find in students list
          let studentName = 'Unknown Student';
          if (record.student_details?.user?.full_name) {
            studentName = record.student_details.user.full_name;
          } else if (record.student_details?.name) {
            studentName = record.student_details.name;
          } else if (record.student_id) {
            const foundStudent = students.find(s => s.id === record.student_id);
            studentName = foundStudent?.name || `Student ${record.student_id}`;
          }

          weekData[adjustedIndex].students.push({
            name: studentName,
            status: record.status?.toLowerCase() || 'unknown',
          });
        }
      });
    }

    // Calculate average attendance for each day
    const totalStudents = students?.length || 1; // Avoid division by zero
    weekData.forEach(day => {
      if (day.students.length > 0) {
        const presentCount = day.students.filter(s => s.status === 'present').length;
        const lateCount = day.students.filter(s => s.status === 'late').length;
        // Count late as 0.5 present, calculate based on total students in class
        day.averageAttendance = Math.round(((presentCount + (lateCount * 0.5)) / totalStudents) * 100);
      } else {
        // If no attendance records for this day, it's 0% attendance
        day.averageAttendance = 0;
      }
    });

    return weekData;
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 80) return '#22c55e';
    if (rate >= 60) return '#3b82f6';
    if (rate >= 40) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rounded" width={150} height={40} />
        </Box>
        <Skeleton variant="rounded" height={400} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
            Daily Student Attendance
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Weekly Average:
            </Typography>
            <Chip
              size="small"
              label={`${averageRate}%`}
              sx={{
                backgroundColor: `${getAttendanceColor(averageRate)}20`,
                color: getAttendanceColor(averageRate),
                fontWeight: 600,
                borderRadius: '6px',
              }}
            />
          </Box>
        </Box>
        <Button
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: 'white',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            borderRadius: '12px',
            px: 3,
            py: 1,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)',
            },
          }}
          onClick={() =>
            navigate('/classes/AttendanceMark', {
              state: {
                students: studentsData,
                className: classData?.name,
                sectionName: headerData?.section_name,
                subjectId: subjectId,
                classId: classData.class_id,
                sectionId: classData.section_id,
              },
            })
          }
        >
          Mark Today's Attendance
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          width: '100%',
          height: 400,
          borderRadius: '20px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          background: 'white',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={attendanceRecords}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              domain={[0, 100]}
              label={{
                value: 'Attendance %',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#64748b', fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip attendanceRecords={attendanceRecords} />} />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="averageAttendance"
              name="Average Attendance"
              fill="url(#attendanceGradient)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="averageAttendance"
              name="Average Attendance"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: '#fff' }}
              activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 3, fill: '#fff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>
    </Container>
  );
};

export default AttendanceChart;
