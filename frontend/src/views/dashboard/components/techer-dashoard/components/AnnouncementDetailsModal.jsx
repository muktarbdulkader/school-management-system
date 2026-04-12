import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Chip,
  Stack,
  Divider,
  Box,
  Grid,
  CircularProgress,
  Button,
} from '@mui/material';
import { Close } from '@mui/icons-material';

/**
 * Polished Announcement Details modal with enhanced typography hierarchy
 * - Clear visual distinction between title, headings, labels, and content
 * - Improved readability through proper font sizing and weights
 * - Better information architecture and scannability
 */
const AnnouncementDetailsModal = ({ open, onClose, announcementDetails, loading = false }) => {
  if (!announcementDetails && !loading) return null;

  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

  const getUrgencyColor = (urgency) => {
    switch ((urgency || '').toUpperCase()) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return date || '—';
    }
  };

  const formatDateTime = (date) => {
    try {
      return new Date(date).toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return date || '—';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="announcement-details-title"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography 
          id="announcement-details-title" 
          variant="h5" 
          component="h2" 
          fontWeight={700}
          fontSize={{ xs: '1.5rem', sm: '1.75rem' }}
        >
          Announcement Details
        </Typography>

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : announcementDetails ? (
          <Stack spacing={3}>
            {/* Title */}
            <Box>
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Title
              </Typography>
              <Typography
                variant="h6"
                component="h3"
                sx={{ 
                  fontWeight: 700, 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  lineHeight: 1.3,
                  color: 'text.primary'
                }}
              >
                {announcementDetails.title || '—'}
              </Typography>
            </Box>

            {/* Message */}
            <Box>
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Message
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.6,
                  color: 'text.primary'
                }}
              >
                {announcementDetails.message || '—'}
              </Typography>
            </Box>

            <Divider />

            {/* Event Details */}
            <Box>
              <Typography 
                variant="subtitle1" 
                color="text.primary" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  mb: 2
                }}
              >
                Event Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom 
                    sx={{ fontWeight: 600 }}
                  >
                    Event Date
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ fontWeight: 500 }}
                  >
                    {formatDate(announcementDetails.event_date)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom 
                    sx={{ fontWeight: 600 }}
                  >
                    Start Time
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ fontWeight: 500 }}
                  >
                    {announcementDetails.start_time || 'Not specified'}
                  </Typography>
                </Grid>

                {announcementDetails.end_time && announcementDetails.end_time !== '00:00:00' && (
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      gutterBottom 
                      sx={{ fontWeight: 600 }}
                    >
                      End Time
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ fontWeight: 500 }}
                    >
                      {announcementDetails.end_time}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Divider />

            {/* Metadata */}
            <Box>
              <Typography 
                variant="subtitle1" 
                color="text.primary" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  mb: 2
                }}
              >
                Announcement Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom 
                    sx={{ fontWeight: 600 }}
                  >
                    Created By
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ fontWeight: 500 }}
                  >
                    {announcementDetails.created_by || '—'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom 
                    sx={{ fontWeight: 600 }}
                  >
                    Urgency Level
                  </Typography>
                  <Chip
                    label={announcementDetails.urgency || 'N/A'}
                    color={getUrgencyColor(announcementDetails.urgency)}
                    size="small"
                    sx={{ 
                      textTransform: 'capitalize', 
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}
                    aria-label={`Urgency level ${announcementDetails.urgency || 'unknown'}`}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom 
                    sx={{ fontWeight: 600 }}
                  >
                    Created At
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ fontWeight: 500 }}
                  >
                    {formatDateTime(announcementDetails.created_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Audience */}
            {announcementDetails.audience_roles_names && announcementDetails.audience_roles_names.length > 0 && (
              <Box>
                <Typography 
                  variant="subtitle1" 
                  color="text.primary" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    mb: 2
                  }}
                >
                  Target Audience
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {announcementDetails.audience_roles_names.map((role, index) => (
                    <Chip 
                      key={index} 
                      label={role} 
                      variant="outlined" 
                      size="small" 
                      sx={{ 
                        mb: 1, 
                        fontWeight: 500,
                        fontSize: '0.8rem'
                      }} 
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        ) : (
          <Typography 
            variant="body1" 
            color="text.secondary" 
            textAlign="center" 
            py={2}
            sx={{ fontSize: '1.1rem' }}
          >
            No announcement details available.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AnnouncementDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  announcementDetails: PropTypes.object,
  loading: PropTypes.bool,
};

export default AnnouncementDetailsModal;