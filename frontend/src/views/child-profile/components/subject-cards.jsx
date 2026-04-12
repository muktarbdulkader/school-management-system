// subject-cards.js
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  LinearProgress,
} from '@mui/material';
// import { SubjectDetailModal } from './subject-detail-modal';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import { SubjectDetailModal } from './SubjectDetail';

export function SubjectCards({ data, studentId }) {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Format subjects data
  const formattedSubjects = data.subjects.map((subject) => ({
    id: subject.id,
    subject_id: subject.subject_id,
    name: subject.subject_name,
    instructor: subject.teacher_name,
    progress: subject.progress || 0,
    lastUpdated: new Date(subject.enrolled_on).toLocaleDateString(),
  }));

  // Function to handle view details click
  const handleViewDetails = async (subject) => {
    setSelectedSubject(subject);
    setDialogOpen(true);
    setLoading(true);
    setError(null);

    try {
      const token = await GetToken();
      const apiUrl = `${Backend.auth}${Backend.parentStudentsParentSubjectObjectives}${studentId}/${subject.subject_id}/`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subject details');
      }

      const responseData = await response.json();

      if (responseData.success) {
        setDetailData(responseData.data);
      } else {
        throw new Error(responseData.message || 'No subject details available');
      }
    } catch (err) {
      setError('Failed to load subject details. Please try again.');
      console.error('Error loading subject details:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSubject(null);
    setDetailData(null);
  };

  return (
    <>
      <Grid container spacing={3} mb={2}>
        {formattedSubjects.map((subject, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    fontWeight="600"
                    gutterBottom
                  >
                    {subject.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Instructor: {subject.instructor}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3, flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h4"
                      component="span"
                      fontWeight="bold"
                      color="primary.main"
                    >
                      {subject.progress}%
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={subject.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                    onClick={() => handleViewDetails(subject)}
                  >
                    View Details
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Enrolled on: {subject.lastUpdated}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detail Dialog */}
      <SubjectDetailModal
        open={dialogOpen}
        onClose={handleCloseDialog}
        subject={selectedSubject}
        studentId={studentId}
        loading={loading}
        error={error}
        detailData={detailData}
      />
    </>
  );
}
