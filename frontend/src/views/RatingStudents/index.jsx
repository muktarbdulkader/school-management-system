import React, { useEffect } from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Rating,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  useTheme,
  TablePagination,
  TableRow,
  List,
  ListItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import PastRatingsTable from './components/PastRatingCard';
import StudentRatingsPopup from './components/StudentRatingsPopup';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import RatingModal from './components/rating-modal';
import { toast, ToastContainer } from 'react-toastify';
import SuccessModal from './components/SuccessModal';
import Fallbacks from 'utils/components/Fallbacks';
import { DotMenu } from 'ui-component/menu/DotMenu';
import { ratings } from 'menu-items/ratings';

export default function RatingStudents() {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openPopup, setOpenPopup] = useState(false);

  const findStudentById = (students, studentId) => {
    return students.find((s) => s.student_id === studentId) || null;
  };

  const [recentFeedback, setRecentFeedback] = useState({
    your_recent_feedback: {
      total_ratings_submitted: 0,
      last_feedback_day: null,
      average_rating: 'N/A',
    },
    feedback_list: [],
  });

  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setOpenPopup(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenRatingModal = (staff) => {
    setSelectedStaff(staff);
    setRatingModalOpen(true);
  };

  const handleCloseRatingModal = () => {
    setRatingModalOpen(false);
  };

  const handleFetchingEligibleUsers = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.teachersMyStudents}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setEligibleUsers(responseData.data);
        console.log(responseData.data);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRatings = async (studentId) => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.teachersStudentBehaviorRatings}${studentId}/`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };
    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json(); // backend wraps everything inside `data`
      return responseData.data;
    } catch (error) {
      console.error('Error fetching ratings for student:', studentId, error);
      return null;
    }
  };

  const handleFetchingRecentFeedback = async () => {
    setLoading(true);
    try {
      const students = eligibleUsers;
      if (students.length === 0) {
        setRecentFeedback({
          your_recent_feedback: {
            total_ratings_submitted: 0,
            last_feedback_day: null,
            average_rating: 'N/A',
          },
          feedback_list: [],
        });
        return;
      }
      const results = await Promise.all(
        students.map((eligible) => fetchStudentRatings(eligible.student_id)),
      );

      const feedbackList = results.filter(Boolean).map((res) => {
        const { student, statistics, ratings } = res;

        return {
          student_id: student.id,
          student_name: student.full_name,
          total_ratings: statistics.total_ratings,
          average_rating: statistics.average_rating,
          urgent_count: statistics.urgent_ratings_count,
          last_feedback_day: ratings.length > 0 ? ratings[0].rated_on : null, // assuming most recent first
          ratings,
        };
      });

      // Optionally compute teacher-wide summary
      const totalRatingsSubmitted = feedbackList.reduce(
        (acc, s) => acc + s.total_ratings,
        0,
      );
      const lastFeedbackDay =
        feedbackList.length > 0
          ? feedbackList
            .map((s) => s.last_feedback_day)
            .sort((a, b) => new Date(b) - new Date(a))[0]
          : null;
      const averageRating =
        feedbackList.length > 0
          ? (
            feedbackList.reduce((acc, s) => acc + s.average_rating, 0) /
            feedbackList.length
          ).toFixed(2)
          : 'N/A';

      setRecentFeedback({
        your_recent_feedback: {
          total_ratings_submitted: totalRatingsSubmitted,
          last_feedback_day: lastFeedbackDay,
          average_rating: averageRating,
        },
        feedback_list: feedbackList,
      });
      console.log('Recent feedback data:', feedbackList);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchingEligibleUsers();
  }, []);

  useEffect(() => {
    handleFetchingRecentFeedback();
  }, [eligibleUsers]);

  const handleSubmitRating = async (
    rating,
    message,
    subject,
    category,
    subCategory,
    priority,
  ) => {
    setIsAddingRate(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.teachersRateBehavior}`;
      console.log('Submitting rating for subject:', subject);
      console.log('Api Endpoint:', Api);
      console.log('Behavior ID:', selectedStaff.id);
      console.log('Rating:', rating);
      console.log('Message:', message);
      console.log('student_id:', selectedStaff.id);
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };
      console.log('day and time:', new Date().toISOString());

      const payload = {
        student_id: selectedStaff.student_id,
        category: category,
        notes: message,
        rating: rating,
        rated_on: new Date().toISOString().split('T')[0],
      };
      console.log('Payload:', payload);
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });
      console.log('Response status:', response);
      const responseData = await response.json();

      if (responseData.success) {
        console.log('Rating submitted successfully:', responseData);
        setSuccessModalOpen(true);
        handleFetchingEligibleUsers();
        handleFetchingRecentFeedback();
      } else {
        toast.error(responseData.message || 'Failed to submit rating');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred while submitting rating');
    } finally {
      setIsAddingRate(false);
      handleCloseRatingModal();
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight="700" mb={1}>
            Ratings & Comments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Provide feedback to improve your school experience.
          </Typography>
        </Box>
      </Box>

      <Card
        sx={{
          mb: 4,
          borderRadius: 2,
          backgroundColor: '#F9FAFB',
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={3}>
            Your Recent Feedback
          </Typography>

          <Grid container alignItems="center">
            {/* Total Ratings Submitted */}
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" mb={0.5}>
                Total Ratings Submitted
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {recentFeedback?.your_recent_feedback
                  ?.total_ratings_submitted || 0}
              </Typography>
            </Grid>

            {/* Divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: 'none', md: 'block' },
                mx: 2,
                borderColor: '#E5E7EB',
              }}
            />

            {/* Last Submitted */}
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" mb={0.5}>
                Last Submitted
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {recentFeedback?.your_recent_feedback?.last_feedback_day
                  ? new Date(
                    recentFeedback.your_recent_feedback.last_feedback_day,
                  ).toLocaleDateString()
                  : 'No feedback yet'}
              </Typography>
            </Grid>

            {/* Divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: 'none', md: 'block' },
                mx: 2,
                borderColor: '#E5E7EB',
              }}
            />
          </Grid>
        </CardContent>
      </Card>
      {/* Filter Tabs and Search */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
      >
        <Typography variant="h2">Student</Typography>

        <TextField
          placeholder="Search staff to rate..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Students List */}
      <Card
        sx={{ mb: 4, borderRadius: 2, bgcolor: 'white', boxShadow: 'none' }}
      >
        <CardContent sx={{ p: 3 }}>
          <TableContainer>
            <Table aria-label="students table">
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Last Rated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eligibleUsers?.length > 0 ? (
                  eligibleUsers.map((student) => (
                    <TableRow key={student.id} hover>
                      {/* Student Name */}
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar
                            src={
                              student.avatar ||
                              '/placeholder.svg?height=40&width=40'
                            }
                            sx={{ width: 40, height: 40, mr: 2 }}
                          />
                          <Typography variant="body2" fontWeight="600">
                            {student.full_name || student.name}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Rating */}
                      <TableCell>
                        {recentFeedback.feedback_list &&
                          findStudentById(
                            recentFeedback.feedback_list,
                            student.student_id,
                          ) ? (
                          <Box display="flex" alignItems="center">
                            <Rating
                              value={
                                findStudentById(
                                  recentFeedback.feedback_list,
                                  student.student_id,
                                )?.average_rating || 0
                              }
                              readOnly
                              size="small"
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              ml={1}
                            >
                              {student.rating}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not rated yet
                          </Typography>
                        )}
                      </TableCell>

                      {/* Last Rated */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {recentFeedback.feedback_list &&
                            findStudentById(
                              recentFeedback.feedback_list,
                              student.student_id,
                            )
                            ? findStudentById(
                              recentFeedback.feedback_list,
                              student.student_id,
                            ).last_feedback_day
                            : '-'}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        {student.hasRating ? (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            endIcon={<ChevronRightIcon />}
                            onClick={() => handleOpenRatingModal(student)}
                          >
                            Update Rating
                          </Button>
                        ) : (
                          <DotMenu
                            onRate={() => handleOpenRatingModal(student)}
                            onView={() => console.log('View')}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Fallbacks
                        severity="Rating"
                        title="Students Not Found"
                        description="Students information will be displayed here."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {eligibleUsers?.length > 5 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={eligibleUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Rating Modal */}
      {selectedStaff && (
        <RatingModal
          open={ratingModalOpen}
          onClose={handleCloseRatingModal}
          person={{
            name: selectedStaff.full_name || selectedStaff.name || 'Student',
            title: `Student${selectedStaff.class ? ` • ${selectedStaff.class}` : ''}${selectedStaff.section ? ` / ${selectedStaff.section}` : ''}`,
            avatar: selectedStaff.avatar,
          }}
          onSubmit={handleSubmitRating}
        />
      )}

      {/* Past Ratings */}
      <Typography variant="h5" fontWeight="600" mb={3}>
        Your Past Ratings
      </Typography>
      <PastRatingsTable
        recentFeedback={recentFeedback}
        handleViewDetails={handleViewDetails}
      />

      <StudentRatingsPopup
        open={openPopup}
        onClose={() => setOpenPopup(false)}
        student={selectedFeedback}
      />
      <ToastContainer />
      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />
    </Box>
  );
}
