import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Stack,
  Card,
  Grid,
  TablePagination,
  Paper,
  useTheme,
  Link,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const getStatusColor = (status) => {
  if (!status) return 'default';
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'present':
      return 'success';
    case 'absent':
      return 'error';
    case 'late':
      return 'warning';
    case 'with_permission':
      return 'info';
    case 'not_marked':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusLabel = (status) => {
  const statusMap = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    with_permission: 'With Permission',
    not_marked: 'Not Marked',
  };
  return statusMap[status] || status;
};

const StudentList = ({ students, classId, sectionId, studentStats, sx }) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();
  // Transform student data to consistent format
  const transformedStudents =
    students?.map((student) => ({
      id: student.id,
      name: student.name || 'Unknown Student',
      studentId: student.student_id || student.student_code || student.studentId || 'N/A',
      status: student.attendance_status || 'not_marked',
      behavior: student.behavior_rating || null,
      average: student.attendance_percentage || student.average || 0,
      avatar: student.avatar || '/static/images/avatars/default-avatar.png',
    })) || [];

  // Use the stats from backend instead of calculating from students array
  const statusCounts = studentStats
    ? {
        present: studentStats.present || 0,
        absent: studentStats.absent || 0,
        late: studentStats.late || 0,
        with_permission: studentStats.with_permission || 0,
        not_marked: studentStats.not_marked || 0,
      }
    : {};

  // Filter students based on search term
  const filteredStudents = transformedStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination
  const paginatedStudents = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={sx}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h3" fontWeight={600}>
          Students
        </Typography>
        <Link
          href="#"
          underline="none"
          color="primary"
          sx={{ fontWeight: 500 }}
        >
          View Full Attendance →
        </Link>
      </Box>
      <Card elevation={3}>
        <Box sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <TextField
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />

            <Stack direction="row" spacing={2}>
              {Object.entries(statusCounts).map(([status, count]) => (
                <Chip
                  key={status}
                  label={`${getStatusLabel(status)} (${count})`}
                  color={getStatusColor(status)}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Behavior</TableCell>
                  <TableCell>Average</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar src={student.avatar} />
                          <Box>
                            <Typography fontWeight={500}>
                              {student.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              ID: {student.studentId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(student.status)}
                          color={getStatusColor(student.status)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {student.behavior ? (
                          <Chip
                            label={student.behavior}
                            color="default"
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        ) : (
                          <Typography color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography
                          fontWeight={600}
                          color={
                            student.average >= 90
                              ? 'success.main'
                              : student.average >= 80
                                ? 'warning.main'
                                : 'error.main'
                          }
                        >
                          {student.average}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ textTransform: 'none' }}
                          onClick={() => navigate(`/child-profile/${student.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        {transformedStudents.length === 0
                          ? 'No students found in this class'
                          : 'No matching students found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredStudents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Box>
      </Card>
    </Box>
  );
};

export default StudentList;
