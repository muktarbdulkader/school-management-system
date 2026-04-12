import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Typography,
  Box,
  Grid,
  TablePagination,
  LinearProgress,
  Stack,
  useTheme,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { toast, ToastContainer } from 'react-toastify';
import { DotMenu } from 'ui-component/menu/DotMenu';
import AddButton from 'ui-component/buttons/AddButton';
import { useNavigate } from 'react-router-dom';

const getCategoryColor = (category) => {
  switch (category) {
    case 'Disruptive':
      return 'error';
    case 'Support Needed':
      return 'info';
    case 'Medical':
      return 'secondary';
    default:
      return 'default';
  }
};

const getSeverityPercentage = (severity) => {
  return severity * 25; // Convert 1-4 scale to 25-100%
};

export default function BehaviorWellbeingTable({ behaviorNotesData = [] }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 5,
  });

  const transformedData = behaviorNotesData.map((note, index) => ({
    id: index + 1,
    date: note.date,
    student: note.student_name,
    studentId: note.student_id || 0,
    category: note.category,
    note: note.note,
    severity: note.rating || 1,
    is_urgent: note.is_urgent || false,
  }));

  const filteredData = transformedData.filter(
    (record) =>
      record.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.note.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedData = filteredData.slice(
    pagination.page * pagination.per_page,
    (pagination.page + 1) * pagination.per_page,
  );

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({
      ...pagination,
      per_page: parseInt(event.target.value, 10),
      page: 0,
    });
  };

  const handleNewNote = () => {
    console.log('New note clicked');
  };

  const handleViewDetails = (studentId) => {
    if (studentId) {
      navigate(`/students?view_student_id=${studentId}`);
    } else {
      toast.warning('Student profile not found');
    }
  };

  return (
    <Box>
      <Grid container>
        <Grid item xs={12} padding={3}>
          <Grid item xs={10} md={12} marginBottom={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography sx={{ fontWeight: '500', fontSize: '20px' }}>
                Behavior & Wellbeing
              </Typography>

              <AddButton
                title="New Note"
                // onClick={handleNewNote}
                onPress={() => navigate('/RatingStudents')}
              />
            </Box>
          </Grid>

          {/* Search */}
          <Grid item xs={12} md={4} marginBottom={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid container>
            <Grid item xs={12}>
              {loading ? (
                <Grid container>
                  <Grid
                    item
                    xs={12}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    <ActivityIndicator size={20} />
                  </Grid>
                </Grid>
              ) : error ? (
                <ErrorPrompt
                  title="Server Error"
                  message="Unable to retrieve behavior records."
                />
              ) : paginatedData.length === 0 ? (
                <Fallbacks
                  severity="evaluation"
                  title="No Behavior Records Found"
                  description="Behavior and wellbeing records will be listed here."
                  sx={{ paddingTop: 6 }}
                />
              ) : (
                <TableContainer
                // sx={{
                //   minHeight: '66dvh',
                // }}
                >
                  <Table
                    aria-label="behavior table"
                    sx={{ minWidth: 650, bgcolor: 'white' }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Note</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map((record) => (
                        <TableRow
                          key={record.id}
                          sx={{
                            ':hover': {
                              backgroundColor: theme.palette.grey[50],
                            },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {record.date}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {record.student}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ID: {record.studentId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={record.category}
                              color={getCategoryColor(record.category)}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>

                          <TableCell sx={{ maxWidth: 300 }}>
                            <Typography variant="body2" color="text.secondary">
                              {record.note}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ width: '80%' }}>
                              <LinearProgress
                                variant="determinate"
                                value={getSeverityPercentage(record.severity)}
                                color={
                                  record.severity >= 3
                                    ? 'error'
                                    : record.severity === 2
                                      ? 'warning'
                                      : 'success'
                                }
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleViewDetails(record.studentId)}
                                sx={{
                                  textTransform: 'none',
                                  minWidth: 'auto',
                                  px: 2,
                                }}
                              >
                                View Student
                              </Button>

                              <DotMenu />
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={filteredData.length}
                    page={pagination.page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pagination.per_page}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                </TableContainer>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <ToastContainer />
    </Box>
  );
}
