import React, { useEffect } from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Tabs,
  Tab,
  Rating,
  IconButton,
  CardActionArea,
  Divider,
  Link,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import StaffCard from './components/StaffCard';
import PastRatingCard from './components/PastRatingCard';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import RatingModal from './components/rating-modal';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import SuccessModal from './components/SuccessModal';

export default function RatingsAndComments() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibleUsers, setEligibleUsers] = useState([]);
  // const [loading, setLoading] = useState([]);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [loadingEligibleUsers, setLoadingEligibleUsers] = useState(false);
  const [loadingRecentFeedback, setLoadingRecentFeedback] = useState(false);

  const [recentFeedback, setRecentFeedback] = useState({
    your_recent_feedback: {
      total_ratings_submitted: 0,
      last_feedback_day: null,
      average_rating: 'N/A',
    },
    feedback_list: [],
  });

  const user = useSelector((state) => state.user.user);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  const handleOpenRatingModal = (staff) => {
    setSelectedStaff(staff);
    setRatingModalOpen(true);
  };

  const handleCloseRatingModal = () => {
    setRatingModalOpen(false);
  };

  const handleFetchingEligibleUsers = async () => {
    setLoadingEligibleUsers(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationFeedbacksEligibleUsers}`;
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
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingEligibleUsers(false);
    }
  };

  const handleFetchingRecentFeedback = async () => {
    setLoadingRecentFeedback(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationFeedbacksParentFeedback}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setRecentFeedback(responseData.data);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingRecentFeedback(false);
    }
  };

  useEffect(() => {
    handleFetchingEligibleUsers();
    handleFetchingRecentFeedback();
  }, []);

  const handleSubmitRating = async (rating, message, subject) => {
    setIsAddingRate(true);
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.communicationFeedbacksParentFeedback}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const payload = {
        feedbacked: selectedStaff.id, // The user being rated
        parent: user.id, // The current user submitting the rating
        subject: subject,
        message: message,
        rating: rating,
      };

      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (responseData.success) {
        // toast.success('Rating submitted successfully!');
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

            {/* Average Rating */}
            {/* <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary" mb={0.5}>
                Average Rating
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={700}>
                  {typeof recentFeedback?.your_recent_feedback
                    ?.average_rating === 'number'
                    ? recentFeedback.your_recent_feedback.average_rating.toFixed(
                        2,
                      )
                    : recentFeedback?.your_recent_feedback?.average_rating ||
                      'N/A'}
                </Typography>
                {typeof recentFeedback?.your_recent_feedback?.average_rating ===
                  'number' && (
                  <Rating
                    value={recentFeedback.your_recent_feedback.average_rating}
                    precision={0.1}
                    readOnly
                    size="small"
                  />
                )}
              </Box>
            </Grid> */}
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
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          TabIndicatorProps={{ style: { display: 'none' } }}
          sx={{
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            p: 0.5,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minWidth: 'auto',
              px: 2,
              borderRadius: '6px',
              color: '#374151',
            },
            '& .MuiTab-root.Mui-selected': {
              backgroundColor: '#2563EB',
              color: '#fff',
            },
          }}
        >
          <Tab label="All" />
          <Tab label="Teachers" />
          <Tab label="Principal" />
          <Tab label="School" />
          <Tab label="Staff" />
        </Tabs>

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

      <Grid container spacing={3} mb={6}>
        {loadingEligibleUsers ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box>
                      <Skeleton variant="text" width={150} height={24} />
                      <Skeleton variant="text" width={100} height={20} />
                    </Box>
                  </Box>
                  <Skeleton variant="rectangular" width="100%" height={36} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : eligibleUsers.length > 0 ? (
          eligibleUsers.map((staff) => (
            <Grid item xs={12} sm={6} md={4} key={staff.id}>
              <StaffCard staff={staff} onRateClick={handleOpenRatingModal} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary">
              No staff members found.
            </Typography>
          </Grid>
        )}
      </Grid>

      {selectedStaff && (
        <RatingModal
          open={ratingModalOpen}
          onClose={handleCloseRatingModal}
          person={{
            name: selectedStaff.full_name || selectedStaff.name,
            title: `${selectedStaff.role}${selectedStaff.subject ? ` • ${selectedStaff.subject}` : ''}`,
            avatar: selectedStaff.avatar,
          }}
          onSubmit={handleSubmitRating}
        />
      )}

      <Typography variant="h5" fontWeight="600" mb={3}>
        Your Past Ratings
      </Typography>
      <Grid container spacing={3}>
        {loadingRecentFeedback ? (
          Array.from({ length: 2 }).map((_, index) => (
            <Grid item xs={12} md={6} key={`feedback-skeleton-${index}`}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box>
                      <Skeleton variant="text" width={150} height={24} />
                      <Skeleton variant="text" width={100} height={20} />
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Skeleton variant="text" width={80} height={24} />
                    <Box ml="auto">
                      <Skeleton variant="text" width={100} height={20} />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Box mt={2}>
                    <Skeleton variant="text" width={120} height={20} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : recentFeedback?.feedback_list?.length > 0 ? (
          recentFeedback.feedback_list.map((feedback) => (
            <Grid item xs={12} md={6} key={feedback.id}>
              <PastRatingCard
                rating={{
                  id: feedback.id,
                  name: feedback.feedbacked_detail.full_name,
                  role: feedback.feedbacked_detail.roles[0],
                  subject: feedback.subject,
                  avatar: '/placeholder.svg?height=40&width=40',
                  rating: feedback.rating,
                  date: new Date(feedback.submitted_at).toLocaleDateString(),
                  comment: feedback.message,
                  status: 'Visible to Admin',
                }}
              />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary">
              No past ratings found.
            </Typography>
          </Grid>
        )}
      </Grid>

      <ToastContainer />
      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />
    </Box>
  );
}
