import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/system';

// Sample data - replace with your actual data
const attendanceData = [
  {
    day: 'Monday',
    averageAttendance: 75,
    students: [
      { name: 'Student 1', attended: true },
      { name: 'Student 2', attended: true },
      { name: 'Student 3', attended: false },
      { name: 'Student 4', attended: true },
      { name: 'Student 5', attended: false },
    ],
  },
  {
    day: 'Tuesday',
    averageAttendance: 90,
    students: [
      { name: 'Student 1', attended: true },
      { name: 'Student 2', attended: true },
      { name: 'Student 3', attended: true },
      { name: 'Student 4', attended: false },
      { name: 'Student 5', attended: true },
    ],
  },
  {
    day: 'Wednesday',
    averageAttendance: 60,
    students: [
      { name: 'Student 1', attended: true },
      { name: 'Student 2', attended: false },
      { name: 'Student 3', attended: false },
      { name: 'Student 4', attended: true },
      { name: 'Student 5', attended: false },
    ],
  },
  {
    day: 'Thursday',
    averageAttendance: 85,
    students: [
      { name: 'Student 1', attended: true },
      { name: 'Student 2', attended: true },
      { name: 'Student 3', attended: false },
      { name: 'Student 4', attended: true },
      { name: 'Student 5', attended: true },
    ],
  },
  {
    day: 'Friday',
    averageAttendance: 70,
    students: [
      { name: 'Student 1', attended: true },
      { name: 'Student 2', attended: false },
      { name: 'Student 3', attended: true },
      { name: 'Student 4', attended: true },
      { name: 'Student 5', attended: false },
    ],
  },
  {
    day: 'Saturday',
    averageAttendance: 50,
    students: [
      { name: 'Student 1', attended: true },
      { name: 'Student 2', attended: false },
      { name: 'Student 3', attended: false },
      { name: 'Student 4', attended: true },
      { name: 'Student 5', attended: false },
    ],
  },
  {
    day: 'Sunday',
    averageAttendance: 40,
    students: [
      { name: 'Student 1', attended: false },
      { name: 'Student 2', attended: false },
      { name: 'Student 3', attended: true },
      { name: 'Student 4', attended: true },
      { name: 'Student 5', attended: false },
    ],
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dayData = attendanceData.find((item) => item.day === label);

    return (
      <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="subtitle1" gutterBottom>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Average Attendance: {payload[0].value}%
        </Typography>
        <Box mt={1}>
          <Typography variant="caption" component="div">
            <strong>Student Attendance:</strong>
          </Typography>
          {dayData.students.map((student, index) => (
            <Typography
              key={index}
              variant="caption"
              component="div"
              color={student.attended ? 'success.main' : 'error.main'}
            >
              {student.name}: {student.attended ? 'Present' : 'Absent'}
            </Typography>
          ))}
        </Box>
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h3" gutterBottom>
          Daily Student Attendance
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'rgba(33, 44, 196, 0.3)',
            backdropFilter: 'blur(10px)',
            color: 'black',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            borderRadius: 3,
            px: 3,
            py: 1,

            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(33, 44, 196, 0.3)',
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
      <Paper elevation={3} sx={{ p: 3, width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={attendanceData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis
              label={{
                value: 'Attendance %',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="averageAttendance"
              name="Average Attendance"
              stroke="#1976d2"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Container>
  );
};

export default AttendanceChart;
